/**
 * npm run panels      writes src/panels/INDEX.md from every panel's panel.md, schema and logic
 *
 * Run it after adding a panel or changing what one shows or does. The test suite fails while the file is behind.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { PANELS_DIR } from "./lib/load.ts";
import { panelIndex } from "./lib/panels.ts";

const file = join(PANELS_DIR, "INDEX.md");
const text = await panelIndex();
writeFileSync(file, text);
console.log(`Wrote ${file} (${text.split("\n").filter((line) => line.startsWith("| `")).length} panels).`);
