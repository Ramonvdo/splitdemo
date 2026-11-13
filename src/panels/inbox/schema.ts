import { z } from "zod";
import { TONE_NAMES } from "../tones.ts";

const id = z.string().regex(/^[a-z][a-z0-9-]*$/, "use lowercase letters, digits and dashes, starting with a letter");
const tone = z.enum(TONE_NAMES);

const fields = {
  /** Who it is from, e.g. "Dana Whitfield". */
  from: z.string().min(1).max(28),
  subject: z.string().min(1).max(48),
  /** What the mail says, in a sentence or two. The viewer reads it when the mail is opened. */
  body: z.string().min(1).max(120).optional(),
  /** When it arrived, e.g. "09:12" or "Tue". */
  time: z.string().min(1).max(8).optional(),
  /** A label on the mail, e.g. "Interested". */
  tag: z.string().min(1).max(16).optional(),
  /** The label's colour: good, wait, info or idle (the default). */
  tone: tone.optional(),
};

export const config = z
  .strictObject({
    /** The mailbox's name, e.g. "Sales inbox". Default: "Inbox". */
    title: z.string().min(1).max(24).optional(),
    /** Mail already there when the demo starts, newest first. The list fits 5. */
    mails: z.array(z.strictObject({ id, ...fields, unread: z.boolean().optional() })).max(4).optional(),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    (value.mails ?? []).forEach((mail, i) => {
      if (seen.has(mail.id)) ctx.addIssue({ code: "custom", path: ["mails", i, "id"], message: `"${mail.id}" is used twice` });
      seen.add(mail.id);
    });
  });

export const action = z.discriminatedUnion("type", [
  /** A new mail lands on top, unread. */
  z.strictObject({ type: z.literal("receive"), id, ...fields }),
  /** A mail is opened next to the list, so the viewer can read it. */
  z.strictObject({ type: z.literal("open"), mail: id }),
  /** A label is put on a mail. */
  z.strictObject({ type: z.literal("tag"), mail: id, tag: fields.tag.unwrap(), tone: tone.optional() }),
  /** A reply appears under a mail, which is opened if it was not. `label` says who wrote it, e.g. "Drafted for you". */
  z.strictObject({ type: z.literal("reply"), mail: id, text: z.string().min(1).max(120), label: z.string().min(1).max(20).optional() }),
]);

export type Config = z.infer<typeof config>;
export type Action = z.infer<typeof action>;
