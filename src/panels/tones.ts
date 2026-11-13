/** Status colours, for a tag or a cell. They live inside monitors and never stand in for the tally. */
export const TONE_NAMES = ["good", "wait", "info", "idle"] as const;
export type Tone = (typeof TONE_NAMES)[number];

export const TONES: Record<Tone, string> = {
  good: "bg-good/10 text-good",
  wait: "bg-wait/10 text-wait",
  info: "bg-info/10 text-info",
  idle: "bg-wash text-muted",
};
