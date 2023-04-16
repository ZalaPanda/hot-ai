<script lang="ts">
  import { settings } from "./stores";
  const onSettingsChange = (name: string) => (event: Event & { currentTarget: EventTarget & HTMLInputElement }) => {
    const value = event.currentTarget.value;
    settings.update((settings) => ({ ...settings, [name]: value }));
  };
</script>

<input value={$settings?.ApiKey || ""} type={"password"} on:change={onSettingsChange("ApiKey")} />
<input value={$settings?.ToggleHotKey || ""} on:change={onSettingsChange("ToggleHotKey")} />

<style lang="less">
</style>
