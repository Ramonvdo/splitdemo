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

/** Where the viewer can go when the demo is over. Only a web page or an email: the link is put on the page as it is written. */
export const next = z.strictObject({
  label: z.string().min(1).max(28),
  url: z
    .string()
    .max(300)
    .regex(/^(https:\/\/[^\s/]+\.[^\s]+|mailto:[^\s@]+@[^\s@]+)$/, "use an https:// or a mailto: link"),
});

const roiInput = z.strictObject({
  id,
  label: z.string().min(1).max(44),
  value: z.number().min(0).max(1e9),
  kind: z.enum(["percent", "money"]).optional(),
  min: z.number().min(0).optional(),
  max: z.number().max(1e9).optional(),
});

/** A calculator on the results slide. Every gain is a product of its inputs, so each id it names must be a field. */
export const roi = z
  .strictObject({
    currency: z.string().regex(/^[A-Z]{3}$/, "use a currency code like USD or EUR"),
    label: z.string().min(1).max(28).optional(),
    inputs: z.array(roiInput).min(2).max(5),
    gains: z
      .array(z.strictObject({ label: z.string().min(1).max(24), from: z.array(id).min(1).max(4), times: z.number().positive().max(1000).optional() }))
      .min(1)
      .max(3),
    cost: z
      .strictObject({ monthly: z.number().positive().max(1e9).optional(), once: z.number().positive().max(1e9).optional() })
      .refine((cost) => cost.monthly !== undefined || cost.once !== undefined, "give a monthly cost, a one-time cost, or both")
      .optional(),
  })
  .superRefine((value, ctx) => {
    const ids = value.inputs.map((input) => input.id);
    ids.forEach((one, i) => {
      if (ids.indexOf(one) !== i) ctx.addIssue({ code: "custom", path: ["inputs", i, "id"], message: `"${one}" is used twice` });
    });
    value.inputs.forEach((input, i) => {
      if (input.max !== undefined && input.max < (input.min ?? 0)) ctx.addIssue({ code: "custom", path: ["inputs", i, "max"], message: "max is below min" });
    });
    value.gains.forEach((gain, g) =>
      gain.from.forEach((one, i) => {
        if (!ids.includes(one)) ctx.addIssue({ code: "custom", path: ["gains", g, "from", i], message: `no input is called "${one}"` });
      }),
    );
  });

/** The slide after the story. */
export const results = z.strictObject({
  title: z.string().min(1).max(60).optional(),
  text: z.string().min(1).max(220).optional(),
  roi: roi.optional(),
});

export const demo = z.strictObject({
  v: z.literal(1),
  title: z.string().min(1).max(60),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i, "use a colour like #ff5c35").optional(),
  layout: z.enum(["rail", "quad", "trio", "duo"]).optional(),
  panels: z.array(panelSpec).min(2).max(4),
  beats: z.array(beat).min(1).max(16),
  outcome: z.array(outcome).min(1).max(3),
  results: results.optional(),
  lang: z.enum(["en", "nl"]).optional(),
  next: next.optional(),
  expires: z.iso.date().optional(),
});
