/**
 * npm run shots -- <slug>
 *
 * One screenshot of the start, one per beat, and one of the end, so a demo can be judged
 * the way a viewer meets it: by looking. Prints the files it wrote, then everything that does
 * not fit where it is, on a laptop screen and on a phone. Anything that does not fit fails it.
 */
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { chromium } from "@playwright/test";
import { checkFile } from "./lib/load.ts";
import { BUILD_DIR, buildApp, serveDir, writeSite } from "./lib/site.ts";
import { READY, spills } from "./lib/spills.ts";
import { ROOT, findDemo, listDemos } from "./lib/workspace.ts";

const slug = process.argv[2];
const ref = slug ? findDemo(slug) : undefined;
if (!ref) {
  console.log(`${slug ? `There is no demo "${slug}".` : "Usage: npm run shots -- <slug>"} Demos: ${listDemos().map((d) => d.slug).join(", ") || "none"}`);
  process.exit(1);
}

const { demo, problems } = await checkFile(ref.file);
if (!demo) {
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
  const open = async (query: string, where: string) => {
    await page.goto(`${server.url}/${ref.slug}/?record=1${query}`);
    // A part that loads on its own, like the chart, marks itself until it has arrived.
    await page.locator(READY).waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (const spill of await spills(page)) if (!tight.has(spill)) tight.set(spill, where);
  };
  const pad = (n: number) => String(n).padStart(2, "0");
  const states = ["", ...demo.beats.map((_, beat) => `&at=${beat}`), "&at=end"];
  const names = ["00-start", ...demo.beats.map((_, beat) => `${pad(beat + 1)}-beat`), `${pad(demo.beats.length + 1)}-end`];
  for (const [i, query] of states.entries()) {
    await open(query, names[i]);
    const file = join(out, `${names[i]}.png`);
    await page.screenshot({ path: file });
    console.log(file);
  }
  // The same states on a phone held upright. No pictures: only whether everything fits.
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [i, query] of states.entries()) await open(query, `${names[i]}, on a phone`);
} finally {
  await browser.close();
  await server.close();
}

for (const [spill, where] of tight) console.log(`  does not fit  ${spill} (${where})`);
if (tight.size) {
  console.log(`${tight.size} ${tight.size === 1 ? "thing does" : "things do"} not fit. Shorten the text or show less in that panel, then shoot again.`);
  process.exit(1);
}
