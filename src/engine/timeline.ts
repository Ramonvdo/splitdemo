import type { PanelLogic } from "../panels/types.ts";
import type { BeatSpan, Cue, Demo, Mode, Pos, States, Step, Timeline } from "./types.ts";

/** How long a caption stands before its beat's first action. */
export const LEAD = 800;
/** Between two actions of one beat, so the eye can follow from panel to panel. */
export const STAGGER = 700;

/** Time to read a caption: a base, and a little for every word. */
export function readMs(say: string | undefined): number {
  return say ? 1300 + 140 * count(say) : 900;
}

/**
 * Explainer mode: one screen at a time, at the pace of someone reading along. All of it is worked out from the script,
 * so `after` and `hold` shape the wall only.
 */
export const PACE = {
  /** A card stands this long, and this much longer for every word on it. */
  card: 1300,
  cardWord: 180,
  /** A card or a screen makes way for the next. */
  change: 450,
  /** A screen stands before its first change. */
  settle: 700,
  /** More, the first time a screen is seen: there is a whole app to take in. */
  first: 1200,
  /** Between two changes on one screen. */
  between: 1000,
  /** Reading what a change put on screen, and the most words anyone reads there. */
  word: 160,
  words: 10,
  /** A change that comes in along a line. */
  travel: 600,
  /** Before a screen goes. */
  leave: 900,
  /** A step is over. */
  rest: 1500,
};

function count(text: string): number {
  return text.trim().split(/\s+/).length;
}

/** The words an action puts on screen: every text in it that is more than one word. An id or a tone is one word. */
function wordsIn(value: unknown): number {
  if (typeof value === "string") return /\S\s+\S/.test(value) ? count(value) : 0;
  if (value && typeof value === "object") return Object.values(value).reduce<number>((sum, part) => sum + wordsIn(part), 0);
  return 0;
}

function readingMs(words: number): number {
  return PACE.word * Math.min(words, PACE.words);
}

/** Lays every action of the demo out in time. */
export function compile(demo: Demo): Timeline {
  const cues: Cue[] = [];
  const beats: BeatSpan[] = [];
  let clock: string | undefined;
  demo.beats.forEach((beat, b) => {
    const from = cues.length;
    const wait = beat.wait === "click";
    let at = 0;
    beat.do.forEach((action, i) => {
      // A beat the viewer starts has no lead-in: its first action is their press.
      at += action.after ?? (i > 0 ? STAGGER : wait ? 0 : LEAD);
      cues.push({ beat: b, at, action, read: readingMs(wordsIn(action)), travel: 0 });
    });
    clock = beat.clock ?? clock;
    beats.push({ from, to: cues.length, length: at + (beat.hold ?? readMs(beat.say)), say: beat.say, clock, wait });
  });
  return { cues, beats };
}

/**
 * Explainer mode reads along, and a panel knows best what a change of its own asks of the reader.
 * Gives every change the time its panel says it needs, where the panel says anything.
 */
export function paced(t: Timeline, demo: Demo, logic: (type: string) => PanelLogic | undefined, states: States[]): Timeline {
  const cues = t.cues.map((cue, i) => {
    const spec = demo.panels.find((panel) => panel.id === cue.action.on);
    const { on, after: _after, ...action } = cue.action;
    const own = spec && logic(spec.type)?.pace?.(action, states[i][on], spec.config);
    if (!own) return cue;
    return { ...cue, read: own.words === undefined ? cue.read : readingMs(own.words), travel: own.travels ? PACE.travel : 0 };
  });
  return { ...t, cues };
}

/** The whole demo in ms, not counting how long a viewer takes to press. */
export function duration(t: Timeline, mode: Mode = "fast"): number {
  if (mode === "fast") return t.beats.reduce((sum, b) => sum + b.length, 0);
  let pos: Pos = { beat: 0, n: 0 };
  for (let ms = 0; ; pos = advance(t, pos, mode)) {
    const step = nextStep(t, pos, mode);
    if (step.kind !== "gate") ms += step.delay;
    if (step.kind === "end") return ms;
  }
}

/**
 * The state of every panel after 0, 1, 2 ... all cues. Playback, a seek and a replay all read from this list.
 * Throws on the first action a panel cannot do, with its place in demo.json.
 */
export function snapshots(demo: Demo, logic: (type: string) => PanelLogic | undefined, t: Timeline = compile(demo)): States[] {
  const panels = new Map(
    demo.panels.map((spec) => {
      const found = logic(spec.type);
      if (!found) throw new Error(`panels: "${spec.id}" has unknown type "${spec.type}"`);
      return [spec.id, { spec, logic: found }];
    }),
  );
  let cur: States = {};
  for (const [id, p] of panels) cur[id] = p.logic.initial(p.spec.config);
  const all = [cur];
  t.cues.forEach((cue, i) => {
    const where = `beats[${cue.beat}].do[${i - t.beats[cue.beat].from}]`;
    const { on, after: _after, ...action } = cue.action;
    const panel = panels.get(on);
    if (!panel) throw new Error(`${where}: there is no panel "${on}"`);
    try {
      cur = { ...cur, [on]: panel.logic.reduce(cur[on], action, panel.spec.config) };
    } catch (e) {
      throw new Error(`${where} ("${action.type}" on "${on}"): ${e instanceof Error ? e.message : String(e)}`);
    }
    all.push(cur);
  });
  return all;
}

