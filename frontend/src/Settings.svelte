<script lang="ts">
  import { onMount } from "svelte";
  import { GetKeys, GetModifiers, SetToggleHotkey, GetAutostarterEnabled, SetAutostarterEnabled, SetWindowBounds } from "../wailsjs/go/main/App";
  import { WindowSetAlwaysOnTop, WindowIsMaximised, WindowMaximise, WindowUnmaximise, EventsOn, EventsOff, WindowShow } from "../wailsjs/runtime";
  import { settings, type HotKey } from "./stores";
  import { autoFocus } from "./uses";
  import { dispatchError } from "./Toaster.svelte";
  import Dialog from "./Dialog.svelte";
  import imageSettings from "./assets/images/options-64.png";

  const isWails = !!window["go"];

  let keys: { [key: string]: any } = [];
  let modifiers: { [key: string]: any } = [];
  let autostarted = false;
  let isVisible = false;

  let modifiersSelect: HTMLSelectElement;
  let keySelect: HTMLSelectElement;

  const onToggleSettings = () => (isVisible = !isVisible);

  const onChangeApiKey = (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
    const apiKey = event.currentTarget.value;
    settings.update((settings) => ({ ...settings, apiKey }));
  };

  const onChangeHotKey = async () => {
    try {
      const hotKey: HotKey = {
        modifiers: [...modifiersSelect.options].filter((option) => option.selected).map((option) => Number(option.value)),
        key: [...keySelect.options]
          .filter((option) => option.selected)
          .map((option) => Number(option.value))
          .at(0),
      };
      if (!hotKey.modifiers.length || !hotKey.key) return;
      console.log("register", hotKey.modifiers, hotKey.key);
      await SetToggleHotkey(hotKey.modifiers, hotKey.key);
      settings.update((settings) => ({ ...settings, hotKey }));
    } catch (error) {
      dispatchError(error);
    }
  };

  const onToggleMaximise = async () => {
    try {
      const isMaximized = !(await WindowIsMaximised());
      if (isMaximized) WindowMaximise();
      else WindowUnmaximise();
      settings.update((settings) => ({ ...settings, isMaximized }));
    } catch (error) {
      dispatchError(error);
    }
  };

  const onToggleAlwaysOnTop = async () => {
    try {
      const alwaysOnTop = !$settings.alwaysOnTop;
      WindowSetAlwaysOnTop(alwaysOnTop);
      settings.update((settings) => ({ ...settings, alwaysOnTop }));
    } catch (error) {
      dispatchError(error);
    }
  };

  const onClearHotKey = () => {
    modifiersSelect.value = undefined;
    keySelect.value = undefined;
    settings.update((settings) => ({ ...settings, hotKey: undefined }));
  };

  const onToggleAutostarter = async () => {
    try {
      await SetAutostarterEnabled(!autostarted);
      autostarted = await GetAutostarterEnabled();
    } catch (error) {
      console.error(error);
    }
  };

  const onHandleKeydown = (event: KeyboardEvent) => {
    if (event.key === "F11") return onToggleMaximise();
    if (event.key === "F12") return onToggleAlwaysOnTop();
  };

  const onHandleSaveBounds = (bounds: [number, number, number, number]) => {
    settings.update((settings) => ({ ...settings, bounds }));
  };

  onMount(() => {
    try {
      const { apiKey, hotKey, alwaysOnTop, isMaximized, bounds } = $settings;
      if (!apiKey) isVisible = true;
      if (!isWails) return;

      document.addEventListener("keydown", onHandleKeydown);
      EventsOn("save-bounds", onHandleSaveBounds);

      if (isMaximized) WindowMaximise();
      else WindowUnmaximise();
      WindowSetAlwaysOnTop(alwaysOnTop);
      WindowShow();

      (async () => {
        [keys, modifiers, autostarted] = await Promise.all([GetKeys(), GetModifiers(), GetAutostarterEnabled()]);
        if (hotKey) await SetToggleHotkey(hotKey.modifiers, hotKey.key);
        if (bounds) await SetWindowBounds(bounds);
      })();
    } catch (error) {
      dispatchError(error);
    }
    return () => {
      document.removeEventListener("keydown", onHandleKeydown);
      EventsOff("save-bounds");
    };
  });
</script>

<button on:click|stopPropagation={onToggleSettings}><img src={imageSettings} alt={"menu"} /></button>
{#if isVisible}
  <Dialog on:dismiss={onToggleSettings}>
    <h1>Settings</h1>
    <div>OpenAI API key:</div>
    <label>
      <input value={$settings.apiKey || ""} type={"password"} on:change={onChangeApiKey} use:autoFocus />
    </label>
    <div>Global hotkey: <button on:click={onClearHotKey} disabled={!isWails || !$settings.hotKey}>Clear</button></div>
    <label>
      <select multiple size={4} bind:this={modifiersSelect} on:change={onChangeHotKey} disabled={!isWails}>
        {#each Object.entries(modifiers) as [name, value] (name)}
          <option {value} selected={$settings.hotKey?.modifiers?.includes(value)}>{name}</option>
        {/each}
      </select>
      <select size={4} bind:this={keySelect} on:change={onChangeHotKey} disabled={!isWails}>
        {#each Object.entries(keys) as [name, value] (name)}
          <option {value} selected={$settings.hotKey?.key === value}>{name}</option>
        {/each}
      </select>
    </label>
    <label>
      <input type={"checkbox"} checked={$settings.isMaximized} on:change={onToggleMaximise} disabled={!isWails} />
      Maximized (<kbd>F11</kbd>)
    </label>
    <label>
      <input type={"checkbox"} checked={$settings.alwaysOnTop} on:change={onToggleAlwaysOnTop} disabled={!isWails} />
      Always on Top (<kbd>F12</kbd>)
    </label>
    <label>
      <input type={"checkbox"} checked={autostarted} on:change={onToggleAutostarter} disabled={!isWails} />
      Auto-start with system
    </label>
  </Dialog>
{/if}

<style lang="less">
  label {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 4px;
  }
  select {
    height: 100px;
  }
  input[type="checkbox"] {
    min-width: unset;
    width: 1.3em;
    height: 1.3em;
    background-color: white;
    border-radius: 50%;
    vertical-align: middle;
    border: 1px solid #ddd;
    appearance: none;
    cursor: pointer;
    &:checked {
      background-color: green;
    }
  }
</style>
