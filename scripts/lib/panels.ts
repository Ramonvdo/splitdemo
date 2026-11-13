import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { loadPresets, type Preset } from "./load.ts";

const PICK = "Pick it when:";

/** The two lines of panel.md that route a demo author to a panel: what the viewer sees, and when to pick it. */
function route(preset: Preset): { sees: string; pick: string } {
  const file = join(preset.dir, "panel.md");
  if (!existsSync(file)) throw new Error(`${preset.name}: there is no panel.md`);
  const blocks = readFileSync(file, "utf8")
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.replace(/\s*\r?\n\s*/g, " ").trim());
  const sees = blocks.find((block) => block && !block.startsWith("#"));
  const pick = blocks.find((block) => block.startsWith(PICK));
  if (!sees || sees.startsWith(PICK)) throw new Error(`${preset.name}/panel.md: the first paragraph says what the viewer sees, and it is missing`);
  if (!pick) throw new Error(`${preset.name}/panel.md: there is no "${PICK}" paragraph`);
  return { sees, pick: pick.slice(PICK.length).trim() };
}

/** The action types a panel takes, in the order its schema lists them. */
function actions(preset: Preset): string[] {
  const json = z.toJSONSchema(preset.action) as { oneOf?: { properties: { type: { const: string } } }[]; anyOf?: { properties: { type: { const: string } } }[] };
  return (json.oneOf ?? json.anyOf ?? []).map((option) => option.properties.type.const);
}

/** src/panels/INDEX.md: the table a demo author reads before choosing panels. */
export async function panelIndex(): Promise<string> {
  const presets = Object.values(await loadPresets(true)).sort((a, b) => a.name.localeCompare(b.name));
  const rows = presets.map((preset) => {
    const { sees, pick } = route(preset);
    const pressable = preset.logic.triggers ?? [];
    const does = actions(preset).map((type) => `\`${type}\`${pressable.includes(type) ? " (pressable)" : ""}`);
    return `| \`${preset.name}\`${preset.logic.portrait ? " (tall)" : ""} | ${sees} | ${pick} | ${does.join(", ")} |`;
  });
  return [
    "# Panels",
    "",
    "Written by `npm run panels` from each panel's folder. To change a row, change that panel's `panel.md` or schema and run it again.",
    "",
    "| Panel | The viewer sees | Pick it when | Actions |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
    "- **tall**: drawn tall and narrow. It takes the full-height slot on the left, and a wall has one such slot.",
    '- **pressable**: a beat can `wait: "click"` on this action, so the viewer presses it themselves.',
    "",
    "For each panel you pick, read its folder: `panel.md` (what makes it land), `schema.ts` (the shape and its limits), `example.json` (a config and actions that work).",
    "",
  ].join("\n");
}
