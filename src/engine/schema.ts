import { z } from "zod";
import { work } from "./roi.ts";
import type { Roi } from "./types.ts";

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
  ask: z.string().min(1).max(90).optional(),
  note: z.string().min(1).max(80).optional(),
  stage: z.string().min(1).max(16).optional(),
});

/**
 * A calculator on the results slide: one chain of inputs multiplied in order, and the one input the system changes.
 * The numbers it ships with have to show an effect, or the slide opens on nothing.
 */
export const roi = z
  .strictObject({
    currency: z.string().regex(/^[A-Z]{3}$/, "use a currency code like USD or EUR"),
    label: z.string().min(1).max(28).optional(),
    inputs: z.array(roiInput).min(2).max(5),
    lever: z.strictObject({ input: id, to: z.number().min(0).max(1e9).optional(), add: z.number().positive().max(1e9).optional() }),
    times: z.number().positive().max(1000).optional(),
    saving: z.literal(true).optional(),
    monthly: z.literal(true).optional(),
    cost: z
      .strictObject({ monthly: z.number().positive().max(1e9).optional(), once: z.number().positive().max(1e9).optional() })
      .refine((cost) => cost.monthly !== undefined || cost.once !== undefined, "give a monthly cost, a one-time cost, or both")
      .optional(),
  })
  .superRefine((value, ctx) => {
    // Whether the chain can be worked out at all: only then is "it changes nothing" worth saying.
    let sound = true;
    const refuse = (path: PropertyKey[], message: string) => {
      sound = false;
      ctx.addIssue({ code: "custom", path, message });
    };
    const ids = value.inputs.map((input) => input.id);
    ids.forEach((one, i) => {
      if (ids.indexOf(one) !== i) refuse(["inputs", i, "id"], `"${one}" is used twice`);
    });
    value.inputs.forEach((input, i) => {
      if (input.max !== undefined && input.max < (input.min ?? 0)) ctx.addIssue({ code: "custom", path: ["inputs", i, "max"], message: "max is below min" });
    });
    const asked = value.inputs.filter((input) => input.ask).length;
    if (asked === 0)
      ctx.addIssue({ code: "custom", path: ["inputs"], message: "no input has an `ask`. Give one to the numbers an owner knows offhand, so the slide has something to ask" });
    if (asked > 4)
      ctx.addIssue({ code: "custom", path: ["inputs"], message: `${asked} inputs have an \`ask\`. Four questions at most: the rest are estimates the viewer can change on the report` });

    const { lever } = value;
    const pulled = value.inputs.find((input) => input.id === lever.input);
    if ((lever.to === undefined) === (lever.add === undefined))
      refuse(["lever"], "give `add` (what the system adds to their number) or `to` (the system's own number), one of the two");
    if (!pulled) refuse(["lever", "input"], `no input is called "${lever.input}"`);
    else if (pulled.kind === "percent" && (lever.to ?? 0) > 100) refuse(["lever", "to"], "a share stops at 100");
    if (value.saving && value.monthly) ctx.addIssue({ code: "custom", path: ["monthly"], message: "not with `saving`. `monthly` is for clients who keep paying" });

    if (sound && work(value as Roi, Object.fromEntries(value.inputs.map((input) => [input.id, input.value]))).effect <= 0)
      ctx.addIssue({ code: "custom", path: ["lever"], message: "with these numbers the system changes nothing. Its number has to beat today's (or, with `saving`, come under it)" });
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
