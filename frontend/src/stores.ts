import { writable } from "svelte/store";
import imageNeutral from "./assets/images/neutral-64.png";
import imageTongue from "./assets/images/tongue-64.png";
import imageCold from "./assets/images/cold-64.png";
import imageSurprised from "./assets/images/surprised-64.png";
import imageHappy from "./assets/images/happy-64.png";
import imageSweat from "./assets/images/sweat-64.png";

export type HotKey = { modifiers: number[]; key: number };
export type Settings = {
  apiKey?: string,
  model?: string,
  hotKey?: HotKey,
  alwaysOnTop?: boolean,
  isMaximized?: boolean,
  bounds?: [number, number, number, number]
};
export type Preset = {
  name: string,
  system: string,
  image: string,
  enabled: boolean
};

const storeVersion: number = JSON.parse(localStorage.getItem("version"));
if (!storeVersion) {
  const settings = JSON.parse(localStorage.getItem("settings")) as Settings;
  localStorage.setItem("settings", JSON.stringify({ ...settings }));

  const presets = JSON.parse(localStorage.getItem("presets")) as Preset[];
  localStorage.setItem("presets", JSON.stringify([
    { name: "Colleague", system: "You are my helpful colleague who loves to joke.", image: imageNeutral, enabled: true },
    { name: "Teacher", system: "You translate and fix also my sentences to sound more natural and native English. Reply only the corrected sentences.", image: imageTongue, enabled: true },
    { name: "Geek", system: "You are a digital technology expert and you have extensive knowledge of programming. Avoid using excessive explanations. Utilize markdown syntax in your responses.", image: imageCold, enabled: true },
    { name: "Documenter", system: "You write documentation for the following code.", image: imageSurprised, enabled: false },
    { name: "Reviewer", system: "You find problems with the following code, fix them and explain what was wrong. If there are no problems say so.", image: imageSweat, enabled: false },
    { name: "Coder", system: "Refactor and optimize this code and then explain what's changed.", image: imageHappy, enabled: false },
  ].map(preset => {
    const system = presets[preset.name]?.system ?? preset.system; // HINT: system config from no version
    return { ...preset, system };
  })));
  localStorage.setItem("version", JSON.stringify(1));
};

export const settings = writable<Settings>(JSON.parse(localStorage.getItem("settings")));
settings.subscribe(settings => localStorage.setItem("settings", JSON.stringify(settings)));

export const search = writable<string | undefined>(undefined);

export const presets = writable<Preset[]>(JSON.parse(localStorage.getItem("presets")));
presets.subscribe(presets => localStorage.setItem("presets", JSON.stringify(presets)));