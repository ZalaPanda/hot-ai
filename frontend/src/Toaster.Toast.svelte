<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { fly } from "svelte/transition";
  import imageAlert from "./assets/images/alert-64.png";

  export let duration = 2000;
  export let text = "?";
  let timeout = 0;

  const dispatch = createEventDispatcher();
  const dispatchDismiss = () => dispatch("dismiss");
  const updateTimeout = (duration: number) => () => {
    clearTimeout(timeout);
    timeout = duration ? setTimeout(() => dispatch("dismiss"), duration) : 0;
  };

  onMount(() => updateTimeout(duration)());
</script>

<article transition:fly on:mouseenter={updateTimeout(0)} on:mouseleave={updateTimeout(duration)}>
  <button on:click={dispatchDismiss}><img src={imageAlert} alt={"Alert"} /></button>
  <span>{text}</span>
</article>

<style lang="less">
  article {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    flex-shrink: 0;

    background-color: #cd5c5c;
    color: #eeeff1;

    margin: 4px auto 0 auto;
    padding: 6px 8px;
    font-size: 18px;
    border-radius: 4px;
    box-shadow: 0 3px 9px #00000066;
    max-width: 360px;
    button {
      padding: 0;
    }
  }
</style>
