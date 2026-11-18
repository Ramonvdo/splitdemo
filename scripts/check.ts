/**
 * npm run check -- <slug> [<slug> ...]     checks those demos
 * npm run check                            checks every demo (the examples, and the ones in your workspace)
 *
 * Says whether a demo can play, and where in demo.json it goes wrong. Exits 1 when any demo cannot play.
 */
import { duration } from "../src/engine/timeline.ts";
import { checkFile } from "./lib/load.ts";
import { findDemo, listDemos, type DemoRef } from "./lib/workspace.ts";

const asked = process.argv.slice(2);
const refs: DemoRef[] = [];
let failed = false;

for (const slug of asked) {
  const ref = findDemo(slug);
  if (ref) refs.push(ref);
  else {
    failed = true;
    console.log(`${slug}: there is no demo with this name. Demos: ${listDemos().map((d) => d.slug).join(", ") || "none"}`);
  }
}
if (!asked.length) refs.push(...listDemos());
if (!refs.length && !failed) console.log("No demos to check.");

for (const ref of refs) {
  const { demo, timeline, problems, notes } = await checkFile(ref.file);
  if (demo && timeline) {
    const seconds = (mode: "explainer" | "fast") => Math.round(duration(timeline, mode) / 1000);
    console.log(`${ref.slug}: plays. ${demo.panels.length} panels, ${demo.beats.length} beats. Explainer about ${seconds("explainer")} s, fast about ${seconds("fast")} s.`);
  } else {
    failed = true;
    console.log(`${ref.slug}: cannot play (${ref.file})`);
  }
  for (const problem of problems) console.log(`  problem  ${problem}`);
  for (const note of notes) console.log(`  note     ${note}`);
}

process.exitCode = failed ? 1 : 0;
