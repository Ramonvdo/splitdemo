/** A demo is data: panels, and the beats that act on them. This is the shape of demo.json. */
/** How a demo plays: every monitor at once, or one screen at a time with a card before each step. */
export type Mode = "fast" | "explainer";

export type Layout = "rail" | "quad" | "trio" | "duo";

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
