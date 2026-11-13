import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { ZodType } from "zod";
import * as schema from "../../src/engine/schema.ts";
import { compile, snapshots } from "../../src/engine/timeline.ts";
import type { Demo } from "../../src/engine/types.ts";
import type { PanelLogic } from "../../src/panels/types.ts";
import { ROOT } from "./workspace.ts";

export const PANELS_DIR = join(ROOT, "src", "panels");

export interface Preset {
  name: string;
  dir: string;
  config: ZodType;
  action: ZodType;
  logic: PanelLogic;
}

let cache: Promise<Record<string, Preset>> | undefined;

/** Every preset in src/panels, with its schemas and its logic. No React is loaded. */
export function loadPresets(): Promise<Record<string, Preset>> {
  cache ??= (async () => {
    const out: Record<string, Preset> = {};
    for (const entry of readdirSync(PANELS_DIR, { withFileTypes: true })) {
      const dir = join(PANELS_DIR, entry.name);
      if (!entry.isDirectory() || !existsSync(join(dir, "schema.ts"))) continue;
      const s = await import(pathToFileURL(join(dir, "schema.ts")).href);
      const r = await import(pathToFileURL(join(dir, "reduce.ts")).href);
      out[entry.name] = { name: entry.name, dir, config: s.config, action: s.action, logic: r.logic };
    }
    return out;
  })();
  return cache;
}

/** A zod path as it reads in demo.json: beats[2].do[0].text */
function at(base: string, path: PropertyKey[]): string {
  return path.reduce<string>((out, key) => (typeof key === "number" ? `${out}[${key}]` : out ? `${out}.${String(key)}` : String(key)), base);
}

function issues(base: string, result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }): string[] {
  return result.success ? [] : result.error!.issues.map((issue) => `${at(base, issue.path)}: ${issue.message}`);
}

export interface Checked {
  demo?: Demo;
  /** The demo cannot play, or will mislead. Each line starts with its place in demo.json. */
  problems: string[];
  /** It plays, but a viewer will get less from it. */
  notes: string[];
}

/** Everything that can be known about a demo without opening a browser. */
export async function checkDemo(raw: unknown): Promise<Checked> {
  const shape = schema.demo.safeParse(raw);
  if (!shape.success) return { problems: issues("", shape), notes: [] };
  const demo = shape.data as Demo;
  const presets = await loadPresets();
  const problems: string[] = [];
  const notes: string[] = [];

  const byId = new Map<string, Preset | undefined>();
  demo.panels.forEach((spec, i) => {
    if (byId.has(spec.id)) problems.push(`panels[${i}].id: "${spec.id}" is used twice`);
    const preset = presets[spec.type];
    byId.set(spec.id, preset);
    if (!preset) {
      problems.push(`panels[${i}].type: there is no panel "${spec.type}". Choose from: ${Object.keys(presets).join(", ")}`);
      return;
    }
    problems.push(...issues(`panels[${i}].config`, preset.config.safeParse(spec.config)));
  });

  demo.beats.forEach((beat, b) => {
    beat.do.forEach((action, i) => {
      const where = `beats[${b}].do[${i}]`;
      if (!byId.has(action.on)) return problems.push(`${where}.on: there is no panel "${action.on}"`);
      const preset = byId.get(action.on);
      if (!preset) return;
      const { on: _on, after: _after, ...payload } = action;
      problems.push(...issues(where, preset.action.safeParse(payload)));
    });
    if (beat.wait) {
      const first = beat.do[0];
      const triggers = (first && byId.get(first.on)?.logic.triggers) ?? [];
      if (!first) problems.push(`beats[${b}].wait: a beat that waits needs an action for the viewer to press`);
      else if (!triggers.includes(first.type))
        problems.push(`beats[${b}].wait: the viewer cannot press "${first.type}" on "${first.on}". Pressable here: ${triggers.join(", ") || "nothing"}`);
    }
    if (!beat.say) notes.push(`beats[${b}]: no caption. The viewer sees things move without being told what it means for them.`);
  });

  if (demo.layout) {
    const want = { rail: 4, quad: 4, trio: 3, duo: 2 }[demo.layout];
    if (want !== demo.panels.length) problems.push(`layout: "${demo.layout}" takes ${want} panels and this demo has ${demo.panels.length}`);
  }

  if (problems.length) return { problems, notes };

  try {
    snapshots(demo, (type) => presets[type]?.logic, compile(demo));
  } catch (e) {
    return { problems: [e instanceof Error ? e.message : String(e)], notes };
  }

  for (const spec of demo.panels)
    if (!demo.beats.some((beat) => beat.do.some((action) => action.on === spec.id)))
      notes.push(`panels: "${spec.id}" never changes. A screen that stays still looks broken.`);
  if (!demo.outcome.some((o) => o.was)) notes.push("outcome: no `was`. A result means more next to what it was before.");
  if (demo.expires && demo.expires < new Date().toISOString().slice(0, 10)) notes.push(`expires: ${demo.expires} has passed, so a share leaves this demo out.`);

  return { demo, problems, notes };
}

/** Reads and checks a demo.json file. */
export async function checkFile(file: string): Promise<Checked> {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    return { problems: [`demo.json is not valid JSON: ${e instanceof Error ? e.message : String(e)}`], notes: [] };
  }
  return checkDemo(raw);
}
