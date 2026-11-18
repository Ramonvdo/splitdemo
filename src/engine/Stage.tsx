import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn, onColor } from "../lib/style.ts";
import { Icon } from "../panels/icons.tsx";
import { presets } from "../panels/registry.ts";
import { Bar } from "./Bar.tsx";
import { arrange, type Arranged } from "./layout.ts";
import { compile, paced, snapshots } from "./timeline.ts";
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
  const logic = (type: string) => presets[type]?.logic;
  const laid = compile(demo);
  const states = snapshots(demo, logic, laid);
  const timeline = paced(laid, demo, logic, states);
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

/** The tally light: on is a cut, off is a fade. */
function Tally({ live }: { live: boolean }) {
  return (
    <span className="relative size-[0.55rem] shrink-0 rounded-full bg-stage-line">
      <span className={cn("absolute inset-0 rounded-full bg-tally", live ? "opacity-100" : "opacity-0 transition-opacity duration-200")} />
    </span>
  );
}

interface MonitorProps {
  spec: PanelSpec;
  slot: string;
  live: boolean;
  waiting: boolean;
  /** This monitor fills the wall. */
  zoom: boolean;
  /** How much the picture grows while it fills the wall. 1 leaves it as it is. */
  scale: number;
  /** Another monitor fills the wall. */
  hidden: boolean;
  /** A tall, narrow panel: enlarged, it keeps its shape instead of stretching. */
  portrait: boolean;
  /** On a phone the tabs name the monitors, so a monitor has no label of its own. */
  compact: boolean;
  /** Enlarge this monitor, or put it back. Left out while recording. */
  onZoom?: () => void;
  children: ReactNode;
}

