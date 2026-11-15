import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { ROOT } from "../scripts/lib/workspace.ts";

test.describe.configure({ mode: "serial", timeout: 180_000 });

let ws: string;

function shots(slug: string) {
  return spawnSync(process.execPath, [join("scripts", "shots.ts"), slug], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, SPLITDEMO_CONFIG: join(ws, "config.json"), SPLITDEMO_WORKSPACE: ws },
  });
}

test.beforeAll(() => {
  ws = mkdtempSync(join(tmpdir(), "splitdemo-shots-"));
  writeFileSync(join(ws, "config.json"), JSON.stringify({ workspace: ws }));
  const demo = JSON.parse(readFileSync(join(ROOT, "examples", "intake-to-booking", "demo.json"), "utf8"));
  mkdirSync(join(ws, "demos", "fits"), { recursive: true });
  writeFileSync(join(ws, "demos", "fits", "demo.json"), JSON.stringify(demo));

  // The same demo with a fifth day: valid, and too narrow for its titles on a four-panel wall.
  const week = demo.panels.find((panel: { type: string }) => panel.type === "calendar");
  week.config.days.push({ id: "fri", label: "Fri" });
  week.config.events.push({ id: "ash", day: "fri", time: "09:00", title: "Shingle repair, Ash Rd" });
  mkdirSync(join(ws, "demos", "wide-week"), { recursive: true });
  writeFileSync(join(ws, "demos", "wide-week", "demo.json"), JSON.stringify(demo));
});

test.afterAll(() => rmSync(ws, { recursive: true, force: true }));

test("shots of a demo where everything fits end clean", () => {
  const run = shots("fits");
  expect(run.stdout).not.toContain("does not fit");
  expect(run.status).toBe(0);
  expect(existsSync(join(ws, "demos", "fits", "shots", "00-start.png"))).toBe(true);
});

test("shots say what does not fit, by panel, and fail", () => {
  const run = shots("wide-week");
  expect(run.stdout).toMatch(/does not fit {2}week, cut off (below|sideways): /);
  expect(run.status).toBe(1);
  // The pictures are still there to look at.
  expect(existsSync(join(ws, "demos", "wide-week", "shots", "00-start.png"))).toBe(true);
});
