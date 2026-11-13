/**
 * npm run shots -- <slug>
 *
 * One screenshot of the start, one per beat, and one of the end, so a demo can be judged
 * the way a viewer meets it: by looking. Prints the files it wrote.
 */
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { chromium } from "@playwright/test";
import { checkFile } from "./lib/load.ts";
import { BUILD_DIR, buildApp, serveDir, writeSite } from "./lib/site.ts";
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

const site = join(BUILD_DIR, "shots");
writeSite(await buildApp(), [{ folder: ref.slug, file: ref.file }], site);
const server = await serveDir(site);
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
  const shoot = async (query: string, name: string) => {
    await page.goto(`${server.url}/${ref.slug}/?record=1${query}`);
    await page.locator("main.stage").waitFor();
    await page.evaluate(() => document.fonts.ready);
    const file = join(out, name);
    await page.screenshot({ path: file });
    console.log(file);
  };
  const pad = (n: number) => String(n).padStart(2, "0");
  await shoot("", "00-start.png");
  for (let beat = 0; beat < demo.beats.length; beat++) await shoot(`&at=${beat}`, `${pad(beat + 1)}-beat.png`);
  await shoot("&at=end", `${pad(demo.beats.length + 1)}-end.png`);
} finally {
  await browser.close();
  await server.close();
}
