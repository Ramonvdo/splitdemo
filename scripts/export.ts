/**
 * npm run export -- <slug>
 *
 * Writes the demo as one plain folder: a page, its files and its demo.json. Any static host takes it,
 * and it plays from any path. Prints the folder.
 */
import { dirname, join } from "node:path";
import { checkFile } from "./lib/load.ts";
import { buildSite, weigh } from "./lib/publish.ts";
import { BUILD_DIR } from "./lib/site.ts";
import { findDemo, listDemos } from "./lib/workspace.ts";

const slug = process.argv[2];
const ref = slug ? findDemo(slug) : undefined;
if (!ref) {
  console.log(`${slug ? `There is no demo "${slug}".` : "Usage: npm run export -- <slug>"} Demos: ${listDemos().map((d) => d.slug).join(", ") || "none"}`);
  process.exit(1);
}

const { demo, problems } = await checkFile(ref.file);
if (!demo) {
  console.log(`${ref.slug} cannot play, so there is nothing to export.`);
  for (const problem of problems) console.log(`  problem  ${problem}`);
  process.exit(1);
}

// An example's export stays out of the repo; your own demo's export sits next to its demo.json.
const out = ref.source === "example" ? join(BUILD_DIR, "export") : join(dirname(ref.file), "export");
await buildSite([{ folder: ref.slug, file: ref.file, demo }], out);
const folder = join(out, ref.slug);
const { files, bytes } = weigh(folder);
console.log(folder);
console.log(`${files} files, ${(bytes / 1e6).toFixed(1)} MB. Upload the folder as it is. It plays through a web server, not when opened from disk.`);
