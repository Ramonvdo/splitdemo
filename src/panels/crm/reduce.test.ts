import { expect, it } from "vitest";
import { logic } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

const config: Config = {
  columns: [
    { id: "new", title: "New" },
    { id: "booked", title: "Booked" },
  ],
  cards: [{ id: "omar", column: "booked", title: "Omar Haddad", value: "$340" }],
};
const run = (actions: Action[]) => actions.reduce((state, action) => logic.reduce(state, action, config), logic.initial(config));
const add: Action = { type: "add", id: "dana", to: "new", title: "Dana Whitfield", subtitle: "Chipped tooth" };

it("starts with the cards from the config, untouched", () => {
  expect(logic.initial(config)).toEqual({ cards: [{ id: "omar", column: "booked", title: "Omar Haddad", value: "$340", rev: 0 }] });
});

it("adds a card at the top of its column", () => {
  expect(run([add]).cards).toEqual([
    { id: "dana", column: "new", title: "Dana Whitfield", subtitle: "Chipped tooth", rev: 1, how: "land" },
    { id: "omar", column: "booked", title: "Omar Haddad", value: "$340", rev: 0 },
  ]);
});

it("moves a card to the top of another column", () => {
  const cards = run([add, { type: "move", card: "dana", to: "booked" }]).cards;
  expect(cards.map((c) => [c.id, c.column, c.rev, c.how])).toEqual([
    ["dana", "booked", 2, "land"],
    ["omar", "booked", 0, undefined],
  ]);
});

it("changes a card in place, and only what was named", () => {
  const cards = run([add, { type: "set", card: "omar", tag: "Paid", tone: "good" }]).cards;
  expect(cards).toEqual([
    { id: "dana", column: "new", title: "Dana Whitfield", subtitle: "Chipped tooth", rev: 1, how: "land" },
    { id: "omar", column: "booked", title: "Omar Haddad", value: "$340", tag: "Paid", tone: "good", rev: 1, how: "flash" },
  ]);
});

it("refuses what the board cannot show", () => {
  expect(() => run([add, add])).toThrow('there is already a card "dana"');
  expect(() => run([{ ...add, to: "lost" }])).toThrow('there is no column "lost". Columns: new, booked');
  expect(() => run([{ type: "move", card: "nope", to: "new" }])).toThrow('there is no card "nope". Cards: omar');
  expect(() => run([{ type: "move", card: "omar", to: "booked" }])).toThrow('"omar" is already in "booked"');
  expect(() => run([{ type: "set", card: "omar" }])).toThrow('"set" on "omar" changes nothing. Name a field: title, subtitle, value, tag or tone');
});

it("refuses a fifth card in a column", () => {
  const five = ["a", "b", "c", "d", "e"].map((id): Action => ({ type: "add", id, to: "new", title: id }));
  expect(() => run(five)).toThrow('"new" would hold 5 cards and a column fits 4. Move or leave out a card.');
});
