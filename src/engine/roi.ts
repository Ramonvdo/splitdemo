import type { Lang, Roi, RoiInput } from "./types.ts";

/** What a system is worth with one set of numbers filled in. Every amount is money in a month unless it says otherwise. */
export interface Worked {
  /** The chain as the business runs today. */
  before: number;
  /** The chain with the lever at the system's number. */
  after: number;
  /** What lies between the two. Never below zero. */
  effect: number;
  /** What the system adds in each of the first twelve months, before its cost. */
  months: number[];
  /** The running total of that after cost, from month 0 (minus the one-off cost) to month 12. */
  running: number[];
  /** The same run when the system reaches half of the effect. */
  cautious: number[];
  /** The first year after cost: where `running` ends. */
  year: number;
  /** The first month the running total is at or above zero. Only when there is a cost, and only within the year. */
  payback?: number;
  /** What one more point is worth in a year, with the system running: on the share the system changes, or else on the chain's last share. Not for a saving, and not above 100. */
  point?: { id: string; year: number };
}

/** The number an input multiplies by: a percentage is a share, so 30 counts as 0.30. */
const factor = (input: RoiInput, value: number) => (input.kind === "percent" ? value / 100 : value);

/** The lever's number with the system, given today's: the system's own, or today's with what the system adds, a share stopping at 100. */
export function target(roi: Roi, today: Record<string, number>): number {
  const input = roi.inputs.find((one) => one.id === roi.lever.input);
  if (roi.lever.to !== undefined || !input) return roi.lever.to ?? 0;
  const sum = today[input.id] + (roi.lever.add ?? 0);
  return input.kind === "percent" ? Math.min(sum, 100) : sum;
}

/** Works a calculator out. `today` holds a number per input id; `lever` is the lever's number with the system, when the viewer set one. */
export function work(roi: Roi, today: Record<string, number>, lever = target(roi, today)): Worked {
  const chain = (values: Record<string, number>) => roi.inputs.reduce((product, input) => product * factor(input, values[input.id]), roi.times ?? 1);
  const before = chain(today);
  const system = { ...today, [roi.lever.input]: lever };
  const after = chain(system);
  const effect = Math.max(0, roi.saving ? before - after : after - before);
  const { monthly = 0, once = 0 } = roi.cost ?? {};
  // What one month adds: the effect, or with `monthly` that of every month so far, since what was won keeps paying.
  const added = (size: number) => Array.from({ length: 12 }, (_, month) => size * (roi.monthly ? month + 1 : 1));
  const run = (size: number) => added(size).reduce((total, month) => [...total, total[total.length - 1] + month - monthly], [0 - once]);
  const running = run(effect);
  const paid = running.findIndex((total, month) => month > 0 && total >= 0);
  // The sentence is about the row the viewer is looking at: the lever, when that is a share with room left.
  const open = (input: RoiInput) => input.kind === "percent" && system[input.id] < 100;
  const share = roi.saving ? undefined : (roi.inputs.find((input) => input.id === roi.lever.input && open(input)) ?? roi.inputs.findLast(open));
  // A year of one point more: twelve months, or with `monthly` 1 + 2 + ... + 12 of them.
  const more = share && (chain({ ...system, [share.id]: system[share.id] + 1 }) - after) * (roi.monthly ? 78 : 12);
  return {
    before,
    after,
    effect,
    months: added(effect),
    running,
    cautious: run(effect / 2),
    year: running[12],
    ...(monthly + once > 0 && paid > 0 && { payback: paid }),
    ...(share && more !== undefined && { point: { id: share.id, year: more } }),
  };
}

/** One level of the chain as a count over a year: as the business works today, and with the system. */
export interface Stage {
  name: string;
  today: number;
  after: number;
}

export interface Stages {
  /** First stages left out of the drawing because the next is a tenth of them or less. They are said in a sentence. */
  lead: Stage[];
  drawn: Stage[];
  /** Today and the system start from the same count and no level is empty, so two funnels side by side compare. */
  pair: boolean;
}

/**
 * The chain as a funnel: every input that names a `stage`, up to the first amount of money, counted over a year.
 * Nothing when fewer than three levels are left to draw, or when one of them is empty with the system.
 */
export function stages(roi: Roi, today: Record<string, number>, lever = target(roi, today)): Stages | undefined {
  const system = { ...today, [roi.lever.input]: lever };
  const all: Stage[] = [];
  let before = 12;
  let after = 12;
  for (const input of roi.inputs) {
    if (input.kind === "money") break;
    before *= factor(input, today[input.id]);
    after *= factor(input, system[input.id]);
    if (input.stage) all.push({ name: input.stage, today: before, after });
  }
  // A first stage that dwarfs the next draws as a spike and a sliver.
  let from = 0;
  while (from < all.length - 1 && all[from + 1].after <= all[from].after / 10) from++;
  const drawn = all.slice(from);
  if (drawn.length < 3 || drawn.some((stage) => stage.after <= 0)) return undefined;
  const level = Math.abs(drawn[0].today - drawn[0].after) < 1e-9;
  return { lead: all.slice(0, from), drawn, pair: level && drawn.every((stage) => stage.today > 0) };
}

/**
 * A typed number, kept within what its field allows. Without a `max` that is 100 for a percentage, and otherwise ten times
 * the starting value or what the system reaches (`reach`), whichever is larger: a count that starts at 0 can still be typed over.
 */
export function clamp(input: RoiInput, value: number, reach = input.value): number {
  const min = input.min ?? 0;
  const max = input.max ?? (input.kind === "percent" ? 100 : Math.max(input.value, reach) * 10);
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
