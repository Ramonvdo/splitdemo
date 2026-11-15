/**
 * npm run record -- <slug> [--portrait] [--gif]
 *
 * Plays the demo by itself and films it: an mp4 at 1920x1080, or with --portrait at 1080x1920 in the
 * phone layout. With --gif also a small gif, for a README or an email. Needs ffmpeg. Prints the files.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { chromium } from "@playwright/test";
import { compile, duration } from "../src/engine/timeline.ts";
import { checkFile } from "./lib/load.ts";
import { BUILD_DIR, buildApp, serveDir, writeSite } from "./lib/site.ts";
import { findDemo, listDemos } from "./lib/workspace.ts";

/** The same 1200 ms the stage holds its opening picture for a recording (TITLE_CARD_MS in Stage.tsx). */
const TITLE_CARD_S = 1.2;
/** How long the outcome stays on screen before the film ends. */
const HOLD_MS = 3000;
/** A gif over this is too heavy for a README or an email, so it is made smaller until it fits. */
const GIF_MAX_BYTES = 8e6;
const GIF_STEPS = [
  { width: 960, fps: 12 },
  { width: 800, fps: 10 },
  { width: 640, fps: 10 },
  { width: 640, fps: 6 },
];

function stop(message: string): never {
  console.log(message);
  process.exit(1);
}

const args = process.argv.slice(2);
const slug = args.find((arg) => !arg.startsWith("--"));
const portrait = args.includes("--portrait");
const gif = args.includes("--gif");

const ref = slug ? findDemo(slug) : undefined;
if (!ref) stop(`${slug ? `There is no demo "${slug}".` : "Usage: npm run record -- <slug> [--portrait] [--gif]"} Demos: ${listDemos().map((d) => d.slug).join(", ") || "none"}`);

const { demo, problems } = await checkFile(ref.file);
if (!demo) stop(`${ref.slug} cannot play, so there is nothing to film.\n${problems.map((p) => `  problem  ${p}`).join("\n")}`);

const tool = (name: string, list: string[]) => spawnSync(name, list, { encoding: "utf8" });
if (tool("ffmpeg", ["-version"]).status !== 0) {
  stop("Filming needs ffmpeg, and it is not on this computer's path. Install it (Windows: winget install Gyan.FFmpeg, Mac: brew install ffmpeg), open a new terminal and run this again.");
}

// A film is 1920x1080. Upright it is the phone layout, 540x960, drawn at twice the size so it fills 1080x1920.
// The recorder films the browser's own pixels and ignores a page's scale, so there the whole browser runs at 2x.
const frame = portrait ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };

const work = join(BUILD_DIR, "record", `${ref.slug}-${process.pid}`);
process.once("exit", () => rmSync(work, { recursive: true, force: true }));
writeSite(await buildApp(), [{ folder: ref.slug, file: ref.file }], join(work, "site"));
const server = await serveDir(join(work, "site"));
const browser = await chromium.launch(portrait ? { args: ["--force-device-scale-factor=2", "--window-size=540,960"] } : {});

let raw: string;
let length: number;
try {
  const context = await browser.newContext({ viewport: portrait ? null : frame, recordVideo: { dir: join(work, "raw"), size: frame } });
  // A film shows only what is in the demo's own folder.
  await context.route("**/*", (route) => (new URL(route.request().url()).hostname === "127.0.0.1" ? route.continue() : route.abort()));
  const page = await context.newPage();
  await page.goto(`${server.url}/${ref.slug}/?autoplay=1&record=1`);
  await page.locator('main.stage[data-status="playing"]').waitFor({ timeout: 30_000 });
  const playing = Date.now();
  // Every press the demo waits for is made for it after 1.2 s; the rest is the timeline itself.
  const longest = duration(compile(demo)) + demo.beats.length * 1500 + 30_000;
  await page.locator("main.stage[data-done]").waitFor({ timeout: longest });
  await page.waitForTimeout(HOLD_MS);
  const ended = Date.now();
  const video = page.video();
  await context.close();
  if (!video) throw new Error("the browser made no film");
  raw = await video.path();
  length = (ended - playing) / 1000 + TITLE_CARD_S;
} finally {
  await browser.close();
  await server.close();
}

// An example's film stays out of the repo; your own demo's film sits next to its demo.json.
const out = ref.source === "example" ? join(BUILD_DIR, "video") : dirname(ref.file);
mkdirSync(out, { recursive: true });
const name = `${ref.slug}${portrait ? "-portrait" : ""}`;
const mp4 = join(out, `${name}.mp4`);

const run = (list: string[]) => {
  const done = tool("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...list]);
  if (done.status !== 0) stop(`ffmpeg could not write the film.\n${done.stderr}`);
};

// The raw film starts at the page's first paint, whenever that was, and ends when the browser closed.
// So the part to keep is measured back from its end: the title card, the story and the hold.
const whole = Number(tool("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", raw]).stdout);
if (!(whole > 0)) stop("ffprobe could not read the raw film, so it cannot be cut. It comes with ffmpeg: check that both are on the path.");
const lead = Math.max(whole - length, 0);

// yuv420p and faststart: it plays in every browser, chat and mail app, and starts before it has fully loaded.
run(["-ss", lead.toFixed(2), "-i", raw, "-t", length.toFixed(2), "-an", "-r", "30", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4]);
const size = (file: string) => `${(statSync(file).size / 1e6).toFixed(1)} MB`;
console.log(mp4);
console.log(`${frame.width}x${frame.height}, ${Math.round(length)} s, ${size(mp4)}.`);

if (gif) {
  const file = join(out, `${name}.gif`);
  for (const [i, step] of GIF_STEPS.entries()) {
    // Upright, the same steps count for the long side.
    const scale = portrait ? `scale=-2:${step.width}` : `scale=${step.width}:-2`;
    run(["-i", mp4, "-vf", `fps=${step.fps},${scale}:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`, file]);
    if (statSync(file).size <= GIF_MAX_BYTES || i === GIF_STEPS.length - 1) break;
  }
  console.log(file);
  console.log(`${size(file)}${statSync(file).size > GIF_MAX_BYTES ? ". Still heavy: a shorter demo makes a lighter gif." : "."}`);
}
