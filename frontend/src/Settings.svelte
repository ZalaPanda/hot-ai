<script lang="ts">
  import { GetKeys, GetModifiers, SetToggleHotkey, GetAutostarterEnabled, SetAutostarterEnabled } from "../wailsjs/go/main/App";
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

  (async () => {
    try {
      const { apiKey, hotKey } = $settings || {};
      if (!apiKey) isVisible = true;
      if (!isWails) return;
      [keys, modifiers, autostarted] = await Promise.all([GetKeys(), GetModifiers(), GetAutostarterEnabled()]);
      if (hotKey) await SetToggleHotkey(hotKey.modifiers, hotKey.key);
    } catch (error) {
      dispatchError(error);
    }
  })();

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
</script>

<button on:click|stopPropagation={onToggleSettings}><img src={imageSettings} alt={"menu"} />Settings</button>

{#if isVisible}
  <Dialog on:dismiss={onToggleSettings}>
    <h1>Settings</h1>
    <label>
      OpenAI API key:
      <input value={$settings?.apiKey || ""} type={"password"} on:change={onChangeApiKey} use:autoFocus />
    </label>
    <label>
      Global hotkey:
      <select multiple size={4} bind:this={modifiersSelect} on:change={onChangeHotKey}>
        {#each Object.entries(modifiers) as [name, value] (name)}
          <option {value} selected={$settings?.hotKey?.modifiers?.includes(value)}>{name}</option>
        {/each}
      </select>
      <select size={4} bind:this={keySelect} on:change={onChangeHotKey}>
        {#each Object.entries(keys) as [name, value] (name)}
          <option {value} selected={$settings?.hotKey?.key === value}>{name}</option>
        {/each}
      </select>
      <button on:click={onClearHotKey} disabled={!$settings?.hotKey}>Clear</button>
    </label>
    <label>
      Auto-start with system:
      <input type={"checkbox"} checked={autostarted} on:change={onToggleAutostarter} />
      {autostarted ? "active" : "inactive"}
    </label>
  </Dialog>
{/if}

<style lang="less">
  label {
    display: flex;
    align-items: baseline;
    gap: 8px;
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
