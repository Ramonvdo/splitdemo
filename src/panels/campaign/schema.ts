import { z } from "zod";
import { TONE_NAMES } from "../tones.ts";

const id = z.string().regex(/^[a-z][a-z0-9-]*$/, "use lowercase letters, digits and dashes, starting with a letter");
const tone = z.enum(TONE_NAMES);
/** Where the campaign stands, in a word or two: "Draft", "Sending", "Live". */
const status = z.string().min(1).max(14);
const value = z.string().min(1).max(8);

export const config = z
  .strictObject({
    /** The campaign's name, e.g. "Dentists in Austin". */
    name: z.string().min(1).max(32),
    /** The status when the demo starts, and its colour. */
    status: z.strictObject({ text: status, tone: tone.optional() }).optional(),
    /** The emails of the sequence, in the order they go out. `when` is the day, e.g. "Day 1". */
    steps: z.array(z.strictObject({ id, title: z.string().min(1).max(36), when: z.string().min(1).max(12).optional() })).min(1).max(3),
    /** The counters under the sequence, e.g. Sent, Opened, Replied. */
    stats: z.array(z.strictObject({ id, label: z.string().min(1).max(14), value })).min(1).max(4),
  })
  .superRefine((cfg, ctx) => {
    for (const key of ["steps", "stats"] as const) {
      const seen = new Set<string>();
      cfg[key].forEach((item, i) => {
        if (seen.has(item.id)) ctx.addIssue({ code: "custom", path: [key, i, "id"], message: `"${item.id}" is used twice` });
        seen.add(item.id);
      });
    }
  });

export const action = z.discriminatedUnion("type", [
  /** The campaign's status changes, e.g. from "Draft" to "Sending". */
  z.strictObject({ type: z.literal("status"), text: status, tone: tone.optional() }),
  /** An email of the sequence goes out. `note` says how it went, e.g. "212 sent". */
  z.strictObject({ type: z.literal("send"), step: id, note: z.string().min(1).max(20).optional() }),
  /** A counter changes. */
  z.strictObject({ type: z.literal("stat"), stat: id, value, tone: tone.optional() }),
]);

export type Config = z.infer<typeof config>;
export type Action = z.infer<typeof action>;
