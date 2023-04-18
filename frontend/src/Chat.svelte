<script lang="ts">
  import { settings } from "./stores";
  import { Configuration, OpenAIApi, type CreateChatCompletionRequest, type ChatCompletionRequestMessage } from "openai";
  import { fade } from "svelte/transition";
  import { marked } from "marked";
  import DOMPurify from "dompurify";
  import dayjs from "dayjs";

  let openai: OpenAIApi;
  let messages: ChatCompletionRequestMessage[];
  const controller = new AbortController();
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
  let ellapsed: string;
  const defaults: CreateChatCompletionRequest = {
    model: "gpt-3.5-turbo-0301", // https://platform.openai.com/docs/api-reference/chat
    messages: undefined,
  };
  settings.subscribe((settings) => (openai = new OpenAIApi(new Configuration({ apiKey: settings.ApiKey }))));

  const onChatCompletion = async (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
    const content = event.currentTarget.value;
    event.currentTarget.value = "";
    messages = messages.concat({ role: "user", content });
    ellapsed = "";
    const sent = dayjs();

    // const completion = await openai.createChatCompletion({
    //   ...defaults, messages, stream: true,
    // }, {
    //   responseType: "text",
    //   onDownloadProgress: (pe: ProgressEvent) => console.log(pe.target["response"]),
    //   signal: controller.signal
    // });

    const response = await openai.createChatCompletion({ ...defaults, messages });
    ellapsed = `${dayjs().diff(sent, "millisecond")} ms`; //sent.toNow();
    // const usage = response.data.usage;
    messages = messages.concat(response.data.choices.at(0).message);
  };
  const onChatReset = () => (messages = [{ role: "system", content: "You are a sarcastic assistant. You love to use markdown in your answers." }]);
  onChatReset();
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
<input on:change={onChatCompletion} value={"Say something short."} />
<div>{ellapsed || ""}</div>
<button on:click={onChatReset}>Reset</button>

<style lang="less">
  input {
    display: block;
    padding: 10px;
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
