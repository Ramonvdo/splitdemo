import { describe, expect, it } from "vitest";
import { checkDemo } from "./load.ts";

// A text comes in, the automation reads it and answers. Small enough to count every screen by hand.
const base = {
  v: 1,
  title: "A text after closing",
  panels: [
    { id: "phone", type: "phone", label: "Patient's phone", config: { contact: "Harbor Dental" } },
    {
      id: "flow",
      type: "workflow",
      label: "The automation",
      config: { nodes: [{ id: "a", label: "New text" }, { id: "b", label: "Reads it", after: ["a"] }, { id: "c", label: "Replies", after: ["b"] }] },
    },
  ],
  outcome: [{ value: "38 sec", label: "to first reply", was: "14 h" }],
};
const say = "The text is read the moment it comes in.";
const send = { on: "phone", type: "send", text: "Can I come in this week?" };
const receive = { on: "phone", type: "receive", text: "Thursday at 10 works." };
const run = (node: string) => ({ on: "flow", type: "run", node });

async function notes(beats: unknown[]): Promise<string[]> {
  const checked = await checkDemo({ ...base, beats });
  expect(checked.problems).toEqual([]);
  return checked.notes;
}

describe("notes on a story told one screen at a time", () => {
  it("has none for a story that takes one step at a time", async () => {
    expect(
      await notes([
        { say, wait: "click", do: [send] },
        { say, do: [run("a")] },
        { say, do: [run("b")] },
        { say, do: [run("c"), receive] },
      ]),
    ).toEqual([]);
  });

  it("says when a screen leaves and comes back within a step", async () => {
    // phone, flow, phone: three screens, and the phone twice.
    expect(await notes([{ say, do: [send, run("a"), receive] }])).toEqual([
      'beats[0]: "phone" shows twice in this step (phone, flow, phone). A screen that leaves and comes back reads as two things happening: put its changes together, or split the step.',
    ]);
  });

  it("says when a step runs more than one workflow step", async () => {
    expect(await notes([{ say, do: [send] }, { say, do: [run("a"), run("b")] }])).toEqual([
      "beats[1]: 2 workflow steps run in this step. One a beat, so its card can say what that step does.",
    ]);
  });

  it("says when a step shows more than three screens", async () => {
    // phone, flow, phone, flow.
    expect(await notes([{ say, do: [send, run("a"), receive, run("b")] }])).toEqual([
      'beats[0]: "phone" shows twice in this step (phone, flow, phone, flow). A screen that leaves and comes back reads as two things happening: put its changes together, or split the step.',
      "beats[0]: 4 screens in one step. A viewer follows three at most: split the step.",
      "beats[0]: 2 workflow steps run in this step. One a beat, so its card can say what that step does.",
    ]);
  });

  it("says when the story runs past 110 seconds", async () => {
    // Sixteen steps, each a card of nine words (about 3 s) and a text sent and answered (about 5 s): over two minutes.
    const long = Array.from({ length: 16 }, (_, i) => ({ say, do: [...(i < 3 ? [run("abc"[i])] : []), send, receive] }));
    expect(await notes(long)).toContainEqual(expect.stringMatching(/^explainer: about 1[2-9]\d s\. Past 110 s /));
    // The short story above has no such note.
    expect(await notes([{ say, do: [send] }, { say, do: [run("a")] }])).toEqual([]);
  });
});

it("says what replaced a calculator written for an older version", async () => {
  const old = { currency: "USD", inputs: [{ id: "leads", label: "Leads a month", value: 40 }, { id: "worth", label: "Worth of one", value: 180, kind: "money" }], gains: [{ label: "Won back", from: ["leads", "worth"] }] };
  const checked = await checkDemo({ ...base, beats: [{ say, wait: "click", do: [send] }], results: { roi: old } });
  expect(checked.problems).toEqual([
    "results.roi.gains: gone since 0.3.0. A calculator is one chain now: list `inputs` in the order they multiply, and name the one the system changes in `lever` (format.md, Results)",
  ]);
});
