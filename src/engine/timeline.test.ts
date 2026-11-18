import { describe, expect, it } from "vitest";
import type { PanelLogic } from "../panels/types.ts";
import { advance, compile, duration, lit, nextStep, paced, readMs, screen, snapshots } from "./timeline.ts";
import type { Demo, Mode, Pos, Timeline } from "./types.ts";

/** A panel that only counts, so every expected value below can be worked out by hand. */
const counter: PanelLogic<{ start: number }, number, { type: "inc"; by: number }> = {
  icon: "bolt",
  initial: (config) => config.start,
  reduce: (state, action) => {
    if (action.by < 0) throw new Error("cannot count down");
    return state + action.by;
  },
};
const logic = (type: string) => (type === "counter" ? counter : undefined);

const demo: Demo = {
  v: 1,
  title: "Counting",
  panels: [{ id: "c", type: "counter", label: "Counter", config: { start: 10 } }],
  outcome: [{ value: "14", label: "counted" }],
  beats: [
    // 3 words: 1300 + 3 x 140 = 1720 ms to read.
    { say: "one two three", clock: "09:00", do: [{ on: "c", type: "inc", by: 1 }, { on: "c", type: "inc", by: 2, after: 200 }] },
    { wait: "click", hold: 1000, do: [{ on: "c", type: "inc", by: 1 }] },
    { do: [] },
  ],
};

describe("compile", () => {
  const t = compile(demo);

  it("places a beat's actions in time: a lead-in, then `after`", () => {
    expect(t.cues.map((c) => [c.beat, c.at])).toEqual([
      [0, 800],
      [0, 1000],
      [1, 0],
    ]);
  });

  it("gives each beat its cues and its length", () => {
    expect(t.beats.map((b) => [b.from, b.to, b.length, b.wait])).toEqual([
      [0, 2, 2720, false],
      [2, 3, 1000, true],
      [3, 3, 900, false],
    ]);
  });

  it("staggers actions that give no `after` by 700 ms", () => {
    const two = compile({ ...demo, beats: [{ hold: 0, do: [{ on: "c", type: "inc", by: 1 }, { on: "c", type: "inc", by: 1 }] }] });
    expect(two.cues.map((c) => c.at)).toEqual([800, 1500]);
  });

  it("carries the story clock forward", () => {
    expect(t.beats.map((b) => b.clock)).toEqual(["09:00", "09:00", "09:00"]);
  });

  it("adds up to the whole demo", () => {
    expect(duration(t)).toBe(4620);
  });
});

describe("readMs", () => {
  it("is 1300 ms plus 140 ms a word, and 900 ms for no words", () => {
    expect(readMs("A lead texts at night")).toBe(2000);
    expect(readMs(undefined)).toBe(900);
  });
});

describe("snapshots", () => {
  it("holds the state after every cue, from none to all", () => {
    expect(snapshots(demo, logic)).toEqual([{ c: 10 }, { c: 11 }, { c: 13 }, { c: 14 }]);
  });

  it("keeps the state of a panel that a cue did not touch", () => {
    const two: Demo = { ...demo, panels: [...demo.panels, { id: "d", type: "counter", label: "Other", config: { start: 0 } }] };
    const all = snapshots(two, logic);
    expect(all[3]).toEqual({ c: 14, d: 0 });
    expect(all[3].d).toBe(all[0].d);
  });

  it("says where an impossible action is", () => {
    const bad: Demo = { ...demo, beats: [{ do: [{ on: "c", type: "inc", by: 1 }, { on: "c", type: "inc", by: -1 }] }] };
    expect(() => snapshots(bad, logic)).toThrow('beats[0].do[1] ("inc" on "c"): cannot count down');
  });

  it("says when an action names a panel that is not there", () => {
    const bad: Demo = { ...demo, beats: [{ do: [{ on: "nope", type: "inc", by: 1 }] }] };
    expect(() => snapshots(bad, logic)).toThrow('beats[0].do[0]: there is no panel "nope"');
  });

  it("says when a panel has an unknown type", () => {
    const bad: Demo = { ...demo, panels: [{ id: "c", type: "abacus", label: "Abacus", config: {} }] };
    expect(() => snapshots(bad, logic)).toThrow('panels: "c" has unknown type "abacus"');
  });
});

