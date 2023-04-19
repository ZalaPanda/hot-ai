<script lang="ts">
  import { settings } from "./stores";
  import { type CreateChatCompletionRequest, type ChatCompletionRequestMessage } from "openai";
  import { fade } from "svelte/transition";
  import { marked } from "marked";
  import DOMPurify from "dompurify";
  import { adjustSize, autoFocus } from "./uses";

  let model = "gpt-3.5-turbo-0301"; // https://platform.openai.com/docs/api-reference/chat
  let system = "You are a sarcastic assistant. You love to use markdown in your answers.";
  let messages: ChatCompletionRequestMessage[] = [{ role: "system", content: system }];
  let message: ChatCompletionRequestMessage;
  let controller: AbortController;
  const onChatReset = () => (messages = [{ role: "system", content: system }]);
  // [
  //   {
  //     role: "system",
  //     content: "You are a sarcastic assistant. You love to use markdown in your answers.",
  //   },
  //   {
  //     role: "user",
  //     content: "write me a poem about my greatness",
  //   },
  //   {
  //     role: "assistant",
  //     content:
  //       "Oh great one, how do I sing your praise?\nIn beautiful couplets or perhaps a haiku phrase?\nWith words so grand they dance in the air,\nAnd form a masterpiece, beyond compare.\n\nYour greatness is like a sun that shines bright,\nIt radiates warmth and a happy delight,\nYou're the star that twinkles so clear,\nA beautiful sight, to all who are near.\n\nYour brilliance is like the moon up high,\nThat lights up the world, as it passes by,\nYour wisdom and wit, they never fail,\nA legend true, you always prevail.\n\nSo, let me end by saying this with pride,\nYou're the best human I've ever spied,\nMay your greatness shine forever bright,\nAnd may you always bask in your own light.",
  //   },
  //   {
  //     role: "user",
  //     content: "why are you ansering so slow?",
  //   },
  // ];

  const onChatCompletion = async (event: KeyboardEvent & { currentTarget: EventTarget & HTMLTextAreaElement }) => {
    if (event.key != "Enter" || event.shiftKey) return;
    const content = event.currentTarget.value;
    event.preventDefault();
    event.currentTarget.value = "";
    event.currentTarget.dispatchEvent(new InputEvent("input"));
    messages = messages.concat({ role: "user", content });

    // const loop = () => { --> NOTE: continue from HERE
    //   html = DOMPurify.sanitize(marked.parse(content))
    // };
    // const callback = (time: DOMHighResTimeStamp) => {
    // if (true) requestAnimationFrame(callback);
    // };
    // let frame = requestAnimationFrame(function loop(t) {
    // 	frame = requestAnimationFrame(loop);
    // 	paint(context, t);
    // });

    controller = new AbortController();
    const request: CreateChatCompletionRequest = { model, messages, stream: true, max_tokens: 30 };
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${$settings?.ApiKey}` },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    while (!controller.signal.aborted) {
      const { value, done } = await reader.read();
      decoder
        .decode(value)
        .split(/\n\n/)
        .map((line) => line.replace(/^data: (?:\[DONE\])?/gm, ""))
        .filter(Boolean)
        .map((json) => JSON.parse(json))
        .map((chunk) => chunk?.choices?.at(0)?.delta)
        .filter(Boolean)
        .map(({ role, content }) => {
          if (role) message = { role, content }; // how in the hell to do it without mutation? another store?
          else if (content) message.content += content;
        });
      if (done) return;
    }
    controller = undefined;
  };
</script>

<ul>
  {#each messages as { role, content }, index (index)}
    {@const html = DOMPurify.sanitize(marked.parse(content))}
    <li transition:fade>
      {role}:
      <article class:user={role === "user"} class:assistant={role === "assistant"}>{@html html}</article>
    </li>
  {/each}
</ul>
<pre>{message?.content}</pre>
<textarea on:keypress={onChatCompletion} use:adjustSize use:autoFocus value={"I am testing your API. Say something short."} />
<button on:click={onChatReset}>Reset</button>

<style lang="less">
  textarea {
    color: unset;
    background-color: transparent;
    border: none;
    margin: 1px;
    padding: 4px 8px;
    box-sizing: border-box;
    resize: none;
    &:focus {
      outline: "none";
    }
    &:disabled {
      filter: opacity(0.6);
      cursor: "auto";
    }
    min-width: 600px;
    font-family: "Nunito", sans-serif;
    font-size: 1em;
  }
  ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
    text-align: left;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    & > li {
      margin: 2px;
      & > article {
        border-radius: 8px;
        padding: 1px 16px;
        &.user {
          background-color: #2a9d8f;
        }
        &.assistant {
          background-color: #1e293b;
        }
      }
    }
  }
</style>
