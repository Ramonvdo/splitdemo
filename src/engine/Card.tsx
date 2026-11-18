import type { ReactNode } from "react";

/**
 * Explainer mode: one text alone on the wall. A step's caption before anything of the step shows, or the demo's title before the story starts.
 * It lies over the monitors, which stay where they are underneath, so nothing in them starts over.
 */
export function Card({ tag, clock, text, children }: { tag?: string; clock?: string; text: string; children?: ReactNode }) {
  return (
    <div data-slate aria-live="polite" className="absolute inset-0 z-[2] flex items-center justify-center bg-stage px-[2rem] compact:px-[0.4rem]">
      <div className="flex w-full max-w-[52rem] flex-col items-start gap-[1.4rem]">
        {(tag || clock) && (
          <p className="flex animate-fade items-center gap-[0.9rem] text-lead">
            {tag && <span className="rounded-full bg-tally px-[0.9rem] py-[0.25rem] font-semibold text-on-tally">{tag}</span>}
            {clock && <time className="font-medium text-stage-muted">{clock}</time>}
          </p>
        )}
        <p className="animate-land text-balance text-card font-semibold tracking-[-0.02em] compact:text-huge">{text}</p>
        {children}
      </div>
    </div>
  );
}
