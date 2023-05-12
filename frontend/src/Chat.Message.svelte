<svelte:options immutable={true} />

<script lang="ts">
  import { marked } from "marked";
  import DOMPurify from "dompurify";

  export let role: string;
  export let content: string;
  const options: marked.MarkedOptions = { headerIds: false, mangle: false };
  $: html = (content && DOMPurify.sanitize(marked.parse(content, options))) || undefined;
</script>

<span>{role}:</span>
<article class:user={role === "user"} class:assistant={role === "assistant"}>{@html html}</article>

<style lang="less">
  article {
    border-radius: 8px;
    padding: 1px 16px;
    &.user {
      background-color: #2a9d8f;
    }
    &.assistant {
      background-color: #1e293b;
    }
  }
</style>
