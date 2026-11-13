import { cn } from "../lib/utils.ts";

/**
 * "Press here." Sits on the control a waiting beat wants pressed; put it inside a `relative` element.
 * It only points: the press itself is the control's own click, or the timeline's when nobody clicks.
 */
export function TapDot({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" data-tap className={cn("pointer-events-none absolute left-1/2 top-1/2 z-20 -ml-[1.25rem] -mt-[1.25rem] block size-[2.5rem]", className)}>
      <span className="absolute inset-0 animate-ring rounded-full border-2 border-tally" />
      <span className="absolute inset-[0.55rem] animate-tap rounded-full border-2 border-window bg-tally" />
    </span>
  );
}
