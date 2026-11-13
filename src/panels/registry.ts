import type { ComponentType } from "react";
import type { PanelLogic, PanelProps } from "./types.ts";

/**
 * Every folder in src/panels that has a reduce.ts and a Panel.tsx is a preset, named after its folder.
 * Adding a panel is adding a folder: nothing is registered by hand.
 */
export interface Preset {
  logic: PanelLogic;
  View: ComponentType<PanelProps>;
}

const logics = import.meta.glob<{ logic: PanelLogic }>("./*/reduce.ts", { eager: true });
const views = import.meta.glob<{ default: ComponentType<PanelProps> }>("./*/Panel.tsx", { eager: true });

export const presets: Record<string, Preset> = {};
for (const [path, mod] of Object.entries(logics)) {
  const name = path.split("/")[1];
  const view = views[`./${name}/Panel.tsx`];
  if (view) presets[name] = { logic: mod.logic, View: view.default };
}
