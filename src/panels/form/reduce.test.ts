import { expect, it } from "vitest";
import { logic } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

const config: Config = {
  title: "Request a quote",
  fields: [
    { id: "name", label: "Your name" },
    { id: "need", label: "What do you need?", options: ["Repair", "New roof"] },
  ],
};
const run = (actions: Action[]) => actions.reduce((state, action) => logic.reduce(state, action, config), logic.initial(config));

it("starts empty, is drawn tall, and lets the viewer press send", () => {
  expect(logic.initial(config)).toEqual({ values: {}, sent: false });
  expect(logic.portrait).toBe(true);
  expect(logic.triggers).toEqual(["submit"]);
});

it("fills fields and remembers the one filled last", () => {
  expect(run([{ type: "fill", field: "name", value: "Dana Whitfield" }, { type: "fill", field: "need", value: "Repair" }])).toEqual({
    values: { name: "Dana Whitfield", need: "Repair" },
    last: "need",
    sent: false,
  });
});

it("sends the form with its answers", () => {
  expect(run([{ type: "fill", field: "name", value: "Dana Whitfield" }, { type: "submit" }])).toEqual({ values: { name: "Dana Whitfield" }, sent: true });
});

it("refuses what the form cannot show", () => {
  expect(() => run([{ type: "fill", field: "phone", value: "1" }])).toThrow('there is no field "phone". Fields: name, need');
  expect(() => run([{ type: "fill", field: "need", value: "Gutters" }])).toThrow('"Gutters" is not an answer to "need". Answers: Repair, New roof');
  expect(() => run([{ type: "submit" }])).toThrow("the form is empty. Fill in a field before it is sent");
  const sent: Action[] = [{ type: "fill", field: "name", value: "Dana" }, { type: "submit" }];
  expect(() => run([...sent, { type: "submit" }])).toThrow("the form is already sent");
  expect(() => run([...sent, { type: "fill", field: "name", value: "Sam" }])).toThrow('the form is already sent, so "name" cannot be filled in');
});
