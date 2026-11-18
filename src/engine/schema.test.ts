import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { demo } from "./schema.ts";

const example = JSON.parse(readFileSync(new URL("../../examples/speed-to-lead/demo.json", import.meta.url), "utf8"));

it("takes a next step that opens a web page or an email", () => {
  expect(demo.safeParse({ ...example, next: { label: "Book a call", url: "https://example.com/call" } }).success).toBe(true);
  expect(demo.safeParse({ ...example, next: { label: "Email us", url: "mailto:hello@example.com" } }).success).toBe(true);
});

it("refuses a next step whose link would run code or leave https", () => {
  for (const url of ["javascript:alert(1)", "http://example.com", "data:text/html,hi", " https://example.com", "https://"])
    expect(demo.safeParse({ ...example, next: { label: "Book a call", url } }).success, url).toBe(false);
});

// A dentist's calculator: 40 messages after closing, 10 in 100 book today, the system adds 20 points, $180 a visit.
const roi = {
  currency: "USD",
  inputs: [
    { id: "texts", label: "After-hours messages a month", ask: "How many messages come in after closing, in a month?", value: 40 },
    { id: "booked", label: "Share that books a visit", stage: "Visits", ask: "Of every 100, how many book a visit today?", value: 10, kind: "percent" },
    { id: "visit", label: "Worth of a first visit", value: 180, kind: "money", note: "Taken from the story" },
  ],
  lever: { input: "booked", add: 20 },
  cost: { monthly: 300, once: 1500 },
};

it("takes a demo without a results slide, and one with a calculator and a language", () => {
  expect(demo.safeParse(example).success).toBe(true);
  expect(demo.safeParse({ ...example, lang: "nl", results: { title: "What a missed message costs", text: "Every evening message used to wait until morning.", roi } }).success).toBe(true);
  expect(demo.safeParse({ ...example, results: {} }).success).toBe(true);
  // What the monthly figure counts, when "extra a month" would say the wrong thing.
  expect(demo.safeParse({ ...example, results: { roi: { ...roi, label: "saved a month" } } }).success).toBe(true);
  expect(demo.safeParse({ ...example, results: { roi: { ...roi, label: "saved every single month of the year" } } }).success).toBe(false);
});

const said = (change: object) => {
  const result = demo.safeParse({ ...example, results: { roi: { ...roi, ...change } } });
  return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
};

it("takes a lever that adds to what they do today, or one that is the system's own number", () => {
  expect(said({})).toEqual([]);
  expect(said({ lever: { input: "booked", to: 35 } })).toEqual([]);
  // A cost that goes down: 40 messages at 12 minutes each become 2, at 30 an hour.
  const minutes = { id: "minutes", label: "Minutes on each", ask: "How many minutes does one take?", value: 12 };
  const hour = { id: "hour", label: "Cost of an hour", value: 30, kind: "money" };
  expect(said({ inputs: [roi.inputs[0], minutes, hour], lever: { input: "minutes", to: 2 }, times: 1 / 60, saving: true })).toEqual([]);
  // What is won pays every month.
  expect(said({ monthly: true })).toEqual([]);
});

it("refuses a calculator that cannot be worked out, and says why", () => {
  expect(said({ lever: undefined })).not.toEqual([]);
  expect(said({ lever: { input: "booked" } })).toEqual(["results.roi.lever: give `add` (what the system adds to their number) or `to` (the system's own number), one of the two"]);
  expect(said({ lever: { input: "booked", add: 20, to: 30 } })).toEqual(["results.roi.lever: give `add` (what the system adds to their number) or `to` (the system's own number), one of the two"]);
  expect(said({ lever: { input: "visits", add: 20 } })).toEqual([`results.roi.lever.input: no input is called "visits"`]);
  expect(said({ lever: { input: "booked", to: 120 } })).toEqual(["results.roi.lever.to: a share stops at 100"]);
  // The system's number is what they already do, so nothing changes.
  expect(said({ lever: { input: "booked", to: 10 } })).toEqual(["results.roi.lever: with these numbers the system changes nothing. Its number has to beat today's (or, with `saving`, come under it)"]);
  // A saving and a fee that keeps paying are two different sums.
  expect(said({ saving: true, monthly: true })).toContain("results.roi.monthly: not with `saving`. `monthly` is for clients who keep paying");
  // The old shape.
  expect(said({ gains: [{ label: "Patients won back", from: ["texts", "booked", "visit"] }] })).not.toEqual([]);
  // Two fields under one id.
  expect(said({ inputs: [roi.inputs[0], roi.inputs[1], roi.inputs[1]] })).toContain(`results.roi.inputs.2.id: "booked" is used twice`);
  // A cost of nothing.
  expect(said({ cost: {} })).not.toEqual([]);
  expect(said({ currency: "dollars" })).not.toEqual([]);
  expect(said({ inputs: [roi.inputs[1]] })).not.toEqual([]);
  expect(demo.safeParse({ ...example, lang: "de" }).success).toBe(false);
});

it("asks the viewer one to four things", () => {
  const plain = roi.inputs.map(({ ask: _ask, ...input }) => input);
  expect(said({ inputs: plain })).toEqual(["results.roi.inputs: no input has an `ask`. Give one to the numbers an owner knows offhand, so the slide has something to ask"]);
  const five = [...roi.inputs, { id: "shows", label: "Share that shows up", value: 90, kind: "percent" }, { id: "stays", label: "Share that stays", value: 80, kind: "percent" }].map((input) => ({ ...input, ask: "How many?" }));
  expect(said({ inputs: five })).toEqual(["results.roi.inputs: 5 inputs have an `ask`. Four questions at most: the rest are estimates the viewer can change on the report"]);
  expect(said({ inputs: [{ ...roi.inputs[0], ask: "x".repeat(91) }, roi.inputs[1], roi.inputs[2]] })).not.toEqual([]);
  expect(said({ inputs: [roi.inputs[0], { ...roi.inputs[1], stage: "x".repeat(17) }, roi.inputs[2]] })).not.toEqual([]);
  expect(said({ inputs: [roi.inputs[0], roi.inputs[1], { ...roi.inputs[2], note: "x".repeat(81) }] })).not.toEqual([]);
});
