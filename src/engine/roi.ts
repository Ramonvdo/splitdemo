import type { Lang, Roi, RoiInput } from "./types.ts";

/** What a system is worth with one set of numbers filled in. */
export interface Worked {
  /** Each gain, per month. */
  gains: { label: string; monthly: number }[];
  /** All gains together, per month. */
  monthly: number;
  /** What is left per month after the monthly cost. */
  net: number;
  /** The total at the end of each of the first twelve months, the one-time cost paid at the start. */
  running: number[];
  /** The first year: the last of `running`. */
  year: number;
  /** The month the total is no longer below zero. Only with a cost, and only when more comes in than goes out. */
  payback?: number;
}

/** Works a calculator out. `values` holds a number per input id; a percentage is a share, so 30 counts as 0.30. */
export function work(roi: Roi, values: Record<string, number>): Worked {
  const share = (id: string) => {
    const input = roi.inputs.find((one) => one.id === id);
    return input?.kind === "percent" ? values[id] / 100 : values[id];
  };
  const gains = roi.gains.map((gain) => ({ label: gain.label, monthly: gain.from.reduce((product, id) => product * share(id), gain.times ?? 1) }));
  const monthly = gains.reduce((sum, gain) => sum + gain.monthly, 0);
  const net = monthly - (roi.cost?.monthly ?? 0);
  const once = roi.cost?.once ?? 0;
  const running = Array.from({ length: 12 }, (_, month) => net * (month + 1) - once);
  return { gains, monthly, net, running, year: running[11], payback: roi.cost && net > 0 ? Math.max(1, Math.ceil(once / net)) : undefined };
}

/** A typed number, kept within what its field allows. Without a `max` that is ten times the starting value, and 100 for a percentage. */
export function clamp(input: RoiInput, value: number): number {
  const min = input.min ?? 0;
  const max = input.max ?? (input.kind === "percent" ? 100 : input.value * 10);
  return Number.isFinite(value) ? Math.min(Math.max(value, min), max) : min;
}

const LOCALE = { en: "en-US", nl: "nl-NL" };

/** What was typed in a field, as a number. The language decides which mark is the decimal one; anything that is no part of a number is left out. */
export function typed(raw: string, lang: Lang = "en"): number {
  const [group, mark] = lang === "nl" ? [".", ","] : [",", "."];
  return Number(raw.replaceAll(group, "").replace(mark, ".").replace(/[^\d.]/g, ""));
}

/** A number as a field holds it: no grouping, so `typed` reads it back as the same number. */
export function field(value: number, lang: Lang = "en"): string {
  return new Intl.NumberFormat(LOCALE[lang], { useGrouping: false, maximumFractionDigits: 2 }).format(value);
}

/** The sign a currency is written with, e.g. "$". */
export function sign(currency: string, lang: Lang = "en"): string {
  const parts = new Intl.NumberFormat(LOCALE[lang], { style: "currency", currency }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? currency;
}

/** A number as the viewer reads it: whole, in the demo's language, as money or a percentage when it is one. */
export function shown(value: number, kind: RoiInput["kind"], currency: string, lang: Lang = "en"): string {
  const locale = LOCALE[lang];
  if (kind === "money") return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value) + (kind === "percent" ? "%" : "");
}
