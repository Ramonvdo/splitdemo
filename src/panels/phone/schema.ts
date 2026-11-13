import { z } from "zod";

const text = z.string().min(1).max(220);
const message = z.strictObject({ from: z.enum(["me", "them"]), text });

export const config = z.strictObject({
  /** Who the phone's owner is talking to, as the thread's title. */
  contact: z.string().min(1).max(28),
  /** Under the contact, e.g. "Text message" or "WhatsApp". */
  subtitle: z.string().min(1).max(32).optional(),
  /** Messages already in the thread when the demo starts. */
  messages: z.array(message).max(3).optional(),
});

export const action = z.discriminatedUnion("type", [
  /** The phone's owner sends a message. A beat can wait for the viewer to press send. */
  z.strictObject({ type: z.literal("send"), text }),
  /** A message arrives from the contact. */
  z.strictObject({ type: z.literal("receive"), text }),
  /** The contact is typing. The next `receive` replaces the dots. */
  z.strictObject({ type: z.literal("typing") }),
  /** A notification drops in from the top. The next message clears it. */
  z.strictObject({ type: z.literal("notify"), title: z.string().min(1).max(28), text: z.string().min(1).max(90) }),
]);

export type Config = z.infer<typeof config>;
export type Action = z.infer<typeof action>;
export type Message = z.infer<typeof message>;
