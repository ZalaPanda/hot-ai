<script lang="ts">
  import { onMount } from "svelte";
  import { GetKeys, GetModifiers, CheckForUpdate, SetToggleHotkey, GetAutostarterEnabled, SetAutostarterEnabled, SetWindowBounds } from "../wailsjs/go/main/App";
  import { WindowSetAlwaysOnTop, WindowIsMaximised, WindowMaximise, WindowUnmaximise, EventsOn, EventsOff, WindowShow, BrowserOpenURL } from "../wailsjs/runtime";
  import { settings, type HotKey } from "./stores";
  import { autoFocus } from "./uses";
  import { dispatchError } from "./Toaster.svelte";
  import Dialog from "./Dialog.svelte";
  import imageSettings from "./assets/images/options-64.png";
  import imageOpen from "./assets/images/open-64.png";

  const isWails = !!window["go"];

  let keys: { [key: string]: any } = [];
  let modifiers: { [key: string]: any } = [];
  let models: string[] = [];
  let update: { name: string; currentVersion: string; latestVersion: string; url: string };
  let autostarted = false;
  let isVisible = false;

  let modelSelect: HTMLSelectElement;
  let modifiersSelect: HTMLSelectElement;
  let keySelect: HTMLSelectElement;

  $: if (isVisible && !models.length && $settings.apiKey) onReloadModels();

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

  const onDismissUpdate = () => (update = undefined);

  const onUpdateOpenClick = () => update?.url && BrowserOpenURL(update.url);

  const onReloadModels = async () => {
    try {
      models = [];
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${$settings.apiKey}` },
      });
      if (!response.ok) throw new Error(`${response.status} model list error`);
      const { data } = (await response.json()) as { data: { id: string }[] };
      models = data.map((model) => model.id).filter((model) => model.startsWith("gpt")); // https://platform.openai.com/docs/models/model-endpoint-compatibility
    } catch (error) {
      dispatchError(error);
    }
  };

  const onChangeModel = () => {
    try {
      const model = modelSelect.value;
      settings.update((settings) => ({ ...settings, model }));
    } catch (error) {
      dispatchError(error);
    }
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
        try {
          if (hotKey) await SetToggleHotkey(hotKey.modifiers, hotKey.key);
          if (bounds) await SetWindowBounds(bounds);
          [keys, modifiers, autostarted, update] = await Promise.all([GetKeys(), GetModifiers(), GetAutostarterEnabled(), CheckForUpdate()]);
        } catch (error) {
          dispatchError(error);
        }
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
    <div>OpenAI model: <button on:click={onReloadModels} disabled={!!$settings.hotKey}>Refresh</button></div>
    <label>
      <select bind:this={modelSelect} on:change={onChangeModel} disabled={!models.length}>
        {#each models as value}
          <option {value} selected={value === ($settings.model || "gpt-3.5-turbo")}>{value}</option>
        {/each}
      </select>
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
{#if update}
  <Dialog on:dismiss={onDismissUpdate}>
    <h1>New version available!</h1>
    <div>Current version: <b>{update.currentVersion}</b></div>
    <div>Latest version: <b>{update.latestVersion}</b></div>
    <button on:click={onUpdateOpenClick}><img src={imageOpen} alt={"Open"} />{update.name}</button>
  </Dialog>
{/if}

<style lang="less">
  label {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 4px;
  }
  input,
  select {
    width: 260px;
  }
  select[size] {
    width: unset;
    height: 100px;
  }
  input[type="checkbox"] {
    min-width: unset;
    width: 1em;
    height: 1em;
    background-color: #ffffff;
    border-radius: 50%;
    vertical-align: middle;
    border: 2px solid #dfe3e9;
    appearance: none;
    cursor: pointer;
    &:checked {
      background-color: #52b788;
    }
  }
</style>
