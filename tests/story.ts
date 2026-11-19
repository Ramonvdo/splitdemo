import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { ROOT } from "../scripts/lib/workspace.ts";

/**
 * The story the player's tests play: a patient texts a dentist after closing time. It has what the player has to handle:
 * a message the viewer sends, an automation that runs a step a beat, four screens, a chart, and a calculator with a cost.
 * It is no example. The examples change with what sells; this one stays, so a test fails when the player changes.
 */
export const STORY_FILE = join(ROOT, "tests", "fixtures", "dental-story.json");
export const STORY = "/dental-story/";

const raw = readFileSync(STORY_FILE, "utf8");

// The tests reach as deep into the demo as its author would, so it stays the loose thing parsed JSON is.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;

/** Serves the story at its own address, the way the dev server serves a demo. `change` is what a test wants different; the last one asked for wins. */
export async function story(page: Page, change?: (demo: Loose) => void) {
  await page.route("**/dental-story/demo.json", (route) => {
    const demo = JSON.parse(raw);
    change?.(demo);
    return route.fulfill({ json: demo });
  });
}
