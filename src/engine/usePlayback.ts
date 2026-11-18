import { useEffect, useMemo, useReducer } from "react";
import { advance, carded, lit, nextStep, screen } from "./timeline.ts";
import type { Cue, Mode, Pos, Timeline } from "./types.ts";

export type Status = "idle" | "playing" | "paused" | "done";

interface State {
  pos: Pos;
  status: Status;
  /** The last change was a jump, so it shows without motion. */
  still: boolean;
  mode: Mode;
}

type Msg = "play" | "pause" | "tick" | "press" | "next" | "prev" | "replay" | Mode;

/** How long a waiting beat gives the viewer before it presses for them. */
const GATE_MS = 4000;
const GATE_MS_AUTOPLAY = 1200;

function step(t: Timeline, s: State, msg: Msg): State {
  const beat = t.beats[s.pos.beat];
  const last = t.beats.length - 1;
  const start: Pos = { beat: 0, n: 0 };
  switch (msg) {
    case "play":
      return s.status === "done" ? { ...s, pos: start, status: "playing", still: false } : { ...s, status: "playing", still: false };
    case "pause":
      return s.status === "playing" ? { ...s, status: "paused" } : s;
    case "tick":
      if (s.status !== "playing") return s;
      return nextStep(t, s.pos, s.mode).kind === "end" ? { ...s, status: "done" } : { ...s, pos: advance(t, s.pos, s.mode) };
    case "press":
      return nextStep(t, s.pos, s.mode).kind === "gate" && s.status !== "done" ? { ...s, pos: advance(t, s.pos, s.mode), status: "playing", still: false } : s;
    case "next":
      if (s.status === "done") return s;
      if (s.pos.n < beat.to) return { ...s, pos: { beat: s.pos.beat, n: beat.to }, status: "paused", still: false };
      if (s.pos.beat === last) return { ...s, status: "done", still: false };
      return { ...s, pos: { beat: s.pos.beat + 1, n: t.beats[s.pos.beat + 1].to }, status: "paused", still: false };
    case "prev":
      if (s.status === "done") return { ...s, status: "paused", still: true };
      if (s.pos.beat === 0) return { ...s, pos: start, status: "idle", still: true };
      return { ...s, pos: { beat: s.pos.beat - 1, n: t.beats[s.pos.beat - 1].to }, status: "paused", still: true };
    case "replay":
      return { ...s, pos: start, status: "playing", still: false };
    case "fast":
    case "explainer":
      // The same step in the other mode: what has happened stays, a screen that led the way does not.
      return s.mode === msg ? s : { ...s, mode: msg, pos: { beat: s.pos.beat, n: s.pos.n } };
  }
}

export interface Playback {
  pos: Pos;
  status: Status;
  still: boolean;
  mode: Mode;
  /** The action the demo is waiting on the viewer to press. */
  gate: Cue | undefined;
  /** The id of the panel that is live: the one last acted on, or the one waiting for a press. */
  focus: string | undefined;
  /** The ids of the panels this beat is about: `focus`, and the ones it acted on before in the same beat. */
  lit: string[];
  /** Explainer mode: the one panel on screen. */
  screen: string | undefined;
  /** Explainer mode: the step's card stands, and nothing of the step shows yet. */
  card: boolean;
  toggle(): void;
  /** Finish this beat, or show the next one. */
  next(): void;
  /** Back to the end of the beat before. */
  prev(): void;
  replay(): void;
  /** Press the action the demo is waiting on. */
  press(): void;
  setMode(mode: Mode): void;
}

export interface PlaybackOptions {
  /** Nobody is there to press: a beat that waits presses for itself after a moment. The stage starts the story. */
  autoplay?: boolean;
  /** Open on the start, on the end of this beat, or on the end of the demo, without motion. */
  at?: number | "start" | "end";
  /** With a beat in `at`: open with only its first `n` changes made. 0 is the beat before anything happened, where explainer mode shows its card. */
  n?: number;
  mode?: Mode;
}

function open(t: Timeline, { at, n, mode = "fast" }: PlaybackOptions): State {
  if (at === "end") return { pos: { beat: t.beats.length - 1, n: t.cues.length }, status: "done", still: true, mode };
  if (typeof at === "number" && t.beats[at]) {
    const beat = t.beats[at];
    return { pos: { beat: at, n: n === undefined ? beat.to : Math.min(beat.from + n, beat.to) }, status: "paused", still: true, mode };
  }
  return { pos: { beat: 0, n: 0 }, status: "idle", still: at === "start", mode };
}

/** Runs a timeline: one timer per step, and every jump is a plain change of position. */
export function usePlayback(t: Timeline, options: PlaybackOptions = {}): Playback {
  const [s, send] = useReducer((state: State, msg: Msg) => step(t, state, msg), undefined, () => open(t, options));
  const { autoplay } = options;

  useEffect(() => {
    if (s.status !== "playing") return;
    const next = nextStep(t, s.pos, s.mode);
    const timer = next.kind === "gate" ? setTimeout(() => send("press"), autoplay ? GATE_MS_AUTOPLAY : GATE_MS) : setTimeout(() => send("tick"), next.delay);
    return () => clearTimeout(timer);
  }, [t, s.pos, s.status, s.mode, autoplay]);

  return useMemo(() => {
    const waiting = s.status !== "done" && nextStep(t, s.pos, s.mode).kind === "gate";
    const gate = waiting ? t.cues[s.pos.n] : undefined;
    const focus = s.status === "done" ? undefined : (gate ?? t.cues[s.pos.n - 1])?.action.on;
    return {
      ...s,
      gate,
      focus,
      lit: s.status === "done" ? [] : lit(t, s.pos),
      screen: screen(t, s.pos),
      // Before the story starts the opening card stands instead: the stage draws that one.
      card: s.status !== "idle" && s.status !== "done" && carded(t, s.pos),
      toggle: () => send(s.status === "playing" ? "pause" : "play"),
      next: () => send("next"),
      prev: () => send("prev"),
      replay: () => send("replay"),
      press: () => send("press"),
      setMode: (mode: Mode) => send(mode),
    };
  }, [t, s]);
}
