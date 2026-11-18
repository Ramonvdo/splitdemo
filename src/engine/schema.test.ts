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

// The calculator the plan's example gives: 40 messages, 30% booked, $180 each.
const roi = {
  currency: "USD",
  inputs: [
    { id: "leads", label: "After-hours messages a month", value: 40 },
    { id: "won", label: "Extra ones you book", value: 30, kind: "percent" },
    { id: "value", label: "Worth of a new patient", value: 180, kind: "money" },
  ],
  gains: [{ label: "Patients won back", from: ["leads", "won", "value"] }],
  cost: { monthly: 300, once: 1500 },
};

it("takes a demo without a results slide, and one with a calculator and a language", () => {
  expect(demo.safeParse(example).success).toBe(true);
  expect(demo.safeParse({ ...example, lang: "nl", results: { title: "What a missed message costs", text: "Every evening message used to wait until morning.", roi } }).success).toBe(true);
  expect(demo.safeParse({ ...example, results: {} }).success).toBe(true);
});

it("refuses a calculator that cannot be worked out", () => {
  const refused = (change: object) => demo.safeParse({ ...example, results: { roi: { ...roi, ...change } } }).success;
  // A gain made of a number nobody can fill in.
  expect(refused({ gains: [{ label: "Patients won back", from: ["leads", "visits"] }] })).toBe(false);
  // Two fields under one id.
  expect(refused({ inputs: [roi.inputs[0], roi.inputs[0], roi.inputs[2]] })).toBe(false);
  // A cost of nothing.
  expect(refused({ cost: {} })).toBe(false);
  expect(refused({ currency: "dollars" })).toBe(false);
  expect(refused({ inputs: [roi.inputs[0]] })).toBe(false);
  expect(demo.safeParse({ ...example, lang: "de" }).success).toBe(false);
});
