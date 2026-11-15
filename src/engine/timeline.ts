import type { PanelLogic } from "../panels/types.ts";
import type { BeatSpan, Cue, Demo, Pos, States, Step, Timeline } from "./types.ts";

/** How long a caption stands before its beat's first action. */
export const LEAD = 400;
/** Between two actions of one beat, so the eye can follow from panel to panel. */
export const STAGGER = 500;

/** Time to read a caption: a base, and a little for every word. */
export function readMs(say: string | undefined): number {
  return say ? 1300 + 140 * say.trim().split(/\s+/).length : 900;
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
      cues.push({ beat: b, at, action });
    });
    clock = beat.clock ?? clock;
    beats.push({ from, to: cues.length, length: at + (beat.hold ?? readMs(beat.say)), say: beat.say, clock, wait });
  });
  return { cues, beats };
}

/** The whole demo in ms, not counting how long a viewer takes to press. */
export function duration(t: Timeline): number {
  return t.beats.reduce((sum, b) => sum + b.length, 0);
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

/** What playback does next from `pos`, and after how long. */
export function nextStep(t: Timeline, pos: Pos): Step {
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

/** The position one step on: the next cue applied, or the next beat begun. */
export function advance(t: Timeline, pos: Pos): Pos {
  const beat = t.beats[pos.beat];
  if (pos.n < beat.to) return { beat: pos.beat, n: pos.n + 1 };
  return pos.beat < t.beats.length - 1 ? { beat: pos.beat + 1, n: beat.to } : pos;
}
