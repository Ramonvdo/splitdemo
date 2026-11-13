import { z } from "zod";

const id = z.string().regex(/^[a-z][a-z0-9-]*$/, "use lowercase letters, digits and dashes, starting with a letter");

const field = z.strictObject({
  id,
  /** The question, e.g. "What do you need?". */
  label: z.string().min(1).max(28),
  /** Grey text shown while the field is empty. */
  placeholder: z.string().min(1).max(28).optional(),
  /** Makes it a choice: 2 to 4 answers, shown as buttons. */
  options: z.array(z.string().min(1).max(18)).min(2).max(4).optional(),
});

export const config = z
  .strictObject({
    /** What the form is for, e.g. "Request a quote". */
    title: z.string().min(1).max(36),
    /** One line under the title. */
    intro: z.string().min(1).max(72).optional(),
    fields: z.array(field).min(1).max(4),
    /** The text on the button. Default: "Send". */
    button: z.string().min(1).max(18).optional(),
    /** What the person sees once the form is sent. Default: "Thank you". */
    done: z.strictObject({ title: z.string().min(1).max(32), text: z.string().min(1).max(72).optional() }).optional(),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.fields.forEach((item, i) => {
      if (seen.has(item.id)) ctx.addIssue({ code: "custom", path: ["fields", i, "id"], message: `"${item.id}" is used twice` });
      seen.add(item.id);
    });
  });

export const action = z.discriminatedUnion("type", [
  /** An answer appears in a field. For a choice it must be one of the field's `options`. */
  z.strictObject({ type: z.literal("fill"), field: id, value: z.string().min(1).max(40) }),
  /** The form is sent. A beat can `wait` on this, so the viewer presses the button. */
  z.strictObject({ type: z.literal("submit") }),
]);

export type Config = z.infer<typeof config>;
export type Action = z.infer<typeof action>;
