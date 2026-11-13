import { expect, it } from "vitest";
import { logic } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

const config: Config = {
  name: "Dentists in Austin",
  status: { text: "Draft" },
  steps: [
    { id: "first", title: "A personal first line", when: "Day 1" },
    { id: "nudge", title: "A short follow-up", when: "Day 4" },
  ],
  stats: [
    { id: "sent", label: "Sent", value: "0" },
    { id: "replies", label: "Replies", value: "0" },
  ],
};
const run = (actions: Action[]) => actions.reduce((state, action) => logic.reduce(state, action, config), logic.initial(config));

it("starts as the config says, with nothing sent", () => {
  expect(logic.initial(config)).toEqual({
    status: { text: "Draft", rev: 0 },
    sent: [],
    notes: {},
    stats: [
      { id: "sent", label: "Sent", value: "0", rev: 0 },
      { id: "replies", label: "Replies", value: "0", rev: 0 },
    ],
  });
});

it("changes the status", () => {
  expect(run([{ type: "status", text: "Sending", tone: "info" }]).status).toEqual({ text: "Sending", tone: "info", rev: 1 });
});

it("sends the steps in order and keeps each note", () => {
  expect(run([{ type: "send", step: "first", note: "212 sent" }, { type: "send", step: "nudge" }])).toMatchObject({ sent: ["first", "nudge"], notes: { first: "212 sent" } });
});

it("changes one counter and leaves the other alone", () => {
  expect(run([{ type: "stat", stat: "replies", value: "9", tone: "good" }]).stats).toEqual([
    { id: "sent", label: "Sent", value: "0", rev: 0 },
    { id: "replies", label: "Replies", value: "9", tone: "good", rev: 1 },
  ]);
});

it("refuses what the campaign cannot show", () => {
  expect(() => run([{ type: "send", step: "nope" }])).toThrow('there is no step "nope". Steps: first, nudge');
  expect(() => run([{ type: "send", step: "nudge" }])).toThrow('"nudge" goes out after "first". Send that one first.');
  expect(() => run([{ type: "send", step: "first" }, { type: "send", step: "first" }])).toThrow('"first" has already gone out');
  expect(() => run([{ type: "stat", stat: "opens", value: "1" }])).toThrow('there is no counter "opens". Counters: sent, replies');
});
