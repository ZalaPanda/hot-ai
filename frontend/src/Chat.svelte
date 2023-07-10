<script context="module" lang="ts">
  export const dispatchFocusChat = () => window.dispatchEvent(new FocusEvent("focus-chat"));

  type ResponseError = {
    error: {
      message: string; // "That model is currently overloaded with other requests..."
      type: string; // "server_error"
      param: any; // null
      code: any; // null
    };
  };

  const extractErrorMessage = async (response: Response) => {
    try {
      const result: ResponseError = await response.json();
      return result.error.message;
    } catch {
      return response.statusText;
    }
  };

  const isWails = !!window["go"];
</script>

<script lang="ts">
  import { beforeUpdate, afterUpdate, tick, onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { EventsOff, EventsOn, WindowHide, WindowIsMaximised, WindowMaximise, WindowSetAlwaysOnTop, WindowShow, WindowUnmaximise } from "../wailsjs/runtime";
  import { SetToggleHotkey, SetWindowBounds } from "../wailsjs/go/main/App";
  import { presets, settings, type Preset } from "./stores";
  import { adjustSize, autoFocus } from "./uses";
  import { dispatchError } from "./Toaster.svelte";
  import Search, { dispatchToggleSearch } from "./Chat.Search.svelte";
  import Message from "./Chat.Message.svelte";
  import imageSubmit from "./assets/images/play-64.png";
  import imageAbort from "./assets/images/rejected-64.png";
  import imageReset from "./assets/images/trash-can-64.png";

  type CompletionMessage = {
    role?: "system" | "user" | "assistant" | "function";
    content: string;
    starred?: boolean;
  };
  type CompletionRequest = {
    model: string;
    messages: CompletionMessage[];
    stream: true;
  };

  let messageContainer: HTMLElement;
  let contentTextarea: HTMLTextAreaElement;
  let abortButton: HTMLButtonElement;

  let messages: CompletionMessage[] = [];
  let message: CompletionMessage;
  let controller: AbortController;
  let autoscroll: boolean;
  let isVisible: boolean = true;

  $: activePreset = $presets.at(0);

  beforeUpdate(() => {
    if (!messageContainer) return;
    const { clientHeight, scrollTop, scrollHeight } = messageContainer;
    autoscroll = clientHeight + scrollTop > scrollHeight - 40;
  });
  afterUpdate(() => {
    if (!autoscroll) return;
    messageContainer.scrollTo({ top: messageContainer.scrollHeight, behavior: "smooth" });
  });

  const onContentReset = () => {
    messages = messages.filter((message) => message.starred || !message.role).map(({ content }) => ({ content }));
    contentTextarea.select();
  };

  const onContentKeypress = (event: KeyboardEvent & { currentTarget: EventTarget & HTMLTextAreaElement }) => {
    if (event.key != "Enter" || event.shiftKey) return;
    event.preventDefault();
    onChatCompletion();
  };

  const onLoadPreset = (preset: Preset) => async () => {
    activePreset = preset;
    onContentReset();
    await tick();
    window.dispatchEvent(new Event("resize"));
  };

  const onPresetSystemChange = () => presets.update((presets) => presets.map((preset) => (preset === activePreset ? activePreset : preset)));

  const onChatAbort = () => controller?.abort();

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
      const request: CompletionRequest = {
        model: $settings.model || "gpt-3.5-turbo",
        messages: [{ role: "system", content: activePreset.system }, ...messages],
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

  const onHandleFocusChat = () => contentTextarea.select();

  const onHandleKeydown = (event: KeyboardEvent) => {
    if (event.key === "F11") {
      event.preventDefault();
      onToggleMaximise();
      return;
    }
    if (event.key === "F12") {
      event.preventDefault();
      onToggleAlwaysOnTop();
      return;
    }
    if (event.key === "F3" || (event.ctrlKey && event.key === "f")) {
      event.preventDefault();
      dispatchToggleSearch();
      return;
    }
    if (event.ctrlKey && ["1", "2", "3", "4", "5", "6"].includes(event.key)) {
      const preset = $presets.at(Number(event.key) - 1);
      if (!preset?.enabled) return;
      event.preventDefault();
      onLoadPreset(preset)();
      return;
    }
  };

  const onToggleMaximise = async () => {
    try {
      const isMaximized = !(await WindowIsMaximised());
      if (isMaximized) WindowMaximise();
      else WindowUnmaximise();
      settings.update((settings) => ({ ...settings, isMaximized }));
    } catch (error) {
      dispatchError(error);
    }
  };

  const onToggleAlwaysOnTop = async () => {
    try {
      const alwaysOnTop = !$settings.alwaysOnTop;
      WindowSetAlwaysOnTop(alwaysOnTop);
      settings.update((settings) => ({ ...settings, alwaysOnTop }));
    } catch (error) {
      dispatchError(error);
    }
  };

  const onHandleHotkeyPress = () => {
    const hasFocus = () => document.activeElement === contentTextarea;
    if (isVisible && hasFocus()) {
      WindowHide();
      isVisible = false;
    } else {
      WindowShow();
      contentTextarea.select();
      isVisible = true;
    }
  };

  const onHandleSaveBounds = (bounds: [number, number, number, number]) => {
    settings.update((settings) => ({ ...settings, bounds }));
  };

  const onMessageToggleStarred = (index: number) => () => {
    const messageInstance = messages.at(index);
    if (!messageInstance) return;
    if (!messageInstance.role) messages = messages.filter((message) => message !== messageInstance);
    else messages = messages.map((message) => (message === messageInstance ? { ...messageInstance, starred: !messageInstance.starred } : message));
    console.log(index, messages[index]);
    contentTextarea.select();
  };

  onMount(() => {
    try {
      const { hotKey, alwaysOnTop, isMaximized, bounds } = $settings;
      if (!isWails) return;

      window.addEventListener("keydown", onHandleKeydown);
      window.addEventListener("focus-chat", onHandleFocusChat);
      EventsOn("hotkey-press", onHandleHotkeyPress);
      EventsOn("save-bounds", onHandleSaveBounds);

      (async () => {
        try {
          if (isMaximized) WindowMaximise();
          else WindowUnmaximise();

          WindowSetAlwaysOnTop(alwaysOnTop);
          WindowShow();

          if (hotKey) await SetToggleHotkey(hotKey.modifiers, hotKey.key);
          if (bounds) await SetWindowBounds(bounds);
        } catch (error) {
          dispatchError(error);
        }
      })();
    } catch (error) {
      dispatchError(error);
    }
    return () => {
      window.removeEventListener("keydown", onHandleKeydown);
      window.removeEventListener("focus-chat", onHandleFocusChat);
      EventsOff("hotkey-press");
      EventsOff("save-bounds");
    };
  });
</script>

<h1>
  {#each $presets as preset}
    <button on:click={onLoadPreset(preset)} hidden={!preset.enabled}>
      <img src={preset.image} class:active={activePreset === preset} alt={preset.name} />
    </button>
  {/each}
  <span>{activePreset.name}</span>
</h1>
<section class:system={true}>
  <textarea use:adjustSize bind:value={activePreset.system} on:change={onPresetSystemChange} />
  <slot />
</section>
<ul bind:this={messageContainer}>
  {#each [...messages, message].filter(Boolean) as messageInstance, index (index)}
    <li transition:fade><Message {...messageInstance} on:toggle-starred={onMessageToggleStarred(index)} /></li>
  {/each}
</ul>
<Search />
<section class:content={true}>
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
    & > button {
      &[hidden] {
        display: none;
      }
      & > img {
        filter: blur(4px);
        &:hover,
        &.active {
          filter: none;
        }
      }
    }
    span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  ul {
    list-style-type: none;
    scroll-behavior: smooth;
    margin-left: -8px;
    padding: 12px 12px;
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    overflow-y: auto;
    flex: 1 1;
    gap: 4px;
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
    gap: 4px;
    &.system {
      padding-top: 8px;
      padding-bottom: 4px;
    }
    &.content {
      padding-top: 8px;
    }
    & > textarea {
      flex: 1 1;
    }
    & > button {
      flex: 0 0;
    }
  }
</style>
