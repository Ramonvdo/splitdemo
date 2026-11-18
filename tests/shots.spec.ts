import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { spills } from "../scripts/lib/spills.ts";
import { ROOT } from "../scripts/lib/workspace.ts";

test.describe.configure({ mode: "serial", timeout: 180_000 });

let ws: string;

/** The wall, unless a test asks for the story or for both: both together take three times as long. */
function shots(slug: string, mode: string | undefined = "fast") {
  return spawnSync(process.execPath, [join("scripts", "shots.ts"), slug, ...(mode ? ["--mode", mode] : [])], {
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

  // Every label as long as the format allows: 40 characters.
  const long = JSON.parse(readFileSync(join(ROOT, "examples", "intake-to-booking", "demo.json"), "utf8"));
  for (const panel of long.panels) panel.label = "Quote requests in your Google Sheets tab";
  mkdirSync(join(ws, "demos", "long-labels"), { recursive: true });
  writeFileSync(join(ws, "demos", "long-labels", "demo.json"), JSON.stringify(long));

  // A company name the schema allows (28 characters at most) and a narrow column cannot show whole.
  const cells = JSON.parse(readFileSync(join(ROOT, "examples", "cold-outreach", "demo.json"), "utf8"));
  cells.panels.find((panel: { type: string }) => panel.type === "sheet").config.rows[0].cells.company = "Kestrel Family Law Partners";
  mkdirSync(join(ws, "demos", "long-cells"), { recursive: true });
  writeFileSync(join(ws, "demos", "long-cells", "demo.json"), JSON.stringify(cells));
});

test.afterAll(() => rmSync(ws, { recursive: true, force: true }));

test("shots of a demo where everything fits end clean", () => {
  const run = shots("fits");
  expect(run.stdout).not.toContain("does not fit");
  expect(run.status).toBe(0);
  expect(existsSync(join(ws, "demos", "fits", "shots", "00-start.png"))).toBe(true);
});

test("shots of the story are every card, every screen as it is left, and the slide at the end", () => {
  const run = shots("fits", "explainer");
  expect(run.stdout).not.toContain("does not fit");
  expect(run.status, run.stdout + run.stderr).toBe(0);
  // Read off examples/intake-to-booking/demo.json: beat, changes made in it, and the card or the screen in view.
  expect(readdirSync(join(ws, "demos", "fits", "shots")).sort()).toEqual([
    "explainer-00-start.png",
    ...["explainer-01-0-card.png", "explainer-01-4-form.png"],
    ...["explainer-02-0-card.png", "explainer-02-1-form.png", "explainer-02-2-flow.png"],
    ...["explainer-03-0-card.png", "explainer-03-1-flow.png"],
    ...["explainer-04-0-card.png", "explainer-04-1-flow.png"],
    ...["explainer-05-0-card.png", "explainer-05-1-flow.png", "explainer-05-2-week.png"],
    ...["explainer-06-0-card.png", "explainer-06-1-flow.png", "explainer-06-3-mail.png"],
    ...["explainer-07-0-card.png", "explainer-07-1-flow.png"],
    "explainer-08-results.png",
  ]);
});

test("asked for no mode, shots still know which demo was named", () => {
  const run = spawnSync(process.execPath, [join("scripts", "shots.ts"), "nowhere"], { cwd: ROOT, encoding: "utf8", env: { ...process.env, SPLITDEMO_CONFIG: join(ws, "config.json"), SPLITDEMO_WORKSPACE: ws } });
  expect(run.stdout).toContain('There is no demo "nowhere".');
  expect(run.status).toBe(1);
});

test("asked for a mode there is none of, shots say which there are", () => {
  const run = shots("fits", "slow");
  expect(run.stdout).toContain("--mode explainer or --mode fast");
  expect(run.status).toBe(1);
});

test("a label of the full 40 characters fits, on a laptop and on a phone", () => {
  const run = shots("long-labels");
  expect(run.stdout).not.toContain("does not fit");
  expect(run.status).toBe(0);
});

test("a text that ends in three dots does not fit either", () => {
  const run = shots("long-cells");
  expect(run.stdout).toContain("does not fit  leads, cut short: Kestrel Family Law Partners");
  expect(run.status).toBe(1);
});

test("shots say what does not fit, by panel, and fail", () => {
  const run = shots("wide-week");
  expect(run.stdout).toMatch(/does not fit {2}week, cut off (below|sideways): /);
  expect(run.status).toBe(1);
  // The pictures are still there to look at.
  expect(existsSync(join(ws, "demos", "wide-week", "shots", "00-start.png"))).toBe(true);
});

test("shots leave no copy of the demo in the app's folder", () => {
  shots("fits");
  expect(existsSync(join(ROOT, ".build", "shots", "fits"))).toBe(false);
});

test("a page that scrolls says what reaches past the edge", async ({ page }) => {
  await page.setContent('<main class="stage"><section data-panel="week"><p style="width: 3000px">Roof replacement</p></section></main>');
  expect(await spills(page)).toEqual(["the page scrolls, first past the edge: week: Roof replacement"]);
});