describe("playback", () => {
  const t = compile(demo);

  it("walks the whole demo one step at a time", () => {
    const seen: unknown[] = [];
    let pos: Pos = { beat: 0, n: 0 };
    for (;;) {
      const step = nextStep(t, pos);
      seen.push([pos.beat, pos.n, step]);
      if (step.kind === "end") break;
      pos = advance(t, pos);
    }
    expect(seen).toEqual([
      [0, 0, { kind: "cue", delay: 800 }],
      [0, 1, { kind: "cue", delay: 200 }],
      [0, 2, { kind: "beat", delay: 1720 }],
      [1, 2, { kind: "gate" }],
      [1, 3, { kind: "beat", delay: 1000 }],
      [2, 3, { kind: "end", delay: 900 }],
    ]);
  });

  it("stays put at the end", () => {
    expect(advance(t, { beat: 2, n: 3 })).toEqual({ beat: 2, n: 3 });
  });
});

describe("lit", () => {
  const two: Demo = {
    ...demo,
    panels: [
      { id: "c", type: "counter", label: "Cause", config: { start: 0 } },
      { id: "d", type: "counter", label: "Effect", config: { start: 0 } },
    ],
    beats: [
      { say: "one", do: [{ on: "c", type: "inc", by: 1 }, { on: "d", type: "inc", by: 1 }] },
      { say: "two", do: [{ on: "c", type: "inc", by: 1 }] },
      { wait: "click", do: [{ on: "d", type: "inc", by: 1 }, { on: "c", type: "inc", by: 1 }] },
    ],
  };
  const t = compile(two);

  it("lights every panel the beat has acted on so far: the cause stays lit next to its effect", () => {
    expect(lit(t, { beat: 0, n: 0 })).toEqual([]);
    expect(lit(t, { beat: 0, n: 1 })).toEqual(["c"]);
    expect(lit(t, { beat: 0, n: 2 })).toEqual(["c", "d"]);
  });

  it("keeps the last picture lit while the next beat has not acted yet", () => {
    expect(lit(t, { beat: 1, n: 2 })).toEqual(["d"]);
    expect(lit(t, { beat: 1, n: 3 })).toEqual(["c"]);
  });

  it("lights only the panel that waits for a press", () => {
    expect(lit(t, { beat: 2, n: 3 })).toEqual(["d"]);
    expect(lit(t, { beat: 2, n: 5 })).toEqual(["d", "c"]);
  });
});

/** Every position a demo passes through when it is left to play, with what happens next at each. */
function walk(t: Timeline, mode: Mode): unknown[] {
  const seen: unknown[] = [];
  let pos: Pos = { beat: 0, n: 0 };
  for (;;) {
    const step = nextStep(t, pos, mode);
    seen.push([pos.beat, pos.n, pos.ahead === true, step]);
    if (step.kind === "end") return seen;
    pos = advance(t, pos, mode);
  }
}

