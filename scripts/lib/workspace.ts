import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** The app's own folder (the repo clone). */
export const ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** A demo's folder name, which is also its place in a URL. */
export const SLUG = /^[a-z0-9][a-z0-9-]*$/;

/** What onboarding writes to ~/.splitdemo/config.json. */
export interface Settings {
  /** Where your own demos live, outside the app's folder: <workspace>/demos/<slug>/demo.json */
  workspace?: string;
  hosting?: { provider: "cloudflare" | "none"; project?: string; domain?: string };
  brand?: { name?: string; accent?: string };
  /** `ask` shows what a share will publish and waits. `auto` publishes. */
  share?: "ask" | "auto";
  /** Days until a new demo stops being shared. */
  expiryDays?: number;
}

export const SETTINGS_FILE = process.env.SPLITDEMO_CONFIG ?? join(homedir(), ".splitdemo", "config.json");

export function settings(): Settings {
  if (!existsSync(SETTINGS_FILE)) return {};
  return JSON.parse(readFileSync(SETTINGS_FILE, "utf8")) as Settings;
}

export function workspace(): string | undefined {
  return process.env.SPLITDEMO_WORKSPACE ?? settings().workspace;
}

export interface DemoRef {
  slug: string;
  file: string;
  source: "example" | "workspace";
}

function scan(dir: string, source: DemoRef["source"]): DemoRef[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && SLUG.test(entry.name))
    .map((entry) => ({ slug: entry.name, file: join(dir, entry.name, "demo.json"), source }))
    .filter((ref) => existsSync(ref.file));
}

/** The examples in the app, then your own demos. On a name clash, yours wins. */
export function listDemos(): DemoRef[] {
  const ws = workspace();
  const mine = ws ? scan(join(ws, "demos"), "workspace") : [];
  const taken = new Set(mine.map((ref) => ref.slug));
  const examples = scan(join(ROOT, "examples"), "example").filter((ref) => !taken.has(ref.slug));
  return [...examples, ...mine].sort((a, b) => a.slug.localeCompare(b.slug));
}

export function findDemo(slug: string): DemoRef | undefined {
  return listDemos().find((ref) => ref.slug === slug);
}
