import { expect, it } from "vitest";
import { logic } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

const config: Config = {
  days: [
    { id: "mon", label: "Mon" },
    { id: "tue", label: "Tue" },
  ],
  events: [
    { id: "re-roof", day: "tue", time: "13:00", title: "Re-roof, day 1" },
    { id: "gutter", day: "mon", time: "08:00", title: "Gutter repair" },
  ],
};
const run = (actions: Action[]) => actions.reduce((state, action) => logic.reduce(state, action, config), logic.initial(config));
const order = (actions: Action[]) => run(actions).events.map((event) => event.id);

it("starts with the bookings from the config, by day and then by time", () => {
  expect(logic.initial(config).events).toEqual([
    { id: "gutter", day: "mon", time: "08:00", title: "Gutter repair", rev: 0 },
    { id: "re-roof", day: "tue", time: "13:00", title: "Re-roof, day 1", rev: 0 },
  ]);
});

it("books into the day in time order", () => {
  const state = run([{ type: "book", id: "leak", day: "tue", time: "08:00", title: "Leak, 14 Birch Lane", tone: "info" }]);
  expect(state.events.map((event) => event.id)).toEqual(["gutter", "leak", "re-roof"]);
  expect(state.events[1]).toEqual({ id: "leak", day: "tue", time: "08:00", title: "Leak, 14 Birch Lane", tone: "info", rev: 1, how: "land" });
});

it("moves a booking to another day", () => {
  const state = run([{ type: "move", event: "re-roof", day: "mon", time: "07:00" }]);
  expect(state.events.map((event) => event.id)).toEqual(["re-roof", "gutter"]);
  expect(state.events[0]).toMatchObject({ day: "mon", time: "07:00", rev: 1, how: "land" });
});

it("keeps a cancelled booking in view until its slot is booked again", () => {
  const cancel: Action = { type: "cancel", event: "gutter" };
  expect(run([cancel]).events[0]).toMatchObject({ id: "gutter", cancelled: true, rev: 1, how: "flash" });
  expect(order([cancel, { type: "book", id: "leak", day: "mon", time: "08:00", title: "Leak" }])).toEqual(["leak", "re-roof"]);
});

it("refuses what the calendar cannot show", () => {
  const book = (id: string, day: string, time: string): Action => ({ type: "book", id, day, time, title: "Job" });
  expect(() => run([book("x", "sat", "09:00")])).toThrow('there is no day "sat". Days: mon, tue');
  expect(() => run([book("gutter", "tue", "09:00")])).toThrow('there is already a booking "gutter"');
  expect(() => run([book("x", "mon", "08:00")])).toThrow('mon 08:00 is taken by "gutter"');
  expect(() => run([book("a", "mon", "09:00"), book("b", "mon", "10:00"), book("c", "mon", "11:00")])).toThrow('"mon" would hold 4 bookings and fits 3');
  expect(() => run([{ type: "move", event: "nope", day: "mon", time: "09:00" }])).toThrow('there is no booking "nope". Bookings: gutter, re-roof');
  expect(() => run([{ type: "move", event: "gutter", day: "mon", time: "08:00" }])).toThrow('"gutter" is already on mon at 08:00');
  expect(() => run([{ type: "move", event: "gutter", day: "tue", time: "13:00" }])).toThrow('tue 13:00 is taken by "re-roof"');
  expect(() => run([{ type: "cancel", event: "gutter" }, { type: "cancel", event: "gutter" }])).toThrow('"gutter" is already cancelled');
  expect(() => run([{ type: "cancel", event: "gutter" }, { type: "move", event: "gutter", day: "tue", time: "09:00" }])).toThrow('"gutter" is cancelled, so it cannot move');
});
