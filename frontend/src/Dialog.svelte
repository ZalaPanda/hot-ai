<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { clickOutside, focusTrap } from "./uses";
  const dispatch = createEventDispatcher();
</script>

<div transition:fade={{ easing: cubicOut }}>
  <section use:focusTrap={true} use:clickOutside={{ enabled: true, callback: () => dispatch("dismiss") }}><slot /></section>
</div>

<style lang="less">
  div {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #00000022;
    backdrop-filter: blur(2px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    & > section {
      background-color: #1b2636;
      box-shadow: 0 3px 9px #00000022;
      display: flex;
      flex-direction: column;
      align-items: baseline;
      padding: 2rem;
      border-radius: 0.4rem;
    }
  }
</style>
