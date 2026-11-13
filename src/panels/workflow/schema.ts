import { z } from "zod";
import { ICON_NAMES } from "../icon-names.ts";
import { place } from "./place.ts";

const id = z.string().regex(/^[a-z][a-z0-9-]*$/, "use lowercase letters, digits and dashes, starting with a letter");

const node = z.strictObject({
  id,
  /** What the step does, in the viewer's words: "Reads the message", not "HTTP request". */
  label: z.string().min(1).max(26),
  /** The tool that does it, as plain text, e.g. "OpenAI". */
  app: z.string().min(1).max(18).optional(),
  icon: z.enum(ICON_NAMES).optional(),
  /** The ids of the steps this one follows. Leave it out for a step that starts the flow. */
  after: z.array(id).min(1).max(3).optional(),
});

export const config = z
  .strictObject({
    /** 2 to 8 steps. At most 6 in a row and 3 on top of each other. */
    nodes: z.array(node).min(2).max(8),
  })
  .superRefine((value, ctx) => {
    try {
      place(value.nodes);
    } catch (e) {
      ctx.addIssue({ code: "custom", path: ["nodes"], message: e instanceof Error ? e.message : String(e) });
    }
  });

export const action = z.discriminatedUnion("type", [
  /** A step runs. `note` is what it found or did, shown under the step: "Urgent, new patient". */
  z.strictObject({ type: z.literal("run"), node: id, note: z.string().min(1).max(40).optional() }),
]);

export type Config = z.infer<typeof config>;
export type Action = z.infer<typeof action>;
