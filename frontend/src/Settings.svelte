<script lang="ts">
  import { onMount } from "svelte";
  import { GetKeys, GetModifiers, CheckForUpdate, SetToggleHotkey, GetAutostarterEnabled, SetAutostarterEnabled } from "../wailsjs/go/main/App";
  import { BrowserOpenURL } from "../wailsjs/runtime";
  import { settings, presets, type HotKey, type Preset } from "./stores";
  import { autoFocus } from "./uses";
  import { dispatchError } from "./Toaster.svelte";
  import Dialog from "./Dialog.svelte";
  import imageSettings from "./assets/images/options-64.png";
  import imageOpen from "./assets/images/open-64.png";
  import { spring } from "svelte/motion";

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
      dispatchError(error);
    }
  };

  const onDismissUpdate = () => (update = undefined);

  const onHyperlinkClick = (event: MouseEvent & { currentTarget: EventTarget & HTMLAnchorElement }) => {
    const url = event.currentTarget?.href;
    url && BrowserOpenURL(url);
  };

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

  const imageSize = 42;
  let activePreset = $presets.at(0);
  let dragging: { preset: Preset; clientX: number; clientY: number };
  let delta = spring({ x: 0, y: 0, scale: 1 }, { stiffness: 0.1, damping: 0.25 });

  const onPresetSelect = (preset: Preset) => () => (activePreset = preset);

  const onPresetDragStart = (preset: Preset) => (event: MouseEvent & { currentTarget: HTMLButtonElement }) => {
    const { clientX, clientY } = event;
    event.preventDefault();
    activePreset = preset;
    dragging = { preset, clientX, clientY };
    delta.set({ x: 0, y: 0, scale: 1.1 }, { hard: true });
    window.addEventListener("mousemove", onPresetDragMove);
    window.addEventListener("mouseup", onPresetDragStop);
  };

  const onPresetDragMove = (event: MouseEvent) => {
    delta.update((delta) => ({ ...delta, x: event.clientX - dragging.clientX, y: Math.min(Math.max(event.clientY - dragging.clientY, -imageSize), imageSize) }));
  };

  const onPresetDragStop = (event: MouseEvent) => {
    presets.update((presets) => {
      const currIndex = presets.findIndex((preset) => preset === activePreset);
      const nextIndex = Math.max(Math.min(Math.round(currIndex + (event.clientX - dragging.clientX) / imageSize), presets.length - 1), 0);
      return presets.map((preset, index, presets) => (index === currIndex ? presets[nextIndex] : index === nextIndex ? presets[currIndex] : preset));
    });
    dragging = undefined;
    window.removeEventListener("mousemove", onPresetDragMove);
    window.removeEventListener("mouseup", onPresetDragStop);
  };

  const onPresetNameInput = (event: Event & { currentTarget: HTMLInputElement }) => {
    const updatedPreset = { ...activePreset, name: event.currentTarget.value };
    presets.update((presets) => presets.map((preset) => (preset === activePreset ? updatedPreset : preset)));
    activePreset = updatedPreset;
  };

  const onPresetEnabledChange = (event: Event & { currentTarget: HTMLInputElement }) => {
    const updatedPreset = { ...activePreset, enabled: event.currentTarget.checked };
    presets.update((presets) => presets.map((preset) => (preset === activePreset ? updatedPreset : preset)));
    activePreset = updatedPreset;
  };

  onMount(() => {
    try {
      const { apiKey } = $settings;
      if (!apiKey) isVisible = true;
      if (!isWails) return;

      (async () => {
        try {
          [keys, modifiers, autostarted, update] = await Promise.all([GetKeys(), GetModifiers(), GetAutostarterEnabled(), CheckForUpdate()]);
        } catch (error) {
          dispatchError(error);
        }
      })();
    } catch (error) {
      dispatchError(error);
    }
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
      <input type={"checkbox"} checked={autostarted} on:change={onToggleAutostarter} disabled={!isWails} />
      Auto-start with system
    </label>
    <section>
      {#each $presets as preset (preset.image)}
        {@const style = preset === dragging?.preset && `transform: translate(${$delta.x}px,${$delta.y}px) scale(${$delta.scale}); z-index: 1;`}
        {@const active = preset === activePreset}
        {@const enabled = preset.enabled}
        <button on:click={onPresetSelect(preset)} on:mousedown={onPresetDragStart(preset)} {style}>
          <img src={preset.image} alt={preset.image} class:active class:enabled />
        </button>
      {/each}
    </section>
    <label>
      <input type={"text"} value={activePreset.name} placeholder={"Preset name"} size={12} on:input={onPresetNameInput} />
      <input type={"checkbox"} checked={activePreset.enabled} on:change={onPresetEnabledChange} />{activePreset.enabled ? "Enabled" : "Disabled"}
    </label>
    <small>Icons by <a href="https://icons8.com" on:click={onHyperlinkClick}>Icons8</a></small>
  </Dialog>
{/if}
{#if update}
  <Dialog on:dismiss={onDismissUpdate}>
    <h1>New version available!</h1>
    <div>Current version: <b>{update.currentVersion}</b></div>
    <div>Latest version: <b>{update.latestVersion}</b></div>
    <a href={update.url} on:click={onHyperlinkClick}><img src={imageOpen} alt={"Open"} />{update.name}</a>
  </Dialog>
{/if}

<style lang="less">
  label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  input[type="password"],
  select {
    width: 240px;
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
  section {
    margin-top: 8px;
    display: flex;
    & > button {
      padding: 1px 4px;
      img {
        filter: blur(2px);
        &:hover,
        &.active {
          filter: none;
        }
        opacity: 0.3;
        &.enabled {
          opacity: 1;
        }
      }
    }
  }
  small {
    margin-top: 8px;
  }
</style>
