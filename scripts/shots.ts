/**
 * npm run shots -- <slug> [--mode explainer|fast]
 *
 * Screenshots of a demo, so it can be judged the way a viewer meets it: by looking.
 * The story (explainer mode): the opening, each step's card, each screen as it is left, and the results slide.
 * The wall (fast mode): the start, one per beat, and the end. Both, unless --mode names one.
 * The wall is shot first, so a text that is cut on the wall is named with a picture of the wall.
 * Prints the files it wrote, then everything that does not fit where it is, on a laptop screen and on a phone.
 * Anything that does not fit fails it, and a state that does not fit on a phone gets a phone picture to look at.
 */
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { chromium } from "@playwright/test";
import { checkFile } from "./lib/load.ts";
import { stills, type Still } from "../src/engine/timeline.ts";
import type { Mode } from "../src/engine/types.ts";
import { BUILD_DIR, buildApp, serveDir, writeSite } from "./lib/site.ts";
import { READY, spills } from "./lib/spills.ts";
import { ROOT, findDemo, listDemos } from "./lib/workspace.ts";

const args = process.argv.slice(2);
const flag = args.indexOf("--mode");
const asked = flag < 0 ? undefined : args[flag + 1];
if (asked !== undefined && asked !== "explainer" && asked !== "fast") {
  console.log("Use --mode explainer or --mode fast, or leave it out for both.");
  process.exit(1);
}
const modes: Mode[] = asked ? [asked] : ["fast", "explainer"];

// The word after --mode is the mode, not the demo.
const slug = args.find((arg, i) => !arg.startsWith("--") && (flag < 0 || i !== flag + 1));
const ref = slug ? findDemo(slug) : undefined;
if (!ref) {
  console.log(`${slug ? `There is no demo "${slug}".` : "Usage: npm run shots -- <slug> [--mode explainer|fast]"} Demos: ${listDemos().map((d) => d.slug).join(", ") || "none"}`);
  process.exit(1);
}

const { demo, timeline, problems } = await checkFile(ref.file);
if (!demo || !timeline) {
  console.log(`${ref.slug}: cannot play, so there is nothing to shoot.`);
  for (const problem of problems) console.log(`  problem  ${problem}`);
  process.exit(1);
}

// An example's shots stay out of the repo; your own demo's shots sit next to its demo.json.
const out = ref.source === "example" ? join(ROOT, ".shots", ref.slug) : join(dirname(ref.file), "shots");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const site = join(BUILD_DIR, "shots", ref.slug);
writeSite(await buildApp(), [{ folder: ref.slug, file: ref.file }], site);
const server = await serveDir(site);
const browser = await chromium.launch();

// What does not fit, each with the first picture it shows in.
const tight = new Map<string, string>();

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
  // A card or the results slide lies over the wall. What is cut in a panel under it is not in that picture, and the line says so.
  const open = async (query: string, where: string, covered: boolean) => {
    await page.goto(`${server.url}/${ref.slug}/?record=1${query}`);
    // A part that loads on its own, like the chart, marks itself until it has arrived.
    await page.locator(READY).waitFor();
    await page.evaluate(() => document.fonts.ready);
    const found = await spills(page);
    for (const spill of found) if (!tight.has(spill)) tight.set(spill, covered && !/^(outside the panels|the page scrolls)/.test(spill) ? `${where}, on the wall behind it` : where);
    return found.length;
  };
  const pad = (n: number) => String(n).padStart(2, "0");
  // The wall keeps the names it always had. A story picture says its step, the changes made in it, and what is in view.
  const name = (still: Still, mode: Mode) => {
    if (mode === "fast") return still.at === "start" ? "00-start" : still.at === "end" ? `${pad(demo.beats.length + 1)}-end` : `${pad(still.at + 1)}-beat`;
    if (still.at === "start") return "explainer-00-start";
    if (still.at === "end") return `explainer-${pad(demo.beats.length + 1)}-results`;
    return `explainer-${pad(still.at + 1)}-${still.n}-${still.n === 0 ? "card" : still.on}`;
  };
  const states = modes.flatMap((mode) =>
    stills(timeline, mode).map((still) => ({
      name: name(still, mode),
      query: `&mode=${mode}&at=${still.at}${still.n === undefined ? "" : `&n=${still.n}`}`,
      covered: mode === "explainer" && (typeof still.at === "string" || still.n === 0),
    })),
  );
  for (const state of states) {
    await open(state.query, state.name, state.covered);
    const file = join(out, `${state.name}.png`);
    await page.screenshot({ path: file });
    console.log(file);
  }
  // The same states on a phone held upright. A picture only of a state where something does not fit.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const state of states) {
    if (!(await open(state.query, `${state.name}, on a phone: ${state.name}-phone.png`, state.covered))) continue;
    const file = join(out, `${state.name}-phone.png`);
    await page.screenshot({ path: file });
    console.log(file);
  }
} finally {
  await browser.close();
  await server.close();
  // The build held a copy of the demo. It goes, so a prospect's data never stays in the app's folder.
  rmSync(site, { recursive: true, force: true });
}

for (const [spill, where] of tight) console.log(`  does not fit  ${spill} (${where})`);
if (tight.size) {
  console.log(`${tight.size} ${tight.size === 1 ? "thing does" : "things do"} not fit. Shorten that text or show less in that panel, then shoot again.`);
  process.exit(1);
}