function Monitor({ spec, slot, live, waiting, zoom, scale, hidden, portrait, compact, onZoom, children }: MonitorProps) {
  const name = (
    <>
      <Tally live={live} />
      <span className="truncate">{spec.label}</span>
    </>
  );
  return (
    <section
      aria-label={spec.label}
      data-panel={spec.id}
      data-live={live || undefined}
      data-waiting={waiting || undefined}
      data-zoom={zoom || undefined}
      inert={hidden}
      className={cn("flex min-h-0 min-w-0 flex-col gap-[0.45rem] bg-stage", hidden && "invisible")}
      // A monitor that fills the wall lets go of its cell, or the cell would still box it in.
      style={zoom || compact ? undefined : { gridArea: slot }}
    >
      {!compact && (
        <h2 className={cn("flex text-meta font-medium transition-opacity duration-200", live ? "text-stage-ink" : "text-stage-muted")}>
          {onZoom ? (
            <button type="button" onClick={onZoom} aria-label={`${spec.label}: ${zoom ? "show all panels" : "enlarge"}`} title={zoom ? "Show all panels" : "Enlarge"} className="group flex min-h-[1.75rem] min-w-0 items-center gap-[0.55rem] rounded-control text-left transition-colors duration-200 hover:text-stage-ink">
              {name}
              <svg viewBox="0 0 24 24" className={cn("size-[0.95rem] shrink-0 transition-opacity duration-200", zoom ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100")} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {zoom ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
              </svg>
            </button>
          ) : (
            <span className="flex min-h-[1.75rem] min-w-0 items-center gap-[0.55rem]">{name}</span>
          )}
        </h2>
      )}
      <div
        // The panel's own app look hangs on this: src/panels/<type>/skin.css.
        data-app={spec.type}
        className={cn(
          "@container relative min-h-0 flex-1 overflow-hidden rounded-monitor bg-window text-ink transition-[filter] duration-200",
          waiting && "brightness-[0.88]",
          zoom && portrait && !compact && "mx-auto w-full max-w-[30rem]",
        )}
      >
        {/* Enlarged, the picture grows with the monitor, so it reads from across a room. This box is always here, so the panel inside never starts over. */}
        <div className="relative size-full" style={scale > 1 ? { zoom: scale } : undefined}>
          {children}
        </div>
      </div>
    </section>
  );
}

const COMPACT = "(width < 720px)";

/** How long a recording holds the opening picture, with the demo's title under it, before the story starts. */
export const TITLE_CARD_MS = 1200;

/** True on a phone, where the wall shows one monitor at a time. */
function useCompact(): boolean {
  const [compact, setCompact] = useState(() => matchMedia(COMPACT).matches);
  useEffect(() => {
    const query = matchMedia(COMPACT);
    const on = () => setCompact(query.matches);
    query.addEventListener("change", on);
    return () => query.removeEventListener("change", on);
  }, []);
  return compact;
}

/** The whole screen: the wall of monitors, and the bar under it. */
export function Stage({ ready, flags }: { ready: Ready; flags: Flags }) {
  const { demo, timeline, states, arranged } = ready;
  const play = usePlayback(timeline, flags);
  const [bare, setBare] = useState(flags.bare);
  const compact = useCompact();
  /** The monitor that fills the wall, and how much its picture grows to do so. */
  const [zoom, setZoom] = useState<{ id: string; scale: number }>();
  const wall = useRef<HTMLDivElement>(null);
  const beat = timeline.beats[play.pos.beat];
  const now = states[play.pos.n];
  const ids = arranged.slots.map((spec) => spec.id);
  // A phone always shows one monitor: the one picked, and before any pick the first.
  const shown = compact ? (zoom?.id ?? ids[0]) : zoom?.id;

  /** Enlarges a monitor, or puts it back when it is the enlarged one. On a phone it only switches. */
  const pick = (id: string) => {
    if (compact) return setZoom({ id, scale: 1 });
    if (zoom?.id === id) return setZoom(undefined);
    // Measured while the monitor is still in its cell: the picture grows as far as the wall allows both ways.
    const cell = wall.current?.querySelector(`[data-panel="${id}"]`)?.getBoundingClientRect();
    const all = wall.current?.getBoundingClientRect();
    setZoom({ id, scale: cell && all ? Math.max(1, Math.min(all.width / cell.width, all.height / cell.height)) : 1 });
  };

  // Back on a wide screen the whole wall shows again.
  useEffect(() => {
    if (!compact) setZoom(undefined);
  }, [compact]);
  // On a phone the wall follows the action; a tab the viewer picks holds until the action moves on.
  useEffect(() => {
    if (compact && play.focus) setZoom({ id: play.focus, scale: 1 });
  }, [compact, play.focus]);

  // Left to play on its own, the story starts once the picture is whole: every part loaded, every letter in its font.
  // A recording first holds the opening picture for a moment, as its title card.
  const latest = useRef(play);
  latest.current = play;
  useEffect(() => {
    if (!flags.autoplay || flags.at !== undefined) return;
    let frame = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let off = false;
    const start = () => !off && latest.current.status === "idle" && latest.current.toggle();
    const wait = () => {
      if (wall.current?.querySelector("[data-loading]")) return void (frame = requestAnimationFrame(wait));
      document.fonts.ready.then(() => (timer = setTimeout(start, flags.record ? TITLE_CARD_MS : 0)));
    };
    wait();
    return () => {
      off = true;
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const onControl = e.target instanceof HTMLElement && e.target.closest("button, a, input, textarea, select");
      if (e.key === " " && !onControl) play.toggle();
      else if (e.key === "ArrowRight") play.next();
      else if (e.key === "ArrowLeft") play.prev();
      else if (e.key === "r" || e.key === "R") play.replay();
      else if (e.key === "h" || e.key === "H") setBare((on) => !on);
      else if (e.key === "Escape" && !compact) setZoom(undefined);
      else if (/^[1-4]$/.test(e.key) && ids[Number(e.key) - 1]) pick(ids[Number(e.key) - 1]);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [play, compact, zoom, ids.join()]);

  const accent = demo.accent;
  const style = accent ? ({ "--color-tally": accent, "--color-on-tally": onColor(accent) } as CSSProperties) : undefined;

  return (
    <main
      className={cn("stage grid h-dvh gap-[0.9rem] p-[0.9rem]", compact ? "grid-rows-[auto_minmax(0,1fr)_auto]" : "grid-rows-[minmax(0,1fr)_auto]", flags.record && "cursor-none")}
      style={style}
      data-status={play.status}
      data-beat={play.pos.beat}
      data-still={play.still || undefined}
      data-done={play.status === "done" || undefined}
    >
      <h1 className="sr-only">{demo.title}</h1>
      {compact && (
        <div role="tablist" aria-label="Panels" className="flex min-w-0 gap-[0.4rem]">
          {arranged.slots.map((spec) => {
            const on = shown === spec.id;
            const live = play.focus === spec.id;
            return (
              // The tab in view carries its name; the others are the panel's icon, lit when the action is there.
              <button
                key={spec.id}
                type="button"
                role="tab"
                aria-selected={on}
                aria-label={spec.label}
                onClick={() => pick(spec.id)}
                className={cn(
                  "flex h-[2.6rem] items-center justify-center gap-[0.5rem] rounded-full border text-meta font-medium",
                  on ? "min-w-0 flex-1 border-transparent bg-stage-raise px-[0.9rem] text-stage-ink" : cn("w-[2.6rem] shrink-0", live ? "border-tally text-tally" : "border-stage-line text-stage-muted"),
                )}
              >
                {on && <Tally live={live} />}
                {on ? <span className="line-clamp-2 min-w-0 text-left leading-[1.15]">{spec.label}</span> : <Icon name={presets[spec.type].logic.icon} className="size-[1.15rem]" />}
              </button>
            );
          })}
        </div>
      )}
      <div ref={wall} className="wall" data-layout={arranged.layout} data-narrow={arranged.narrow || undefined} data-compact={compact || undefined}>
        {arranged.slots.map((spec, i) => {
          const { View, logic } = presets[spec.type];
          const live = play.focus === spec.id;
          const pending = play.gate?.action.on === spec.id ? play.gate.action : undefined;
          return (
            <Monitor
              key={spec.id}
              spec={spec}
              slot={SLOTS[i]}
              live={live}
              // Before the first press every monitor is lit: the opening picture is the whole wall.
              waiting={play.status !== "idle" && play.lit.length > 0 && !play.lit.includes(spec.id) && !compact}
              zoom={shown === spec.id}
              scale={zoom?.id === spec.id ? zoom.scale : 1}
              hidden={shown !== undefined && shown !== spec.id}
              portrait={logic.portrait === true}
              compact={compact}
              onZoom={flags.record ? undefined : () => pick(spec.id)}
            >
              <View config={spec.config} state={now[spec.id]} pending={pending} onTrigger={pending ? play.press : undefined} clock={beat.clock} still={play.still} live={live} />
            </Monitor>
          );
        })}
      </div>
      {!bare && <Bar demo={demo} timeline={timeline} play={play} record={flags.record} />}
    </main>
  );
}
