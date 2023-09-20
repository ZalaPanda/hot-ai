<script context="module" lang="ts">
  export const dispatchError = (error: Error | string | unknown) => window.dispatchEvent(new ErrorEvent("error", error instanceof Error ? error : { message: String(error) }));
</script>

<script lang="ts">
  import Toast from "./Toaster.Toast.svelte";
  import { onMount } from "svelte";

  let toasts: { key: any; text: string }[] = [];

  const addToast = (text: string) => (toasts = toasts.concat({ key: Date.now(), text }));
  const removeToast = (key: number) => () => (toasts = toasts.filter((toast) => key !== toast.key));

  onMount(() => {
    const errorListener = (error: ErrorEvent) => addToast(error?.message || String(error));
    window.addEventListener("error", errorListener);
    return () => window.removeEventListener("error", errorListener);
  });
</script>

<section>
  {#each toasts as toast (toast.key)}
    <Toast text={toast.text} on:dismiss={removeToast(toast.key)} />
  {/each}
</section>

<style lang="less">
  section {
    position: fixed;
    z-index: 1;
    top: 0;
    left: 0;
    width: 100%;
    height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
