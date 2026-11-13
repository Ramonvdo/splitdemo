/**
 * npm run check -- <slug> [<slug> ...]     checks those demos
 * npm run check                            checks every demo (the examples, and the ones in your workspace)
 *
 * Says whether a demo can play, and where in demo.json it goes wrong. Exits 1 when any demo cannot play.
 */
import { compile, duration } from "../src/engine/timeline.ts";
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
  const { demo, problems, notes } = await checkFile(ref.file);
  if (demo) {
    const seconds = Math.round(duration(compile(demo)) / 1000);
    console.log(`${ref.slug}: plays. ${demo.panels.length} panels, ${demo.beats.length} beats, about ${seconds} s.`);
  } else {
    failed = true;
    console.log(`${ref.slug}: cannot play (${ref.file})`);
  }
  for (const problem of problems) console.log(`  problem  ${problem}`);
  for (const note of notes) console.log(`  note     ${note}`);
}

process.exitCode = failed ? 1 : 0;
