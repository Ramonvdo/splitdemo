import { z } from "zod";
import { TONE_NAMES } from "../tones.ts";

const id = z.string().regex(/^[a-z][a-z0-9-]*$/, "use lowercase letters, digits and dashes, starting with a letter");

/** What a card says. Everything but the title is optional. */
const fields = {
  /** Who or what the card is about: a person, a company, a deal. */
  title: z.string().min(1).max(28),
  subtitle: z.string().min(1).max(36).optional(),
  /** The number that matters, e.g. "$1,200". */
  value: z.string().min(1).max(12).optional(),
  /** A short status, e.g. "Booked Thu 10:00". */
  tag: z.string().min(1).max(20).optional(),
  /** The tag's colour: good (won, done), wait (needs someone), info (in motion), idle (the default). */
  tone: z.enum(TONE_NAMES).optional(),
};

export const config = z
  .strictObject({
    /** The stages of the board, left to right. */
    columns: z.array(z.strictObject({ id, title: z.string().min(1).max(18) })).min(2).max(4),
    /** Cards already on the board when the demo starts. A column fits 4. */
    cards: z.array(z.strictObject({ id, column: id, ...fields })).max(8).optional(),
  })
  .superRefine((value, ctx) => {
    const columns = new Set(value.columns.map((c) => c.id));
    const seen = new Set<string>();
    (value.cards ?? []).forEach((card, i) => {
      if (!columns.has(card.column)) ctx.addIssue({ code: "custom", path: ["cards", i, "column"], message: `there is no column "${card.column}"` });
      if (seen.has(card.id)) ctx.addIssue({ code: "custom", path: ["cards", i, "id"], message: `"${card.id}" is used twice` });
      seen.add(card.id);
    });
  });

export const action = z.discriminatedUnion("type", [
  /** A new card lands at the top of column `to`. */
  z.strictObject({ type: z.literal("add"), id, to: id, ...fields }),
  /** A card moves to the top of another column. */
  z.strictObject({ type: z.literal("move"), card: id, to: id }),
  /** A card changes in place. Name only what changes. */
  z.strictObject({ type: z.literal("set"), card: id, ...fields, title: fields.title.optional() }),
]);

export type Config = z.infer<typeof config>;
export type Action = z.infer<typeof action>;
