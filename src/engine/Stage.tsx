import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { cn, onColor } from "../lib/utils.ts";
import { presets } from "../panels/registry.ts";
import { Bar } from "./Bar.tsx";
import { arrange, type Arranged } from "./layout.ts";
import { compile, snapshots } from "./timeline.ts";
import type { Demo, PanelSpec, States, Timeline } from "./types.ts";
import { usePlayback, type PlaybackOptions } from "./usePlayback.ts";

export interface Ready {
  demo: Demo;
  timeline: Timeline;
  states: States[];
  arranged: Arranged;
}

/** Works a demo out in full before anything is drawn. Throws, with its place in demo.json, when it cannot play. */
export function prepare(demo: Demo): Ready {
  const timeline = compile(demo);
  const states = snapshots(demo, (type) => presets[type]?.logic, timeline);
  const arranged = arrange(demo, (type) => presets[type]?.logic.portrait === true);
  return { demo, timeline, states, arranged };
}

export interface Flags extends PlaybackOptions {
  /** For the recorder: no transport, no mouse pointer. */
  record: boolean;
  /** Only the monitors. */
  bare: boolean;
}

const SLOTS = ["a", "b", "c", "d"];

function Monitor({ spec, slot, live, waiting, children }: { spec: PanelSpec; slot: string; live: boolean; waiting: boolean; children: ReactNode }) {
  return (
    <section aria-label={spec.label} data-panel={spec.id} data-live={live || undefined} className="flex min-h-0 min-w-0 flex-col gap-[0.45rem]" style={{ gridArea: slot }}>
      <h2 className={cn("flex items-center gap-[0.55rem] text-meta font-medium transition-opacity duration-200", live ? "text-stage-ink" : "text-stage-muted")}>
        {/* The tally light: on is a cut, off is a fade. */}
        <span className="relative size-[0.55rem] shrink-0 rounded-full bg-stage-line">
          <span className={cn("absolute inset-0 rounded-full bg-tally", live ? "opacity-100" : "opacity-0 transition-opacity duration-200")} />
        </span>
        <span className="truncate">{spec.label}</span>
      </h2>
      <div className={cn("@container relative min-h-0 flex-1 overflow-hidden rounded-monitor bg-window text-ink transition-[filter] duration-200", waiting && "brightness-[0.78]")}>{children}</div>
    </section>
  );
}

/** The whole screen: the wall of monitors, and the bar under it. */
export function Stage({ ready, flags }: { ready: Ready; flags: Flags }) {
  const { demo, timeline, states, arranged } = ready;
  const play = usePlayback(timeline, flags);
  const [bare, setBare] = useState(flags.bare);
  const beat = timeline.beats[play.pos.beat];
  const now = states[play.pos.n];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const onControl = e.target instanceof HTMLElement && e.target.closest("button, a, input, textarea, select");
      if (e.key === " " && !onControl) play.toggle();
      else if (e.key === "ArrowRight") play.next();
      else if (e.key === "ArrowLeft") play.prev();
      else if (e.key === "r" || e.key === "R") play.replay();
      else if (e.key === "h" || e.key === "H") setBare((on) => !on);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [play]);

  const accent = demo.accent;
  const style = accent ? ({ "--color-tally": accent, "--color-on-tally": onColor(accent) } as CSSProperties) : undefined;

  return (
    <main
      className={cn("grid h-dvh grid-rows-[minmax(0,1fr)_auto] gap-[0.9rem] p-[0.9rem]", flags.record && "cursor-none")}
      style={style}
      data-status={play.status}
      data-beat={play.pos.beat}
      data-still={play.still || undefined}
      data-done={play.status === "done" || undefined}
    >
      <h1 className="sr-only">{demo.title}</h1>
      <div className="wall" data-layout={arranged.layout} data-narrow={arranged.narrow || undefined}>
        {arranged.slots.map((spec, i) => {
          const { View } = presets[spec.type];
          const live = play.focus === spec.id;
          const pending = play.gate?.action.on === spec.id ? play.gate.action : undefined;
          return (
            <Monitor key={spec.id} spec={spec} slot={SLOTS[i]} live={live} waiting={play.focus !== undefined && !live}>
              <View config={spec.config} state={now[spec.id]} pending={pending} onTrigger={pending ? play.press : undefined} clock={beat.clock} />
            </Monitor>
          );
        })}
      </div>
      {!bare && <Bar demo={demo} timeline={timeline} play={play} record={flags.record} />}
    </main>
  );
}
