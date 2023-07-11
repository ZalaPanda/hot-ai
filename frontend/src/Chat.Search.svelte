<script context="module" lang="ts">
  export const dispatchToggleSearch = () => window.dispatchEvent(new FocusEvent("toggle-search"));
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { search } from "./stores";
  import { autoFocus } from "./uses";
  import imageSearch from "./assets/images/search-64.png";
  import { dispatchFocusChat } from "./Chat.svelte";

  let searchInput: HTMLInputElement;

  const onFocusSearch = () => {
    searchInput.select();
  };

  const onHideSearch = () => {
    $search = undefined;
    dispatchFocusChat();
  };

  const onToggleSearch = () => {
    if ($search === undefined) $search = "";
    else document.hasFocus() && document.activeElement === searchInput ? onHideSearch() : onFocusSearch();
  };

  const onSearchKeypress = (event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    onHideSearch();
  };

  onMount(() => {
    window.addEventListener("toggle-search", onToggleSearch);
    return () => window.removeEventListener("toggle-search", onToggleSearch);
  });
</script>

{#if $search !== undefined}
  <article transition:fade>
    <button on:click={onHideSearch}><img src={imageSearch} alt={"Submit"} /></button>
    <input bind:this={searchInput} on:keydown={onSearchKeypress} bind:value={$search} use:autoFocus />
  </article>
{/if}

<style lang="less">
  article {
    position: relative;
    top: -36px;
    height: 0;
  }
  input {
    position: absolute;
    background-color: #ffebba;
    color: #2e405c;
  }
</style>