describe("explainer", () => {
  const t = compile(demo);
  const two: Demo = {
    ...demo,
    panels: [
      { id: "c", type: "counter", label: "Cause", config: { start: 0 } },
      { id: "d", type: "counter", label: "Effect", config: { start: 0 } },
    ],
    beats: [
      { say: "one", do: [{ on: "c", type: "inc", by: 1 }, { on: "d", type: "inc", by: 1 }] },
      { say: "two", do: [{ on: "c", type: "inc", by: 1 }] },
      { wait: "click", do: [{ on: "d", type: "inc", by: 1 }, { on: "c", type: "inc", by: 1 }] },
    ],
  };

  it("walks one screen at a time: the card, the screen, then each change on it", () => {
    expect(walk(t, "explainer")).toEqual([
      // The card stands alone: 1300 + 3 words x 180.
      [0, 0, false, { kind: "show", delay: 1840 }],
      // The counter comes up for the first time: 450 to change screens, 700 before its first change, 1200 to take it in.
      [0, 0, true, { kind: "cue", delay: 2350 }],
      // The next change is on the same screen. `after` does not count here.
      [0, 1, false, { kind: "cue", delay: 1000 }],
      // The step is over.
      [0, 2, false, { kind: "beat", delay: 1500 }],
      // A beat without a caption has no card. Its screen comes up and waits for the press.
      [1, 2, false, { kind: "show", delay: 0 }],
      [1, 2, true, { kind: "gate" }],
      [1, 3, false, { kind: "beat", delay: 1500 }],
      [2, 3, false, { kind: "end", delay: 0 }],
    ]);
  });

  it("changes screens between two changes on different panels, and gives a screen seen before less time", () => {
    expect(walk(compile(two), "explainer")).toEqual([
      [0, 0, false, { kind: "show", delay: 1480 }],
      [0, 0, true, { kind: "cue", delay: 2350 }],
      // 900 before the screen goes.
      [0, 1, false, { kind: "show", delay: 900 }],
      [0, 1, true, { kind: "cue", delay: 2350 }],
      [0, 2, false, { kind: "beat", delay: 1500 }],
      [1, 2, false, { kind: "show", delay: 1480 }],
      // The first counter again: 450 + 700.
      [1, 2, true, { kind: "cue", delay: 1150 }],
      [1, 3, false, { kind: "beat", delay: 1500 }],
      [2, 3, false, { kind: "show", delay: 0 }],
      [2, 3, true, { kind: "gate" }],
      [2, 4, false, { kind: "show", delay: 900 }],
      [2, 4, true, { kind: "cue", delay: 1150 }],
      [2, 5, false, { kind: "end", delay: 1500 }],
    ]);
  });

  it("shows the screen of the change to come while a card stands or the screen leads, else of the last change", () => {
    const t2 = compile(two);
    expect(screen(t2, { beat: 0, n: 0 })).toBe("c");
    expect(screen(t2, { beat: 0, n: 1 })).toBe("c");
    expect(screen(t2, { beat: 0, n: 1, ahead: true })).toBe("d");
    expect(screen(t2, { beat: 0, n: 2 })).toBe("d");
    expect(screen(t2, { beat: 1, n: 2 })).toBe("c");
  });

  it("gives a change time to be read: 160 ms a word of what it put on screen, ten words at most", () => {
    const read = (payload: Record<string, unknown>) => compile({ ...demo, beats: [{ do: [{ on: "c", type: "inc", by: 1, ...payload }] }] }).cues[0].read;
    expect(read({})).toBe(0);
    // An id or a tone is one word and nobody reads it.
    expect(read({ note: "Booked for Thursday", id: "dana", tone: "good" })).toBe(480);
    expect(read({ cells: { name: "Dana Whitfield", status: "New" }, lines: ["One more"] })).toBe(640);
    expect(read({ text: "one two three four five six seven eight nine ten eleven twelve" })).toBe(1600);
  });

  it("reads after the change, before the screen goes", () => {
    const one = compile({ ...demo, beats: [{ do: [{ on: "c", type: "inc", by: 1, note: "Booked for Thursday" }] }] });
    expect(walk(one, "explainer")).toEqual([
      [0, 0, false, { kind: "show", delay: 0 }],
      [0, 0, true, { kind: "cue", delay: 2350 }],
      [0, 1, false, { kind: "end", delay: 480 + 1500 }],
    ]);
  });

  it("asks the panel where the words in an action are not what it puts on screen", () => {
    // This counter shows its count in words when it goes up by two, and the change comes in along a line.
    const wordy: PanelLogic<{ start: number }, number, { type: "inc"; by: number }> = {
      ...counter,
      pace: (action, state) => (action.by === 2 ? { words: state, travels: true } : undefined),
    };
    const own = (type: string) => (type === "counter" ? wordy : undefined);
    // Before the second change the counter stands at 11: more than ten words, so ten. The line takes 600.
    expect(paced(t, demo, own, snapshots(demo, own, t)).cues.map((c) => [c.read, c.travel])).toEqual([
      [0, 0],
      [1600, 600],
      [0, 0],
    ]);
  });

  it("adds up, leaving out the time a viewer takes to press", () => {
    expect(duration(t, "explainer")).toBe(8190);
    expect(duration(t, "fast")).toBe(4620);
  });

  it("stays put at the end", () => {
    expect(advance(t, { beat: 2, n: 3 }, "explainer")).toEqual({ beat: 2, n: 3 });
  });
});
