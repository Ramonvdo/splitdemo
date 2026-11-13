import { z } from "zod";
import { TONE_NAMES } from "../tones.ts";

const id = z.string().regex(/^[a-z][a-z0-9-]*$/, "use lowercase letters, digits and dashes, starting with a letter");

const value = z.string().min(1).max(10);
/** The change next to a number, e.g. "+18%" or "was 4 h". */
const delta = z.string().min(1).max(12);
const point = z.strictObject({
  /** Under the bar, e.g. "Mon" or "W32". */
  label: z.string().min(1).max(6),
  value: z.number().min(0),
});

export const config = z
  .strictObject({
    /** The numbers the owner watches. 1 to 4. */
    tiles: z
      .array(z.strictObject({ id, label: z.string().min(1).max(24), value, delta: delta.optional(), tone: z.enum(TONE_NAMES).optional() }))
      .min(1)
      .max(4),
    /** One bar chart under the tiles. */
    chart: z.strictObject({ title: z.string().min(1).max(32), points: z.array(point).min(2).max(12) }).optional(),
  })
  .superRefine((cfg, ctx) => {
    const seen = new Set<string>();
    cfg.tiles.forEach((tile, i) => {
      if (seen.has(tile.id)) ctx.addIssue({ code: "custom", path: ["tiles", i, "id"], message: `"${tile.id}" is used twice` });
      seen.add(tile.id);
    });
  });

export const action = z.discriminatedUnion("type", [
  /** A tile's number changes. */
  z.strictObject({ type: z.literal("set"), tile: id, value, delta: delta.optional(), tone: z.enum(TONE_NAMES).optional() }),
  /** A bar changes height, or a new bar joins on the right when the label is new. */
  z.strictObject({ type: z.literal("push"), ...point.shape }),
]);

export type Config = z.infer<typeof config>;
export type Action = z.infer<typeof action>;
export type Point = z.infer<typeof point>;
