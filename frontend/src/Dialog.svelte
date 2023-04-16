<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { clickoutside, focusTrap } from "./uses";
  const dispatch = createEventDispatcher();
</script>

<div transition:fade={{ easing: cubicOut }}>
  <section use:focusTrap={true} use:clickoutside={{ enabled: true, callback: () => dispatch("dismiss") }}><slot /></section>
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
      user-select: none;
      background-color: var(--card-bg);
      box-shadow: 0 3px 9px var(--shadow-color);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      border-radius: 0.4rem;
      text-align: center;
      justify-content: center;
    }
  }
</style>
