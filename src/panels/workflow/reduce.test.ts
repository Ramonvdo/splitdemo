import { expect, it } from "vitest";
import { place } from "./place.ts";
import { logic } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

// text > read > (reply, card) > done
const config: Config = {
  nodes: [
    { id: "text", label: "New text message" },
    { id: "read", label: "Reads the message", after: ["text"] },
    { id: "reply", label: "Replies", after: ["read"] },
    { id: "card", label: "Adds the lead", after: ["read"] },
    { id: "done", label: "Tells the owner", after: ["reply", "card"] },
  ],
};
const run = (actions: Action[]) => actions.reduce((state, action) => logic.reduce(state, action, config), logic.initial(config));

it("places a step one column past the last step it follows", () => {
  expect(place(config.nodes)).toEqual({
    cols: 4,
    at: {
      text: { col: 0, row: 0, rows: 1 },
      read: { col: 1, row: 0, rows: 1 },
      reply: { col: 2, row: 0, rows: 2 },
      card: { col: 2, row: 1, rows: 2 },
      done: { col: 3, row: 0, rows: 1 },
    },
  });
});

it("refuses a flow it cannot draw", () => {
  expect(() => place([{ id: "a", after: ["b"] }, { id: "b", after: ["a"] }])).toThrow('"a" comes after itself: a > b > a');
  expect(() => place([{ id: "a", after: ["zz"] }])).toThrow('"a" comes after "zz", which is not a node');
  const chain = ["a", "b", "c", "d", "e", "f", "g"].map((id, i, all) => ({ id, after: i ? [all[i - 1]] : undefined }));
  expect(() => place(chain)).toThrow("the flow is 7 steps long and the canvas fits 6");
});

it("starts with nothing run", () => {
  expect(logic.initial(config)).toEqual({ ran: [], runs: 0, notes: {} });
});

it("remembers what ran, which ran last, and what it found", () => {
  expect(run([{ type: "run", node: "text" }, { type: "run", node: "read", note: "Urgent, new patient" }])).toEqual({
    ran: ["text", "read"],
    last: "read",
    // "read" follows "text", which had run.
    along: true,
    runs: 2,
    notes: { read: "Urgent, new patient" },
  });
});

it("knows whether the last step was reached along a line: not the step that starts the flow, and not a step that runs again", () => {
  expect(run([{ type: "run", node: "text" }]).along).toBe(false);
  expect(run([{ type: "run", node: "text" }, { type: "run", node: "read" }, { type: "run", node: "read" }]).along).toBe(false);
});

it("runs a step that follows two others once either has run", () => {
  expect(run([{ type: "run", node: "text" }, { type: "run", node: "read" }, { type: "run", node: "card" }, { type: "run", node: "done" }]).last).toBe("done");
});

it("refuses a step whose earlier steps have not run", () => {
  expect(() => run([{ type: "run", node: "text" }, { type: "run", node: "reply" }])).toThrow('"reply" comes after "read", which has not run yet');
  expect(() => run([{ type: "run", node: "nope" }])).toThrow('there is no node "nope". Nodes: text, read, reply, card, done');
});

it("says a step is reached along a line when a step before it ran, the first time", () => {
  const pace = (before: Action[], action: Action) => logic.pace?.(action, run(before), config);
  expect(pace([], { type: "run", node: "text" })).toBeUndefined();
  expect(pace([{ type: "run", node: "text" }], { type: "run", node: "read" })).toEqual({ travels: true });
  expect(pace([{ type: "run", node: "text" }, { type: "run", node: "read" }], { type: "run", node: "read" })).toBeUndefined();
});
