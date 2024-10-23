<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { fly } from "svelte/transition";
  import imageAlert from "./assets/images/alert-64.png";

  export let duration = 2000;
  export let text = "?";
  let timeout: Timer | undefined = undefined;

  const dispatch = createEventDispatcher();
  const dispatchDismiss = () => dispatch("dismiss");
  const onUpdateTimeout = (duration: number) => () => {
    clearTimeout(timeout);
    timeout = duration ? setTimeout(() => dispatch("dismiss"), duration) : undefined;
  };

  onMount(() => onUpdateTimeout(duration)());
</script>

<article transition:fly on:mouseenter={onUpdateTimeout(0)} on:mouseleave={onUpdateTimeout(duration)}>
  <button on:click={dispatchDismiss}><img src={imageAlert} alt={"Alert"} /></button>
  <span>{text}</span>
</article>

<style lang="less">
  article {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    flex-shrink: 0;

    border: 1px solid #803939;
    background-color: #cd5c5c;
    color: #eeeff1;

    margin: 2px auto 0 auto;
    padding: 6px 8px;
    font-size: 18px;
    border-radius: 12px;
    box-shadow: 0 3px 9px #00000066;
    max-width: 360px;
    button {
      padding: 0;
      margin-right: 8px;
    }
  }
</style>
