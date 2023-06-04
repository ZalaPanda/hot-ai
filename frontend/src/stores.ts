import { writable } from "svelte/store";

export type HotKey = { modifiers: number[]; key: number };
export interface Settings {
  apiKey?: string,
  hotKey?: HotKey,
  alwaysOnTop?: boolean,
  isMaximized?: boolean,
  bounds?: [number, number, number, number]
};

export const settings = writable<Settings>(JSON.parse(localStorage.getItem("settings")) ?? {});
settings.subscribe(settings => localStorage.setItem("settings", JSON.stringify(settings)));