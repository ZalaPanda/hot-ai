<script lang="ts">
  import logo from "./assets/images/logo-universal.png";
  import { Greet, SetToggleHotkey } from "../wailsjs/go/main/App.js";
  import bmo from "./assets/images/bmo-48.png";
  import menu from "./assets/images/menu-32.png";
  import { settings } from "./stores";
  import Dialog from "./Dialog.svelte";
  import Settings from "./Settings.svelte";

  let resultText: string = "Please enter your name below 👇";
  let name: string;
  let isSettingsVisible = false;
  $: if (!$settings) isSettingsVisible = true;

  const onToggleSettings = () => (isSettingsVisible = !isSettingsVisible);
  function greet(): void {
    Greet(name).then((result) => (resultText = result));
  }
  const onPressTheButton = async () => {
    try {
      const x = await SetToggleHotkey("sample");
      console.log("OK", x);
    } catch (error) {
      console.log("ERR", error);
    }
  };
</script>

<button on:click={onPressTheButton}>PUSH</button>
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
  <pre>Test the console font</pre>
  <img src={bmo} alt={"bmo"} />
  <button on:click|stopPropagation={onToggleSettings}><img src={menu} alt={"menu"} /></button>
  <img alt="Wails logo" id="logo" src={logo} />
  <div class="result" id="result">{resultText}</div>
  <div class="input-box" id="input">
    <input autocomplete="off" bind:value={name} class="input" id="name" type="text" />
    <button class="btn" on:click={greet}>Greet</button>
  </div>
</main>

<style lang="less">
  pre {
    font-family: SourceCodePro;
    border: 1px solid white;
  }
  #logo {
    display: block;
    width: 50%;
    height: 50%;
    margin: auto;
    padding: 10% 0 0;
    background-position: center;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    background-origin: content-box;
  }

  .result {
    height: 20px;
    line-height: 20px;
    margin: 1.5rem auto;
  }

  .input-box .btn {
    width: 60px;
    height: 30px;
    line-height: 30px;
    border-radius: 3px;
    border: none;
    margin: 0 0 0 20px;
    padding: 0 8px;
    cursor: pointer;
  }

  .input-box .btn:hover {
    background-image: linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%);
    color: #333333;
  }

  .input-box .input {
    border: none;
    border-radius: 3px;
    outline: none;
    height: 30px;
    line-height: 30px;
    padding: 0 10px;
    background-color: rgba(240, 240, 240, 1);
    -webkit-font-smoothing: antialiased;
  }

  .input-box .input:hover {
    border: none;
    background-color: rgba(255, 255, 255, 1);
  }

  .input-box .input:focus {
    border: none;
    background-color: rgba(255, 255, 255, 1);
  }
</style>
