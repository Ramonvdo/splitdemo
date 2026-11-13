import { expect, it } from "vitest";
import { logic } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

const config: Config = {
  tiles: [
    { id: "reply", label: "Time to first reply", value: "14 h" },
    { id: "booked", label: "Booked this week", value: "6", delta: "+1" },
  ],
  chart: {
    title: "Bookings per day",
    points: [
      { label: "Mon", value: 2 },
      { label: "Tue", value: 1 },
    ],
  },
};
const run = (actions: Action[], cfg = config) => actions.reduce((state, action) => logic.reduce(state, action, cfg), logic.initial(cfg));

it("starts with the numbers from the config, untouched", () => {
  expect(logic.initial(config)).toEqual({
    tiles: [
      { id: "reply", label: "Time to first reply", value: "14 h", rev: 0 },
      { id: "booked", label: "Booked this week", value: "6", delta: "+1", rev: 0 },
    ],
    points: [
      { label: "Mon", value: 2 },
      { label: "Tue", value: 1 },
    ],
  });
});

it("changes one tile and leaves the other alone", () => {
  expect(run([{ type: "set", tile: "reply", value: "38 sec", delta: "was 14 h", tone: "good" }]).tiles).toEqual([
    { id: "reply", label: "Time to first reply", value: "38 sec", delta: "was 14 h", tone: "good", rev: 1 },
    { id: "booked", label: "Booked this week", value: "6", delta: "+1", rev: 0 },
  ]);
});

it("keeps a tile's delta when only the value is set", () => {
  expect(run([{ type: "set", tile: "booked", value: "7" }]).tiles[1]).toEqual({ id: "booked", label: "Booked this week", value: "7", delta: "+1", rev: 1 });
});

it("changes a bar that is there, and adds one that is not", () => {
  expect(run([{ type: "push", label: "Tue", value: 3 }, { type: "push", label: "Wed", value: 1 }]).points).toEqual([
    { label: "Mon", value: 2 },
    { label: "Tue", value: 3 },
    { label: "Wed", value: 1 },
  ]);
});

it("refuses what the board cannot show", () => {
  expect(() => run([{ type: "set", tile: "nope", value: "1" }])).toThrow('there is no tile "nope". Tiles: reply, booked');
  expect(() => run([{ type: "push", label: "Wed", value: 1 }], { tiles: config.tiles })).toThrow("this board has no chart to push to. Add `chart` to the panel's config.");
  const many = Array.from({ length: 11 }, (_, i): Action => ({ type: "push", label: `d${i}`, value: 1 }));
  expect(() => run(many)).toThrow("the chart would hold 13 bars and fits 12");
});
