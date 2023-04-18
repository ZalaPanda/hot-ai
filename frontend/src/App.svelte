<script lang="ts">
  import bmo from "./assets/images/bmo-48.png";
  import menu from "./assets/images/menu-32.png";
  import { settings } from "./stores";
  import Dialog from "./Dialog.svelte";
  import Settings from "./Settings.svelte";
  import Chat from "./Chat.svelte";

  let name: string;
  let isSettingsVisible = false;
  let toggle = false;
  $: if (!$settings) isSettingsVisible = true;

  const onToggleSettings = () => (isSettingsVisible = !isSettingsVisible);
</script>

{#if isSettingsVisible}
  <Dialog on:dismiss={onToggleSettings}>
    <Settings />
  </Dialog>
{/if}
{#if $settings}
  <h1>settings</h1>
{:else}
  <!-- <Dialog /> -->
  <h1>no settings</h1>
{/if}

<main>
  <Chat />
  <img src={bmo} alt={"bmo"} />
  <button on:click|stopPropagation={onToggleSettings}><img src={menu} alt={"menu"} /></button>
</main>

<style lang="less">
  // #logo {
  //   display: block;
  //   width: 50%;
  //   height: 50%;
  //   margin: auto;
  //   padding: 10% 0 0;
  //   background-position: center;
  //   background-repeat: no-repeat;
  //   background-size: 100% 100%;
  //   background-origin: content-box;
  // }

  // .result {
  //   height: 20px;
  //   line-height: 20px;
  //   margin: 1.5rem auto;
  // }

  // .input-box .btn {
  //   width: 60px;
  //   height: 30px;
  //   line-height: 30px;
  //   border-radius: 3px;
  //   border: none;
  //   margin: 0 0 0 20px;
  //   padding: 0 8px;
  //   cursor: pointer;
  // }

  // .input-box .btn:hover {
  //   background-image: linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%);
  //   color: #333333;
  // }

  // .input-box .input {
  //   border: none;
  //   border-radius: 3px;
  //   outline: none;
  //   height: 30px;
  //   line-height: 30px;
  //   padding: 0 10px;
  //   background-color: rgba(240, 240, 240, 1);
  //   -webkit-font-smoothing: antialiased;
  // }

  // .input-box .input:hover {
  //   border: none;
  //   background-color: rgba(255, 255, 255, 1);
  // }

  // .input-box .input:focus {
  //   border: none;
  //   background-color: rgba(255, 255, 255, 1);
  // }
</style>
