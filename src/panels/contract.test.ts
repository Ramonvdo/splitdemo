import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { loadPresets, PANELS_DIR } from "../../scripts/lib/load.ts";
import { panelIndex } from "../../scripts/lib/panels.ts";
import { ICON_NAMES } from "./icon-names.ts";

const presets = await loadPresets();
const names = Object.keys(presets);

it.each(names)("%s has every file a panel is made of", (name) => {
  for (const file of ["schema.ts", "reduce.ts", "reduce.test.ts", "Panel.tsx", "panel.md", "example.json"]) expect(existsSync(join(presets[name].dir, file)), file).toBe(true);
});

it.each(names)("%s: its example is a config the panel takes and actions it can do", (name) => {
  const { config, action, logic, dir } = presets[name];
  const example = JSON.parse(readFileSync(join(dir, "example.json"), "utf8"));
  expect(Object.keys(example).sort()).toEqual(["actions", "config", "label"]);
  expect(example.actions.length).toBeGreaterThan(1);
  const cfg = config.parse(example.config);
  // Throws, and fails the test, on the first action the panel cannot do.
  example.actions.reduce((state: unknown, raw: unknown) => logic.reduce(state, action.parse(raw), cfg), logic.initial(cfg));
});

it.each(names)("%s: what the browser loads takes only types from its schema", (name) => {
  // schema.ts brings the validation library with it. The scripts need that; a demo on a phone does not.
  for (const file of ["reduce.ts", "Panel.tsx"]) {
    const source = readFileSync(join(presets[name].dir, file), "utf8");
    const imports = source.match(/^import (?!type )[^;]*from "\.\/schema\.ts";/gm) ?? [];
    expect(imports, file).toEqual([]);
  }
});

it.each(names)("%s names the icon that stands for it where there is no room for its label", (name) => {
  expect(ICON_NAMES).toContain(presets[name].logic.icon);
});

it("INDEX.md is what the panel folders say today (npm run panels writes it)", async () => {
  const onDisk = readFileSync(join(PANELS_DIR, "INDEX.md"), "utf8").replaceAll("\r\n", "\n");
  expect(onDisk).toBe(await panelIndex());
});
