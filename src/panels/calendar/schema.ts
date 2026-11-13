import { z } from "zod";
import { TONE_NAMES } from "../tones.ts";

const id = z.string().regex(/^[a-z][a-z0-9-]*$/, "use lowercase letters, digits and dashes, starting with a letter");
const tone = z.enum(TONE_NAMES);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "use a time like 09:30");
/** What the booking is, e.g. "Inspection, Birch Lane". */
const title = z.string().min(1).max(22);

/** A day shows this many bookings, each with a title of up to two lines. More and the bottom ones fall off the monitor. */
export const DAY_MAX = 3;

export const config = z
  .strictObject({
    /** The days shown, left to right, e.g. Mon to Thu. */
    days: z.array(z.strictObject({ id, label: z.string().min(1).max(10) })).min(2).max(5),
    /** The id of the day marked "Today". */
    today: id.optional(),
    /** What is already booked when the demo starts. A day fits 3. */
    events: z.array(z.strictObject({ id, day: id, time, title, tone: tone.optional() })).max(12).optional(),
  })
  .superRefine((value, ctx) => {
    const days = new Set<string>();
    value.days.forEach((day, i) => {
      if (days.has(day.id)) ctx.addIssue({ code: "custom", path: ["days", i, "id"], message: `"${day.id}" is used twice` });
      days.add(day.id);
    });
    if (value.today && !days.has(value.today)) ctx.addIssue({ code: "custom", path: ["today"], message: `there is no day "${value.today}"` });
    const ids = new Set<string>();
    const slots = new Set<string>();
    const count = new Map<string, number>();
    (value.events ?? []).forEach((event, i) => {
      if (ids.has(event.id)) ctx.addIssue({ code: "custom", path: ["events", i, "id"], message: `"${event.id}" is used twice` });
      ids.add(event.id);
      if (!days.has(event.day)) ctx.addIssue({ code: "custom", path: ["events", i, "day"], message: `there is no day "${event.day}"` });
      const slot = `${event.day} ${event.time}`;
      if (slots.has(slot)) ctx.addIssue({ code: "custom", path: ["events", i, "time"], message: `${slot} is booked twice` });
      slots.add(slot);
      const n = (count.get(event.day) ?? 0) + 1;
      count.set(event.day, n);
      if (n === DAY_MAX + 1) ctx.addIssue({ code: "custom", path: ["events", i, "day"], message: `"${event.day}" holds more than the ${DAY_MAX} bookings a day fits` });
    });
  });

export const action = z.discriminatedUnion("type", [
  /** A new booking lands in a day, in time order. It may take the slot of a cancelled one. */
  z.strictObject({ type: z.literal("book"), id, day: id, time, title, tone: tone.optional() }),
  /** A booking moves to another day or time. */
  z.strictObject({ type: z.literal("move"), event: id, day: id, time }),
  /** A booking is cancelled. It stays, struck through, until its slot is booked again. */
  z.strictObject({ type: z.literal("cancel"), event: id }),
]);

export type Config = z.infer<typeof config>;
export type Action = z.infer<typeof action>;
