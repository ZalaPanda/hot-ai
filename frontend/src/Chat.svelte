<script lang="ts">
  import { beforeUpdate, afterUpdate, tick } from "svelte";
  import { fade } from "svelte/transition";
  import { type CreateChatCompletionRequest, type ChatCompletionRequestMessage } from "openai";
  import { presets, settings, type Preset } from "./stores";
  import { adjustSize, autoFocus } from "./uses";
  import { dispatchError } from "./Toaster.svelte";
  import Search from "./Chat.Search.svelte";
  import Message from "./Chat.Message.svelte";
  import imageSubmit from "./assets/images/play-64.png";
  import imageAbort from "./assets/images/rejected-64.png";
  import imageReset from "./assets/images/trash-can-64.png";

  type ResponseError = {
    error: {
      message: string; // "That model is currently overloaded with other requests..."
      type: string; // "server_error"
      param: any; // null
      code: any; // null
    };
  };

  let messageContainer: HTMLElement;
  let contentTextarea: HTMLTextAreaElement;
  let abortButton: HTMLButtonElement;

  let preset = $presets.at(0);
  let messages: ChatCompletionRequestMessage[] = [];
  let message: ChatCompletionRequestMessage;
  let controller: AbortController;
  let autoscroll: boolean;

  beforeUpdate(() => {
    if (!messageContainer) return;
    const { clientHeight, scrollTop, scrollHeight } = messageContainer;
    autoscroll = clientHeight + scrollTop > scrollHeight - 40;
  });
  afterUpdate(() => {
    if (!autoscroll) return;
    messageContainer.scrollTo(0, messageContainer.scrollHeight);
  });

  const onContentReset = () => {
    messages = [];
    contentTextarea.select();
  };

  const onContentKeypress = (event: KeyboardEvent & { currentTarget: EventTarget & HTMLTextAreaElement }) => {
    if (event.key != "Enter" || event.shiftKey) return;
    event.preventDefault();
    onChatCompletion();
  };

  const onLoadPreset = (selectedPreset: Preset) => () => {
    preset = selectedPreset;
    onContentReset();
  };

  const onPresetSystemChange = () => presets.update((presets) => presets.map((current) => (current.name === preset.name ? preset : current)));

  const onChatAbort = () => {
    if (controller) controller.abort();
  };

  const extractErrorMessage = async (response: Response) => {
    try {
      const result: ResponseError = await response.json();
      return result.error.message;
    } catch {
      return response.statusText;
    }
  };

  const onChatCompletion = async () => {
    try {
      const content = contentTextarea.value;
      contentTextarea.value = "";
      contentTextarea.dispatchEvent(new InputEvent("input"));
      if (content) messages = messages.concat({ role: "user", content });

      if (controller) controller.abort();
      controller = new AbortController();
      await tick();
      abortButton.focus();
      const request: CreateChatCompletionRequest = {
        model: $settings.model || "gpt-3.5-turbo",
        messages: [{ role: "system", content: preset.system }, ...messages],
        stream: true,
      };
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${$settings.apiKey}` },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`${response.status} Request failed: ${await extractErrorMessage(response)}`);
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
      await tick();
      contentTextarea.select();
    }
  };
</script>

<h1>
  {#each $presets as { name, system, image }}
    {@const active = preset.name === name}
    <button on:click={onLoadPreset({ name, system, image })}><img src={image} class:active alt={name} /></button>
  {/each}
  {preset.name}
</h1>
<section>
  <textarea use:adjustSize bind:value={preset.system} on:change={onPresetSystemChange} />
  <slot />
</section>
<ul bind:this={messageContainer}>
  {#each [...messages, message].filter(Boolean) as { role, content }, index (index)}
    <li transition:fade><Message {role} {content} /></li>
  {/each}
</ul>
<Search />
<section>
  <textarea on:keypress={onContentKeypress} disabled={!!controller} use:adjustSize use:autoFocus bind:this={contentTextarea} />
  <button on:click={onChatCompletion}><img src={imageSubmit} alt={"Submit"} /></button>
  <button on:click={onChatAbort} disabled={!controller} bind:this={abortButton}><img src={imageAbort} alt={"Abort"} /></button>
  <button on:click={onContentReset}><img src={imageReset} alt={"Reset"} /></button>
</section>

<style lang="less">
  h1 {
    --wails-draggable: drag;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 30px;
    background-color: #2e405c;
    user-select: none;
    -webkit-user-select: none;
    & > button > img {
      filter: blur(4px);
      &:hover,
      &.active {
        filter: none;
      }
    }
  }
  ul {
    list-style-type: none;
    scroll-behavior: smooth;
    padding: unset;
    text-align: left;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    overflow-y: auto;
    flex: 1 1;
    & > li {
      margin: 2px;
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
    font-family: "Nunito", sans-serif;
    font-size: 1em;
  }
  button {
    padding: 2px;
  }
  section {
    display: flex;
    align-items: center;
    gap: 8px;
    & > textarea {
      flex: 1 1;
    }
    & > button {
      flex: 0 0;
    }
  }
</style>
