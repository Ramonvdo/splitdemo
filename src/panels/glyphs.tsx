import type { ReactNode } from "react";

/**
 * The small marks an app's own chrome is made of: a caret, a plus, a lock.
 * They dress a panel and say nothing a viewer needs, so they are never an icon a demo can name (those are in icons.tsx).
 */
const SHAPES = {
  caret: <path d="M3.5 6h9L8 11.5z" fill="currentColor" stroke="none" />,
  plus: <path d="M8 3v10M3 8h10" />,
  lines: <path d="M3 4.5h10M3 8h10M3 11.5h10" />,
  person: <path d="M8 7.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2zM3 14c0-2.7 2.2-4.4 5-4.4s5 1.7 5 4.4z" fill="currentColor" stroke="none" />,
  back: <path d="M10 3L5 8l5 5" />,
  lock: <path d="M4.5 7.5h7v5.5h-7zM6 7.5V5.5a2 2 0 0 1 4 0v2" />,
  more: <path d="M8 3.5v.01M8 8v.01M8 12.5v.01" strokeWidth="2.2" />,
  grid: <path d="M3.5 3.5v.01M8 3.5v.01M12.5 3.5v.01M3.5 8v.01M8 8v.01M12.5 8v.01M3.5 12.5v.01M8 12.5v.01M12.5 12.5v.01" strokeWidth="2.2" />,
  reply: <path d="M6.5 4L3 7.5 6.5 11M3 7.5h6a4 4 0 0 1 4 4v1" />,
  pencil: <path d="M3 13l.6-2.8L10.8 3l2.2 2.2-7.2 7.2zM9.5 4.3l2.2 2.2" />,
  signal: <path d="M2.5 13v-2M6 13V9M9.5 13V6.5M13 13V4" strokeWidth="2" />,
  battery: <path d="M1.5 5.5h11v5h-11zM14 7.2v1.6M3 7h7v2H3z" strokeWidth="1" fill="currentColor" />,
} satisfies Record<string, ReactNode>;

export type GlyphName = keyof typeof SHAPES;

export function Glyph({ name, className }: { name: GlyphName; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {SHAPES[name]}
    </svg>
  );
}
