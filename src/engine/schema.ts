import { z } from "zod";

/**
 * The shape of demo.json, for the check script. Not imported by the app, so zod stays out of the bundle.
 * A panel's `config` and an action's payload are checked against that panel's own schema.
 */

/** A caption is read in passing. Longer than this and it is a paragraph. */
export const CAPTION_MAX = 72;

const id = z.string().regex(/^[a-z][a-z0-9-]*$/, "use lowercase letters, digits and dashes, starting with a letter");

export const action = z.looseObject({
  on: id,
  type: z.string().min(1),
  after: z.number().int().min(0).max(10_000).optional(),
});

export const beat = z.strictObject({
  say: z.string().min(1).max(CAPTION_MAX).optional(),
  clock: z.string().min(1).max(8).optional(),
  do: z.array(action).max(6),
  wait: z.literal("click").optional(),
  hold: z.number().int().min(0).max(15_000).optional(),
});

export const panelSpec = z.strictObject({
  id,
  type: z.string().min(1),
  label: z.string().min(1).max(40),
  config: z.unknown(),
});

export const outcome = z.strictObject({
  value: z.string().min(1).max(12),
  label: z.string().min(1).max(32),
  was: z.string().min(1).max(12).optional(),
});

export const demo = z.strictObject({
  v: z.literal(1),
  title: z.string().min(1).max(60),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i, "use a colour like #ff5c35").optional(),
  layout: z.enum(["rail", "quad", "trio", "duo"]).optional(),
  panels: z.array(panelSpec).min(2).max(4),
  beats: z.array(beat).min(1).max(16),
  outcome: z.array(outcome).min(1).max(3),
  expires: z.iso.date().optional(),
});
