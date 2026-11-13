import type { Demo, Layout, PanelSpec } from "./types.ts";

export interface Arranged {
  layout: Layout;
  /** The panels in slot order: a, b, c, d. */
  slots: PanelSpec[];
  /** Slot a holds a tall, narrow panel, so it gets a narrow column. */
  narrow: boolean;
}

/**
 * Picks the layout a demo did not name, and puts a portrait panel (a phone, a form) in the tall slot.
 * Four panels are a 2x2 grid, unless one is portrait: then it takes a full-height rail on the left.
 */
export function arrange(demo: Pick<Demo, "layout" | "panels">, portrait: (type: string) => boolean): Arranged {
  const n = demo.panels.length;
  const lead = demo.panels.findIndex((spec) => portrait(spec.type));
  const layout: Layout = demo.layout ?? (n >= 4 ? (lead >= 0 ? "rail" : "quad") : n === 3 ? "trio" : "duo");
  const slots = [...demo.panels];
  const narrow = lead >= 0 && layout !== "quad";
  if (narrow && lead > 0) slots.unshift(...slots.splice(lead, 1));
  return { layout, slots, narrow };
}
