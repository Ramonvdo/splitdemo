import { z } from "zod";
import { TONE_NAMES } from "../tones.ts";

const id = z.string().regex(/^[a-z][a-z0-9-]*$/, "use lowercase letters, digits and dashes, starting with a letter");
const tone = z.enum(TONE_NAMES);
/** The text of a row's cells, by column id. A column left out is an empty cell. */
const cells = z.record(id, z.string().max(28));

export const config = z
  .strictObject({
    /**
     * Left to right. Give the status column `tag: true` and its cells show as a pill in the row's tone.
     * Give the column with the longest text `wide: true` and it gets twice the room.
     */
    columns: z.array(z.strictObject({ id, title: z.string().min(1).max(16), tag: z.boolean().optional(), wide: z.boolean().optional() })).min(2).max(5),
    /** Rows already in the sheet when the demo starts. The sheet fits 7. */
    rows: z.array(z.strictObject({ id, cells, tone: tone.optional() })).max(6).optional(),
  })
  .superRefine((value, ctx) => {
    const columns = new Set<string>();
    value.columns.forEach((column, i) => {
      if (columns.has(column.id)) ctx.addIssue({ code: "custom", path: ["columns", i, "id"], message: `"${column.id}" is used twice` });
      columns.add(column.id);
    });
    const seen = new Set<string>();
    (value.rows ?? []).forEach((row, i) => {
      if (seen.has(row.id)) ctx.addIssue({ code: "custom", path: ["rows", i, "id"], message: `"${row.id}" is used twice` });
      seen.add(row.id);
      for (const key of Object.keys(row.cells)) if (!columns.has(key)) ctx.addIssue({ code: "custom", path: ["rows", i, "cells", key], message: `there is no column "${key}"` });
    });
  });

export const action = z.discriminatedUnion("type", [
  /** A new row lands under the last one. */
  z.strictObject({ type: z.literal("add"), id, cells, tone: tone.optional() }),
  /** Cells of a row change in place. Name only the cells that change. */
  z.strictObject({ type: z.literal("set"), row: id, cells: cells.optional(), tone: tone.optional() }),
  /** One column gets the same text in every row, like a fill down: a whole list turns "Sent" at once. */
  z.strictObject({ type: z.literal("fill"), column: id, value: z.string().max(28), tone: tone.optional() }),
]);

export type Config = z.infer<typeof config>;
export type Action = z.infer<typeof action>;
