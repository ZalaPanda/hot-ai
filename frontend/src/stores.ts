import { writable } from "svelte/store";

export type HotKey = { modifiers: number[]; key: number };
export interface Settings {
  apiKey: string,
  hotKey: HotKey,
};

export const settings = writable<Settings | undefined>(JSON.parse(localStorage.getItem("settings")));
settings.subscribe(settings => localStorage.setItem("settings", JSON.stringify(settings)));