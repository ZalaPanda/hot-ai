<script lang="ts">
  import { GetKeys, GetModifiers, SetToggleHotkey, GetAutostarterEnabled, SetAutostarterEnabled } from "../wailsjs/go/main/App";
  import { settings } from "./stores";

  const isWails = !!window["go"];
  type Hotkey = { modifiers: any[]; key: any };
  let hotkey: Hotkey = { modifiers: [4, 8], key: 65 }; // Win + Shift + A
  let keys: { [key: string]: any } = [];
  let modifiers: { [key: string]: any } = [];
  let autostarted = false;

  (async () => {
    if (!isWails) return;
    [keys, modifiers, autostarted] = await Promise.all([GetKeys(), GetModifiers(), GetAutostarterEnabled()]);
    SetToggleHotkey(hotkey.modifiers, hotkey.key);
  })(); // this reminds me of [snailfish math](https://adventofcode.com/2021/day/18)

  const onSettingsChange = (name: string) => (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
    const value = event.currentTarget.value;
    settings.update((settings) => ({ ...settings, [name]: value }));
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

<h1>Settings</h1>
<label>
  OpenAI API key:
  <input value={$settings?.ApiKey || ""} type={"password"} on:change={onSettingsChange("ApiKey")} />
</label>
<label>
  Global hotkey:
  <select multiple size={4}>
    {#each Object.entries(modifiers) as [name, value] (name)}
      <option {value}>{name}</option>
    {/each}
  </select>
  <select multiple size={4}>
    {#each Object.entries(keys) as [name, value] (name)}
      <option {value}>{name}</option>
    {/each}
  </select>
</label>
<label>
  Auto-start with system:
  <input type={"checkbox"} checked={autostarted} on:change={onToggleAutostarter} />
  {autostarted ? "active" : "inactive"}
</label>

<style lang="less">
  label {
    display: flex;
    align-items: center;
    gap: 8px;
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
