<svelte:options immutable={true} />

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { ClipboardSetText } from "../wailsjs/runtime";
  import { marked, type Token } from "marked";
  import DOMPurify from "dompurify";
  import { search } from "./stores";
  import { dispatchFocusChat } from "./Chat.svelte";
  import imageClipboard from "./assets/images/clipboard-64.png";
  import imageStar from "./assets/images/star-64.png";

  export let role: string | undefined = undefined;
  export let content: string | undefined = undefined;
  export let starred: boolean | undefined = undefined;
  let tokens: Token[] = [];
  let blocksParsed: string[] = [];
  let blocksMarked: string[] = [];

  const dispatch = createEventDispatcher();
  $: {
    const lexedTokens = marked.lexer(content || "");
    const keepToken = tokens.findLastIndex((token, index) => token.type === lexedTokens.at(index)?.type && token.raw === lexedTokens.at(index)?.raw);
    if (keepToken < tokens.length) {
      blocksParsed = [...blocksParsed.slice(0, keepToken), ...lexedTokens.slice(keepToken + 1).map((token) => DOMPurify.sanitize(marked.parser([token])))];
      tokens = lexedTokens;
    }
  }
  $: blocksMarked = $search ? blocksParsed.map((block) => block.replace(new RegExp($search, "gi"), "<mark>$&</mark>")) : blocksParsed;
  const onCopyToClipboard = () => dispatchFocusChat() && ClipboardSetText(content || "");
  const onToggleStarred = () => dispatch("toggle-starred");
</script>

<article class:user={role === "user"} class:assistant={role === "assistant"} class:starred>
  <section>
    <button on:click={onToggleStarred}><img src={imageStar} alt={"Toggle starred"} /></button>
    <button on:click={onCopyToClipboard}><img src={imageClipboard} alt={"Copy to clipboard"} /></button>
  </section>
  {#each blocksMarked as block}{@html block}{/each}
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
