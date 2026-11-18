import { expect, it } from "vitest";
import { clamp, field, shown, sign, typed, work } from "./roi.ts";
import type { Roi } from "./types.ts";

// 40 messages a month, 30% of them booked, $180 each.
const roi: Roi = {
  currency: "USD",
  inputs: [
    { id: "leads", label: "After-hours messages a month", value: 40 },
    { id: "won", label: "Extra ones you book", value: 30, kind: "percent" },
    { id: "value", label: "Worth of a new patient", value: 180, kind: "money" },
  ],
  gains: [{ label: "Patients won back", from: ["leads", "won", "value"] }],
};
const values = { leads: 40, won: 30, value: 180 };

it("multiplies a gain's inputs, a percentage as a share", () => {
  // 40 x 0.30 x 180
  expect(work(roi, values)).toMatchObject({ gains: [{ label: "Patients won back", monthly: 2160 }], monthly: 2160, net: 2160, year: 25_920 });
});

it("follows the numbers the viewer types", () => {
  // 50 x 0.30 x 180
  expect(work(roi, { ...values, leads: 50 }).monthly).toBe(2700);
});

it("adds several gains up, each with its own multiplier", () => {
  const two: Roi = { ...roi, inputs: [...roi.inputs, { id: "hours", label: "Hours saved a week", value: 5 }, { id: "rate", label: "Hourly rate", value: 40, kind: "money" }], gains: [...roi.gains, { label: "Time saved", from: ["hours", "rate"], times: 4 }] };
  // 2,160 and 5 x 40 x 4 weeks
  expect(work(two, { ...values, hours: 5, rate: 40 })).toMatchObject({ gains: [{ monthly: 2160 }, { label: "Time saved", monthly: 800 }], monthly: 2960 });
});

it("takes the cost off: per month, over the first year, and the month it has paid for itself", () => {
  // 2,160 - 300 = 1,860 a month. Twelve months: 22,320 - 5,000. Two months make 3,720, three make 5,580.
  const worked = work({ ...roi, cost: { monthly: 300, once: 5000 } }, values);
  expect(worked).toMatchObject({ monthly: 2160, net: 1860, year: 17_320, payback: 3 });
  expect(worked.running).toEqual([-3140, -1280, 580, 2440, 4300, 6160, 8020, 9880, 11_740, 13_600, 15_460, 17_320]);
});

it("names no payback month without a cost, or when the cost is never earned back", () => {
  expect(work(roi, values).payback).toBeUndefined();
  // 10 x 0.30 x 180 = 540 a month against 600.
  expect(work({ ...roi, cost: { monthly: 600 } }, { ...values, leads: 10 })).toMatchObject({ net: -60, year: -720, payback: undefined });
  // Only a monthly cost, and more comes in: paid for from the first month.
  expect(work({ ...roi, cost: { monthly: 300 } }, values).payback).toBe(1);
});

it("keeps a typed number within what the field allows", () => {
  const leads = roi.inputs[0];
  expect(clamp(leads, 50)).toBe(50);
  // No max given: ten times the starting value.
  expect(clamp(leads, 999)).toBe(400);
  expect(clamp(leads, -3)).toBe(0);
  expect(clamp(leads, Number.NaN)).toBe(0);
  // A share stops at 100.
  expect(clamp(roi.inputs[1], 250)).toBe(100);
  expect(clamp({ ...leads, min: 5, max: 60 }, 1)).toBe(5);
  expect(clamp({ ...leads, min: 5, max: 60 }, 61)).toBe(60);
});

it("writes a number the way the demo's language does", () => {
  expect(shown(2160, "money", "USD", "en")).toBe("$2,160");
  // Dutch puts a space after the sign and a dot in the thousands.
  expect(shown(2160, "money", "EUR", "nl").replace(/\s/g, " ")).toBe("€ 2.160");
  expect(shown(30, "percent", "USD", "en")).toBe("30%");
  expect(shown(1500, undefined, "USD", "nl")).toBe("1.500");
  expect(shown(-3140, "money", "USD", "en")).toBe("-$3,140");
});

it("reads what was typed in a field, with the language's own decimal mark", () => {
  expect(typed("50")).toBe(50);
  expect(typed("1,500")).toBe(1500);
  expect(typed("2.5")).toBe(2.5);
  expect(typed("$50 ")).toBe(50);
  expect(typed("")).toBe(0);
  // Dutch: the comma is the decimal mark, the dot groups thousands.
  expect(typed("2,5", "nl")).toBe(2.5);
  expect(typed("1.500", "nl")).toBe(1500);
  // Not a number: the field's own limits decide.
  expect(typed("1.2.3")).toBeNaN();
});

it("puts a number in a field so that reading it back gives the same number", () => {
  expect(field(1500)).toBe("1500");
  expect(field(2.5)).toBe("2.5");
  expect(field(2.5, "nl")).toBe("2,5");
  expect(typed(field(2.5, "nl"), "nl")).toBe(2.5);
});

it("knows the sign a currency is written with", () => {
  expect(sign("USD")).toBe("$");
  expect(sign("EUR", "nl")).toBe("€");
});
