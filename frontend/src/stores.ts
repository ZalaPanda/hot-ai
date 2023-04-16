import { writable } from "svelte/store";

interface Settings {
  ApiKey: string,
  ToggleHotKey: string,
};

export const settings = writable<Settings | undefined>(JSON.parse(localStorage.getItem("settings")));
settings.subscribe(settings => localStorage.setItem("settings", JSON.stringify(settings)));