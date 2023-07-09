<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { search } from "./stores";
  import { autoFocus } from "./uses";
  import imageSearch from "./assets/images/search-64.png";

  let searchInput: HTMLInputElement;

  const hasFocus = () => document.activeElement === searchInput;

  const onHandleKeydown = (event: KeyboardEvent) => {
    if (event.key === "F3" || (event.ctrlKey && event.key === "F")) return onToggleSearch();
  };

  const onHideSearch = () => ($search = undefined);
  const onToggleSearch = () => ($search && !hasFocus() ? searchInput.select() : ($search = $search === undefined ? "" : undefined));

  const onSearchKeypress = (event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }) => {
    if (event.key != "Escape") return;
    event.preventDefault();
    onHideSearch();
  };

  onMount(() => {
    window.addEventListener("keydown", onHandleKeydown);
    return () => window.removeEventListener("keydown", onHandleKeydown);
  });
</script>

{#if $search !== undefined}
  <article transition:fade>
    <button on:click={onHideSearch}><img src={imageSearch} alt={"Submit"} /></button>
    <input bind:this={searchInput} on:keydown={onSearchKeypress} bind:value={$search} use:autoFocus />
  </article>
{/if}

<style lang="less">
  input {
    position: absolute;
    background-color: #ffebba;
    color: #2e405c;
  }
</style>
