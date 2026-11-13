import type { ReactNode } from "react";
import { cn } from "../lib/utils.ts";
import type { Demo, Timeline } from "./types.ts";
import type { Playback } from "./usePlayback.ts";

const ICONS = {
  play: <path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" />,
  pause: <path d="M8 5v14M16 5v14" strokeWidth="3" />,
  prev: <path d="M17 6l-8 6 8 6zM7 6v12" />,
  next: <path d="M7 6l8 6-8 6zM17 6v12" />,
  replay: <path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5" />,
};

function Control({ icon, label, onClick, primary, disabled }: { icon: keyof typeof ICONS; label: string; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-[2.6rem] shrink-0 place-items-center rounded-full transition-opacity duration-200 disabled:opacity-30",
        primary ? "bg-tally text-on-tally" : "text-stage-muted hover:bg-stage-raise hover:text-stage-ink",
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[1.25rem]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ICONS[icon]}
      </svg>
    </button>
  );
}

/** The last caption said at or before a beat, so a beat without one keeps the line that still applies. */
function captionAt(t: Timeline, beat: number): string | undefined {
  for (let b = beat; b >= 0; b--) if (t.beats[b].say) return t.beats[b].say;
  return undefined;
}

/** The one strip of chrome: where the demo is, what the moment means, and at the end what came of it. */
export function Bar({ demo, timeline, play, record }: { demo: Demo; timeline: Timeline; play: Playback; record: boolean }) {
  const { pos, status } = play;
  const beat = timeline.beats[pos.beat];
  const done = status === "done";
  const idle = status === "idle";

  let line: ReactNode;
  if (done) {
    line = (
      <dl key="outcome" className="flex flex-wrap items-end gap-x-[2.6rem] gap-y-2" data-outcome>
        {demo.outcome.map((o, i) => (
          <div key={i} className="flex animate-land items-end gap-3 border-l-2 border-tally pl-3" style={{ animationDelay: `${i * 140}ms` }}>
            <dd className="text-outcome font-bold tabular-nums tracking-tight">{o.value}</dd>
            <dt className="pb-[0.2rem] text-lead leading-tight text-stage-muted">
              {o.label}
              {o.was && <span className="block text-meta">was {o.was}</span>}
            </dt>
          </div>
        ))}
      </dl>
    );
  } else {
    line = (
      <p key={idle ? "title" : pos.beat} className="animate-land text-balance text-caption font-semibold tracking-[-0.01em]" data-caption>
        {idle ? demo.title : captionAt(timeline, pos.beat)}
      </p>
    );
  }

  return (
    <footer className="flex flex-col gap-[0.7rem]">
      <div className="flex gap-[0.3rem]" aria-hidden="true">
        {timeline.beats.map((_, i) => (
          <span key={i} className="h-[0.16rem] flex-1 rounded-full bg-stage-line">
            <span className={cn("block h-full rounded-full bg-stage-ink transition-opacity duration-300", !idle && (done || i <= pos.beat) ? "opacity-100" : "opacity-0")} />
          </span>
        ))}
      </div>
      <div className="flex min-h-[3.6rem] items-center gap-[1.2rem]">
        {!record && (
          <div className="flex items-center gap-1">
            <Control icon={status === "playing" ? "pause" : done ? "replay" : "play"} label={status === "playing" ? "Pause" : done ? "Play again" : "Play"} onClick={play.toggle} primary />
            <Control icon="prev" label="Step back" onClick={play.prev} disabled={idle} />
            <Control icon="next" label="Step forward" onClick={play.next} disabled={done} />
          </div>
        )}
        <div className="min-w-0 flex-1" aria-live="polite">
          <span className="sr-only">{done ? "Result. " : idle ? "" : `Step ${pos.beat + 1} of ${timeline.beats.length}. `}</span>
          {line}
        </div>
        <div className="flex shrink-0 items-center gap-[0.9rem] text-meta text-stage-muted">
          {beat.clock && !done && (
            <time className="font-mono text-lead tabular-nums text-stage-ink" data-clock>
              {beat.clock}
            </time>
          )}
          <span className="rounded-full border border-stage-line px-[0.7rem] py-[0.2rem]">Scripted example</span>
        </div>
      </div>
    </footer>
  );
}
