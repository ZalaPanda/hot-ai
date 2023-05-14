<svelte:options immutable={true} />

<script lang="ts">
  import { marked } from "marked";
  import DOMPurify from "dompurify";
  import imageClipboard from "./assets/images/clipboard-64.png";

  export let role: string;
  export let content: string;
  let hover: boolean;

  const options: marked.MarkedOptions = { headerIds: false, mangle: false, breaks: true, silent: true }; // NOTE: silent = no exceptions thrown
  $: html = (content && DOMPurify.sanitize(marked.parse(content, options))) || undefined;

  const onToggleHover = (value: boolean) => () => (hover = value);
  const onCopyToClipboard = () => navigator.clipboard.writeText(content); // NOTE: available only in secure contexts
</script>

<article class:user={role === "user"} class:assistant={role === "assistant"} on:mouseenter={onToggleHover(true)} on:mouseleave={onToggleHover(false)}>
  <button on:click={onCopyToClipboard} class:hover><img src={imageClipboard} alt={"Copy to clipboard"} /></button>
  {@html html}
</article>

<style lang="less">
  button {
    display: none;
    position: absolute;
    right: 0px;
    bottom: 0px;
    width: 28px;
    height: 28px;
    margin: 9px;
    &.hover {
      display: block;
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
