import { writable } from "svelte/store";
import imageColleague from "./assets/images/neutral-64.png";
import imageTeacher from "./assets/images/tongue-64.png";
import imageGeek from "./assets/images/cold-64.png";

export type HotKey = { modifiers: number[]; key: number };
export interface Settings {
  apiKey?: string,
  model?: string,
  hotKey?: HotKey,
  alwaysOnTop?: boolean,
  isMaximized?: boolean,
  bounds?: [number, number, number, number]
};
export type Preset = { name: string; system: string; image: string };

export const settings = writable<Settings>(JSON.parse(localStorage.getItem("settings")) ?? {});
settings.subscribe(settings => localStorage.setItem("settings", JSON.stringify(settings)));

export const search = writable<string | undefined>(undefined);

export const presets = writable<Preset[]>(JSON.parse(localStorage.getItem("presets")) ?? [
  { name: "Colleague", system: "You are my helpful colleague who loves to joke.", image: imageColleague },
  { name: "Teacher", system: "You fix my sentences to sound more natural and native English. Reply only the corrected sentences.", image: imageTeacher },
  { name: "Geek", system: "You are a digital-technology expert and you know everything about programming.", image: imageGeek },
]);
presets.subscribe(presets => localStorage.setItem("presets", JSON.stringify(presets)));