/** Explainer mode: a card stands, the step's caption alone, before anything of the step shows. */
export function carded(t: Timeline, pos: Pos): boolean {
  const beat = t.beats[pos.beat];
  return !pos.ahead && pos.n === beat.from && beat.say !== undefined;
}

/** Explainer mode: the one panel on screen. The panel of the change to come while a card stands or the screen leads, else of the last change. */
export function screen(t: Timeline, pos: Pos): string | undefined {
  const beat = t.beats[pos.beat];
  const coming = pos.n < beat.to && (pos.ahead || pos.n === beat.from);
  return t.cues[coming ? pos.n : pos.n - 1]?.action.on;
}

function explain(t: Timeline, pos: Pos): Step {
  const beat = t.beats[pos.beat];
  const over = pos.beat === t.beats.length - 1 ? "end" : "beat";
  if (pos.ahead) {
    if (beat.wait && pos.n === beat.from) return { kind: "gate" };
    const on = t.cues[pos.n].action.on;
    const seen = t.cues.slice(0, pos.n).some((cue) => cue.action.on === on);
    return { kind: "cue", delay: PACE.change + PACE.settle + (seen ? 0 : PACE.first) };
  }
  if (pos.n === beat.from) {
    const card = beat.say ? PACE.card + PACE.cardWord * count(beat.say) : 0;
    return { kind: pos.n < beat.to ? "show" : over, delay: card };
  }
  const last = t.cues[pos.n - 1];
  const taken = last.travel + last.read;
  if (pos.n === beat.to) return { kind: over, delay: taken + PACE.rest };
  return t.cues[pos.n].action.on === last.action.on ? { kind: "cue", delay: taken + PACE.between } : { kind: "show", delay: taken + PACE.leave };
}

/** One picture of a demo: where to open it. A picture with `n: 0` is a step's card; `on` names the screen a story picture shows. */
export interface Still {
  at: number | "start" | "end";
  n?: number;
  on?: string;
}

/**
 * The pictures that show a demo whole. On the wall: the start, the end of each beat, the end.
 * In the story: the opening, each step's card, each screen as it is left, and the slide at the end.
 */
export function stills(t: Timeline, mode: Mode): Still[] {
  const out: Still[] = [{ at: "start" }];
  t.beats.forEach((beat, b) => {
    if (mode === "fast") return void out.push({ at: b });
    if (beat.say) out.push({ at: b, n: 0 });
    for (let n = beat.from + 1; n <= beat.to; n++) {
      const on = t.cues[n - 1].action.on;
      if (n === beat.to || t.cues[n].action.on !== on) out.push({ at: b, n: n - beat.from, on });
    }
  });
  out.push({ at: "end" });
  return out;
}

/** What playback does next from `pos`, and after how long. */
export function nextStep(t: Timeline, pos: Pos, mode: Mode = "fast"): Step {
  if (mode === "explainer") return explain(t, pos);
  const beat = t.beats[pos.beat];
  if (pos.n < beat.to) {
    if (beat.wait && pos.n === beat.from) return { kind: "gate" };
    const before = pos.n === beat.from ? 0 : t.cues[pos.n - 1].at;
    return { kind: "cue", delay: t.cues[pos.n].at - before };
  }
  const lastAt = beat.to > beat.from ? t.cues[beat.to - 1].at : 0;
  const delay = beat.length - lastAt;
  return pos.beat === t.beats.length - 1 ? { kind: "end", delay } : { kind: "beat", delay };
}

/**
 * The panels to keep lit at `pos`: every one this beat has acted on so far, so a cause stays lit next to its effect.
 * A beat that waits for a press lights only the panel to press. A beat that has not acted yet keeps the last picture.
 */
export function lit(t: Timeline, pos: Pos): string[] {
  if (nextStep(t, pos).kind === "gate") return [t.cues[pos.n].action.on];
  const from = t.beats[pos.beat].from;
  return [...new Set(t.cues.slice(Math.max(pos.n > from ? from : pos.n - 1, 0), pos.n).map((cue) => cue.action.on))];
}

/** The position one step on: the next cue applied, or the next beat begun. In explainer mode the screen of a change comes up first. */
export function advance(t: Timeline, pos: Pos, mode: Mode = "fast"): Pos {
  const beat = t.beats[pos.beat];
  if (pos.n < beat.to) {
    const up = mode === "fast" || pos.ahead || (pos.n > beat.from && t.cues[pos.n].action.on === t.cues[pos.n - 1].action.on);
    return up ? { beat: pos.beat, n: pos.n + 1 } : { beat: pos.beat, n: pos.n, ahead: true };
  }
  return pos.beat < t.beats.length - 1 ? { beat: pos.beat + 1, n: beat.to } : pos;
}
