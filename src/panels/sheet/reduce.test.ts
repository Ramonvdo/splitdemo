import { expect, it } from "vitest";
import { logic } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

const config: Config = {
  columns: [
    { id: "name", title: "Name" },
    { id: "email", title: "Email" },
    { id: "status", title: "Status", tag: true },
  ],
  rows: [{ id: "omar", cells: { name: "Omar Haddad", status: "Sent" }, tone: "info" }],
};
const run = (actions: Action[]) => actions.reduce((state, action) => logic.reduce(state, action, config), logic.initial(config));

it("starts with the rows from the config, untouched", () => {
  expect(logic.initial(config).rows).toEqual([{ id: "omar", cells: { name: "Omar Haddad", status: "Sent" }, tone: "info", rev: 0, changed: [] }]);
});

it("adds a row at the bottom and marks all of it as new", () => {
  expect(run([{ type: "add", id: "dana", cells: { name: "Dana Whitfield", email: "dana@example.com" } }]).rows[1]).toEqual({
    id: "dana",
    cells: { name: "Dana Whitfield", email: "dana@example.com" },
    rev: 1,
    changed: ["name", "email", "status"],
    landed: true,
  });
});

it("changes only the named cells, and the status pill when the tone changes", () => {
  expect(run([{ type: "set", row: "omar", cells: { email: "omar@example.com" } }]).rows[0]).toEqual({
    id: "omar",
    cells: { name: "Omar Haddad", status: "Sent", email: "omar@example.com" },
    tone: "info",
    rev: 1,
    changed: ["email"],
  });
  expect(run([{ type: "set", row: "omar", tone: "good" }]).rows[0]).toMatchObject({ tone: "good", rev: 1, changed: ["status"] });
});

it("refuses what the sheet cannot show", () => {
  expect(() => run([{ type: "add", id: "omar", cells: {} }])).toThrow('there is already a row "omar"');
  expect(() => run([{ type: "add", id: "x", cells: { phone: "1" } }])).toThrow('there is no column "phone". Columns: name, email, status');
  expect(() => run([{ type: "set", row: "nope", tone: "good" }])).toThrow('there is no row "nope". Rows: omar');
  expect(() => run([{ type: "set", row: "omar" }])).toThrow('"set" on "omar" changes nothing. Name `cells` or `tone`');
  const many = Array.from({ length: 7 }, (_, i): Action => ({ type: "add", id: `r${i}`, cells: {} }));
  expect(() => run(many)).toThrow("the sheet would hold 8 rows and fits 7");
});

it("fills a column down: every row gets the value, and only the rows it changed flash", () => {
  const rows = run([
    { type: "add", id: "dana", cells: { name: "Dana Whitfield", status: "New" } },
    { type: "fill", column: "status", value: "Sent", tone: "info" },
  ]).rows;
  expect(rows.map((row) => [row.id, row.cells.status, row.tone])).toEqual([
    ["omar", "Sent", "info"],
    ["dana", "Sent", "info"],
  ]);
  // Omar was "Sent" in blue already, so nothing about him changed.
  expect(rows.map((row) => [row.rev, row.changed])).toEqual([
    [0, []],
    [2, ["status"]],
  ]);
  expect(() => run([{ type: "fill", column: "phone", value: "1" }])).toThrow('there is no column "phone". Columns: name, email, status');
});
