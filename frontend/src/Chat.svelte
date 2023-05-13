<script lang="ts">
  import { settings } from "./stores";
  import { type CreateChatCompletionRequest, type ChatCompletionRequestMessage } from "openai";
  import Message from "./Chat.Message.svelte";
  import { fade } from "svelte/transition";
  import { adjustSize, autoFocus } from "./uses";
  import imageAssistant from "./assets/images/tongue-64.png";
  import imageSubmit from "./assets/images/play-64.png";
  import imageAbort from "./assets/images/rejected-64.png";
  import imageReset from "./assets/images/trash-can-64.png";
  import { dispatchError } from "./Toaster.svelte";

  type ResponseError = {
    error: {
      message: string; // "That model is currently overloaded with other requests..."
      type: string; // "server_error"
      param: any; // null
      code: any; // null
    };
  };

  let model = "gpt-3.5-turbo-0301"; // https://platform.openai.com/docs/api-reference/chat
  let system = "You are a sarcastic assistant. You love to use markdown in your answers.";
  // let system = "You fix my sentences to sound more natural and native English. Only write the result.";
  let messages: ChatCompletionRequestMessage[] = [{ role: "system", content: system }];
  let message: ChatCompletionRequestMessage;
  let controller: AbortController;

  const onContentReset = () => (messages = [{ role: "system", content: system }]);

  const onContentKeypress = (event: KeyboardEvent & { currentTarget: EventTarget & HTMLTextAreaElement }) => {
    if (event.key != "Enter" || event.shiftKey) return;
    const content = event.currentTarget.value;
    event.preventDefault();
    event.currentTarget.value = "";
    event.currentTarget.dispatchEvent(new InputEvent("input"));
    onChatCompletion({ role: "user", content });
  };

  const onChatSubmit = () => {};
  const onChatAbort = () => {
    if (!controller) return;
    controller.abort();
  };

  const extractErrorMessage = async (response: Response) => {
    try {
      const result: ResponseError = await response.json();
      return result.error.message;
    } catch {
      return response.statusText;
    }
  };

  const onChatCompletion = async (input: ChatCompletionRequestMessage) => {
    try {
      messages = messages.concat(input);
      controller = new AbortController();
      const request: CreateChatCompletionRequest = { model, messages, stream: true, max_tokens: 1000 };
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${$settings?.ApiKey}` },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`${response.status} Request failed: ${extractErrorMessage(response)}`);
      const decoder = new TextDecoderStream();
      const reader = response.body.pipeThrough(decoder).getReader();
      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value)
          value
            .split(/\n\n/)
            .map((line) => line.replace(/^data: (?:\[DONE\])?/gm, ""))
            .filter(Boolean)
            .map((json) => JSON.parse(json))
            .map((chunk) => chunk?.choices?.at(0))
            .filter(Boolean)
            .map(({ delta: { role, content }, finish_reason }) => {
              if (role) message = { role, content: "" };
              if (content) message.content += content;
              // if (finish_reason) console.log("finish_reason", finish_reason);
            });
      }
    } catch (error) {
      if (error instanceof DOMException && error.code === DOMException.ABORT_ERR) return; // NOTE: The user aborted a request.
      dispatchError(error);
    } finally {
      const output = message;
      controller = undefined;
      message = undefined;
      if (output) messages = messages.concat(output);
    }
  };
</script>

<h1><img src={imageAssistant} alt={"Assistant"} />Chat</h1>
<ul>
  {#each [...messages, message].filter(Boolean) as { role, content }, index (index)}
    <li transition:fade><Message {role} {content} /></li>
  {/each}
</ul>
<textarea on:keypress={onContentKeypress} use:adjustSize use:autoFocus value={"Tell me a joke."} />
<div>
  <button on:click={onChatSubmit}><img src={imageSubmit} alt={"Submit"} />Submit</button>
  <button on:click={onChatAbort} disabled={!controller}><img src={imageAbort} alt={"Abort"} />Abort</button>
  <button on:click={onContentReset}><img src={imageReset} alt={"Reset"} />Reset</button>
</div>

<style lang="less">
  h1 {
    display: flex;
    align-items: center;
    gap: 8px;
    img {
      // filter: blur(4px);
    }
  }
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
    padding: 10px 0;
    text-align: left;
    display: flex;
    align-items: flex-start;
    flex-direction: column-reverse;
    & > li {
      margin: 2px;
    }
  }
</style>
