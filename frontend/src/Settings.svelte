<script lang="ts">
  import { GetKeys, GetModifiers, SetToggleHotkey } from "../wailsjs/go/main/App";
  import { settings } from "./stores";

  type Hotkey = { modifiers: any[]; key: any };
  let hotkey: Hotkey = { modifiers: [4, 8], key: 65 }; // Win + Shift + A
  let keys: { [key: string]: any } = [];
  let modifiers: { [key: string]: any } = [];

  (async () => ([keys, modifiers] = await Promise.all([GetKeys(), GetModifiers()])))(); // this reminds me of [snailfish math](https://adventofcode.com/2021/day/18)

  const onSettingsChange = (name: string) => (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
    const value = event.currentTarget.value;
    settings.update((settings) => ({ ...settings, [name]: value }));
  };

  SetToggleHotkey(hotkey.modifiers, hotkey.key);
</script>

<section>
  <input value={$settings?.ApiKey || ""} type={"password"} on:change={onSettingsChange("ApiKey")} />
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
</section>

<style lang="less">
</style>
