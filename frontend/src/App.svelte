<script lang="ts">
  import imageSettings from "./assets/images/options-64.png";
  import { settings } from "./stores";
  import Chat from "./Chat.svelte";
  import Dialog from "./Dialog.svelte";
  import Settings from "./Settings.svelte";
  import Toaster from "./Toaster.svelte";

  let isSettingsVisible = false;
  $: if (!$settings) isSettingsVisible = true;

  const onToggleSettings = () => (isSettingsVisible = !isSettingsVisible);
</script>

{#if isSettingsVisible}
  <Dialog on:dismiss={onToggleSettings}>
    <Settings />
  </Dialog>
{/if}

<Chat />
<button on:click|stopPropagation={onToggleSettings}><img src={imageSettings} alt={"menu"} />Settings</button>
<Toaster />

<style lang="less">
</style>
