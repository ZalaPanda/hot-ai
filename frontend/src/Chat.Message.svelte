<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { ClipboardSetText } from "../wailsjs/runtime";
  import { marked } from "marked";
  import DOMPurify from "dompurify";
  import { search } from "./stores";
  import { dispatchFocusChat } from "./Chat.svelte";
  import imageClipboard from "./assets/images/clipboard-64.png";
  import imageStar from "./assets/images/star-64.png";

  export let role: string | undefined = undefined;
  export let content: string | undefined = undefined;
  export let starred: boolean | undefined = undefined;

  const dispatch = createEventDispatcher();
  const options: marked.MarkedOptions = { headerIds: false, mangle: false, breaks: true, silent: true }; // NOTE: silent = no exceptions thrown

  $: expression = $search ? RegExp(new Option($search).innerHTML, "ig") : undefined;
  $: html =
    (content &&
      marked.parse(content, {
        ...options,
        walkTokens: (token: marked.Token) => {
          if ("tokens" in token) return;
          if ("text" in token && expression?.test(token["text"])) {
            token["text"] = token["text"].replace(expression, "⁅$&⁆");
          }
        },
        hooks: {
          preprocess: (markdown: string) => markdown,
          postprocess: (html: string) => DOMPurify.sanitize(html.replace(/⁅/g, "<mark>").replace(/⁆/g, "</mark>")),
        },
      })) ||
    undefined;
  const onCopyToClipboard = () => ClipboardSetText(content) && dispatchFocusChat();
  const onToggleStarred = () => dispatch("toggle-starred");
</script>

<article class:user={role === "user"} class:assistant={role === "assistant"} class:starred>
  <section>
    <button on:click={onToggleStarred}><img src={imageStar} alt={"Toggle starred"} /></button>
    <button on:click={onCopyToClipboard}><img src={imageClipboard} alt={"Copy to clipboard"} /></button>
  </section>
  {@html html}
</article>

<style lang="less">
  article {
    position: relative;
    border-radius: 8px;
    padding: 4px 12px;
    background-color: #333333;
    &.user {
      background-color: #2a9d8f;
    }
    &.assistant {
      background-color: #1f375a;
    }
    &.starred {
      box-shadow: 0 0 4px 2px #f5d367;
    }
    & > section > button > img {
      visibility: hidden;
    }
    & > section > button:focus > img,
    &:hover > section > button > img {
      visibility: visible;
    }
    & > section {
      & > button {
        padding: 0px;
      }
      display: flex;
      position: absolute;
      justify-content: flex-end;
      right: 0px;
      top: -16px;
    }
  }
</style>
