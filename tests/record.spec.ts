import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { checkFile } from "../scripts/lib/load.ts";
import { ROOT } from "../scripts/lib/workspace.ts";
import { duration } from "../src/engine/timeline.ts";
import type { Demo, Mode, Timeline } from "../src/engine/types.ts";

// A film takes as long as the demo does, and two at once would fight over the processor.
test.describe.configure({ mode: "serial", timeout: 420_000 });
test.skip(spawnSync("ffmpeg", ["-version"]).status !== 0, "filming needs ffmpeg");

let ws: string;
let demo: Demo;
let timeline: Timeline;

function record(args: string[]) {
  return spawnSync(process.execPath, [join("scripts", "record.ts"), ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, SPLITDEMO_CONFIG: join(ws, "config.json"), SPLITDEMO_WORKSPACE: ws },
  });
}

function probe(file: string): { width: number; height: number; seconds: number } {
  // A gif says its length per stream too, and its size the same way.
  const out = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", file], { encoding: "utf8" });
  const info = JSON.parse(out.stdout);
  return { width: info.streams[0].width, height: info.streams[0].height, seconds: Number(info.format.duration) };
}

/** The title card (1.2 s), the story, each press made for the viewer (1.2 s), and the end held: the results slide 5 s, the wall 3 s. */
function expected(mode: Mode): number {
  const presses = demo.beats.filter((beat) => beat.wait === "click").length;
  return 1.2 + duration(timeline, mode) / 1000 + presses * 1.2 + (mode === "explainer" ? 5 : 3);
}

test.beforeAll(async () => {
  ws = mkdtempSync(join(tmpdir(), "splitdemo-record-"));
  writeFileSync(join(ws, "config.json"), JSON.stringify({ workspace: ws }));
  const example = join(ROOT, "examples", "speed-to-lead", "demo.json");
  demo = JSON.parse(readFileSync(example, "utf8"));
  // The story's pace asks each panel how long its changes take to read, so the checked timeline is the one to measure against.
  timeline = (await checkFile(example)).timeline!;
  mkdirSync(join(ws, "demos", "acme-dental"), { recursive: true });
  writeFileSync(join(ws, "demos", "acme-dental", "demo.json"), JSON.stringify(demo));
});

test.afterAll(() => rmSync(ws, { recursive: true, force: true }));

test("a film is the story at 1920x1080, as long as the story, and lands next to its demo.json; its gif is the wall, and light", () => {
  const run = record(["acme-dental", "--gif"]);
  expect(run.status, run.stdout + run.stderr).toBe(0);
  const mp4 = join(ws, "demos", "acme-dental", "acme-dental.mp4");
  expect(run.stdout).toContain(mp4);

  const film = probe(mp4);
  expect([film.width, film.height]).toEqual([1920, 1080]);
  expect(Math.abs(film.seconds - expected("explainer"))).toBeLessThan(2);

  // The gif is for a README or a mail: the wall, which is over in half the time.
  const gif = join(ws, "demos", "acme-dental", "acme-dental.gif");
  expect(existsSync(gif)).toBe(true);
  expect(statSync(gif).size).toBeLessThan(8e6);
  expect(Math.abs(probe(gif).seconds - expected("fast"))).toBeLessThan(2);
  // The wall was filmed for the gif only.
  expect(existsSync(join(ws, "demos", "acme-dental", "acme-dental-fast.mp4"))).toBe(false);
});

test("asked for the wall, an upright film is the phone layout at 1080x1920 under a name of its own", () => {
  const run = record(["acme-dental", "--portrait", "--fast"]);
  expect(run.status, run.stdout + run.stderr).toBe(0);
  const film = probe(join(ws, "demos", "acme-dental", "acme-dental-fast-portrait.mp4"));
  expect([film.width, film.height]).toEqual([1080, 1920]);
  expect(Math.abs(film.seconds - expected("fast"))).toBeLessThan(2);
});
