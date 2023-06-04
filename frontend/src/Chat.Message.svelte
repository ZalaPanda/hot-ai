<svelte:options immutable={true} />

<script lang="ts">
  import { marked } from "marked";
  import { ClipboardSetText } from "../wailsjs/runtime";
  import DOMPurify from "dompurify";
  import imageClipboard from "./assets/images/clipboard-64.png";

  export let role: string;
  export let content: string;

  const options: marked.MarkedOptions = { headerIds: false, mangle: false, breaks: true, silent: true }; // NOTE: silent = no exceptions thrown
  $: html = (content && DOMPurify.sanitize(marked.parse(content, options))) || undefined;

  const onCopyToClipboard = () => ClipboardSetText(content);
</script>

<article class:user={role === "user"} class:assistant={role === "assistant"}>
  <button on:click={onCopyToClipboard}><img src={imageClipboard} alt={"Copy to clipboard"} /></button>
  {@html html}
</article>

<style lang="less">
  article:hover > button > img {
    visibility: visible;
  }
  button {
    padding: 4px 2px;
    position: absolute;
    bottom: 0;
    right: 0;
    & > img {
      visibility: hidden;
    }
    &:focus > img {
      visibility: visible;
    }
  }
  article {
    position: relative;
    border-radius: 8px;
    padding: 4px 12px;
    &.user {
      background-color: #2a9d8f;
    }
    &.assistant {
      background-color: #1f375a;
    }
  }
</style>
