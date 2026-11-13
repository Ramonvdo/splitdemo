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
