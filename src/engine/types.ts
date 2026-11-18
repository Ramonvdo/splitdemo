/** A demo is data: panels, and the beats that act on them. This is the shape of demo.json. */
/** How a demo plays: every monitor at once, or one screen at a time with a card before each step. */
export type Mode = "fast" | "explainer";

export type Layout = "rail" | "quad" | "trio" | "duo";

/** The language of the words the stage itself says: its buttons, "Step 2 of 6", the results slide. */
export type Lang = "en" | "nl";

export interface Demo {
  v: 1;
  /** Shown in the bar before the demo starts, and as the page title. */
  title: string;
  /** The tally colour, as #rrggbb. */
  accent?: string;
  layout?: Layout;
  /** 2 to 4 panels. Their order is their slot in the layout. */
  panels: PanelSpec[];
  beats: Beat[];
  /** 1 to 3 results, shown in the bar when the last beat is over. */
  outcome: Outcome[];
  /** The slide after the story: why the results matter, and a calculator the viewer can fill in. */
  results?: Results;
  /** Default: "en". */
  lang?: Lang;
  /** The one thing the viewer can do when the demo is over, e.g. book a call. An https:// or mailto: link. */
  next?: { label: string; url: string };
  /** ISO date. A demo past this date is left out of a share. */
  expires?: string;
}

export interface PanelSpec {
  id: string;
  /** The folder name of a preset in src/panels. */
  type: string;
  /** The small text in the top left of the panel, e.g. "CRM in ClickUp". */
  label: string;
  config: unknown;
}

export interface Beat {
  /** One plain line: what this means for the business. */
  say?: string;
  /** The time in the story, e.g. "21:14". Carries forward to later beats. */
  clock?: string;
  do: Action[];
  /** The viewer presses the first action themselves. */
  wait?: "click";
  /** Ms to stay after the last action. Default: time to read `say`. */
  hold?: number;
}

export interface Action {
  /** The id of the panel this acts on. */
  on: string;
  type: string;
  /** Ms after the action before it (or after the beat starts). Default: a fixed stagger. */
  after?: number;
  [payload: string]: unknown;
}

export interface Outcome {
  value: string;
  label: string;
  /** What it was before, e.g. "4 h". */
  was?: string;
}

export interface Results {
  /** Default: "Results". */
  title?: string;
  /** One or two sentences on why a system like this pays. */
  text?: string;
  roi?: Roi;
}

/** A calculator: numbers the viewer can change, and what they come to per month. */
export interface Roi {
  /** ISO 4217, e.g. "USD" or "EUR". */
  currency: string;
  /** What the monthly figure counts, under it. Default: "extra a month". A calculator of hours says "saved a month". */
  label?: string;
  /** 2 to 5 numbers, each in a field of its own. */
  inputs: RoiInput[];
  /** 1 to 3 gains per month. Each is its inputs multiplied together, times `times` when given. */
  gains: { label: string; from: string[]; times?: number }[];
  /** What the system costs. Left out, the slide shows what comes in and nothing about paying it back. */
  cost?: { monthly?: number; once?: number };
}

export interface RoiInput {
  id: string;
  label: string;
  /** The number the field starts with. */
  value: number;
  /** A percentage counts as a share: 30 multiplies by 0.30. */
  kind?: "percent" | "money";
  /** Default: 0. */
  min?: number;
  /** Default: ten times `value`, and 100 for a percentage. */
  max?: number;
}

/** One action with its place in time: `at` ms after its beat starts. */
export interface Cue {
  beat: number;
  at: number;
  action: Action;
  /** Explainer mode: ms to read what this change put on screen. */
  read: number;
  /** Explainer mode: ms the change takes to arrive before it shows, e.g. along a line. */
  travel: number;
}

/** A beat's cues are cues[from..to). `length` is the whole beat in ms. */
export interface BeatSpan {
  from: number;
  to: number;
  length: number;
  say?: string;
  clock?: string;
  wait: boolean;
}

export interface Timeline {
  cues: Cue[];
  beats: BeatSpan[];
}

/** Where playback is: in `beat`, with the first `n` cues of the whole timeline applied. */
export interface Pos {
  beat: number;
  n: number;
  /** Explainer mode: the screen of the next change is already up, and the change has not happened yet. */
  ahead?: boolean;
}

/** What playback does next from a position. */
export type Step =
  | { kind: "cue"; delay: number }
  | { kind: "gate" }
  /** Explainer mode: the next screen comes up. */
  | { kind: "show"; delay: number }
  | { kind: "beat"; delay: number }
  | { kind: "end"; delay: number };

/** The state of every panel, by panel id. */
export type States = Record<string, unknown>;
