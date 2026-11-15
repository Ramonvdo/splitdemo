import { expect, it } from "vitest";
import { logic } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

const config: Config = { contact: "Harbor Dental", messages: [{ from: "them", text: "Welcome!" }] };
const run = (actions: Action[]) => actions.reduce((state, action) => logic.reduce(state, action, config), logic.initial(config));

it("starts with the thread from the config", () => {
  expect(logic.initial(config)).toEqual({ messages: [{ from: "them", text: "Welcome!" }], typing: false });
  expect(logic.initial({ contact: "Harbor Dental" })).toEqual({ messages: [], typing: false });
});

it("adds what is sent and received, in order", () => {
  expect(
    run([
      { type: "send", text: "Do you have time this week?" },
      { type: "receive", text: "Yes, Thursday at 10:00." },
    ]).messages,
  ).toEqual([
    { from: "them", text: "Welcome!" },
    { from: "me", text: "Do you have time this week?" },
    { from: "them", text: "Yes, Thursday at 10:00." },
  ]);
});

it("shows typing until the next message arrives", () => {
  expect(run([{ type: "typing" }]).typing).toBe(true);
  expect(run([{ type: "typing" }, { type: "receive", text: "Hi" }]).typing).toBe(false);
});

it("shows a notification until the next message", () => {
  const notify: Action = { type: "notify", title: "Calendar", text: "Tomorrow at 10:00" };
  expect(run([notify]).notice).toEqual({ title: "Calendar", text: "Tomorrow at 10:00" });
  expect(run([notify, { type: "receive", text: "See you then" }]).notice).toBeUndefined();
});

it("puts an event in the thread as a line nobody typed", () => {
  expect(run([{ type: "event", text: "Missed call" }, { type: "receive", text: "Sorry we missed you." }]).messages).toEqual([
    { from: "them", text: "Welcome!" },
    { from: "event", text: "Missed call" },
    { from: "them", text: "Sorry we missed you." },
  ]);
});

it("lets the viewer press send, and stands tall", () => {
  expect(logic.triggers).toEqual(["send"]);
  expect(logic.portrait).toBe(true);
});
