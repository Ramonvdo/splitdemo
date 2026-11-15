import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/style.ts";
import { Icon } from "../icons.tsx";
import type { PanelProps } from "../types.ts";
import { place } from "./place.ts";
import type { State } from "./reduce.ts";
import { elbow } from "./route.ts";
import type { Action, Config } from "./schema.ts";

type Node = Config["nodes"][number];

/** The most room between two stacked steps: an icon, a label on two lines, its app and a note on two lines. */
const ROW_GAP_REM = 12.5;

/** A step's icon: quiet until it runs, the tally while it runs, dark with a check once it is done. */
function Mark({ node, state, running }: { node: Node; state: State; running: boolean }) {
  const ran = state.ran.includes(node.id);
  const live = running && state.last === node.id;
  return (
    <span
      key={live ? state.runs : "rest"}
      className={cn(
        "relative grid size-[2.5rem] shrink-0 place-items-center rounded-control border",
        live ? "animate-pop border-tally bg-tally text-on-tally" : ran ? "border-ink bg-ink text-window" : "border-line bg-window text-muted",
      )}
    >
      <Icon name={node.icon ?? "bolt"} className="size-[1.3rem]" />
      {ran && !live && (
        <span className="absolute -right-[0.35rem] -top-[0.35rem] grid size-[1rem] animate-pop place-items-center rounded-full bg-good text-window">
          <Icon name="check" className="size-[0.65rem] stroke-[3.5]" />
        </span>
      )}
    </span>
  );
}

function Label({ node, ran }: { node: Node; ran: boolean }) {
  return (
    // One weight, done or not: a label that turns bold gets wider, wraps, and moves everything under it.
    <span className={cn("rounded-control bg-wash px-[0.25rem] font-medium leading-tight", !ran && "text-muted")}>
      {node.label}
      {node.app && <span className="block text-meta font-normal text-muted">{node.app}</span>}
      <span className="sr-only">{ran ? " (done)" : " (not yet)"}</span>
    </span>
  );
}

function Note({ text }: { text: string }) {
  return (
    <span key={text} className="flash animate-land rounded-control border border-line bg-window px-[0.5rem] py-[0.2rem] text-meta leading-tight">
      {text}
    </span>
  );
}

/** The automation as a short flow, left to right. Steps light up as they run and say what they found. */
export default function Panel({ config, state, live: running = false }: PanelProps<Config, State, Action>) {
  const { at, cols } = useMemo(() => place(config.nodes), [config.nodes]);
  const edges = config.nodes.flatMap((node) => (node.after ?? []).map((from) => ({ from, to: node.id })));

  // The canvas is measured: lines are drawn in pixels, so a turn is as round on a wide canvas as on a narrow one.
  const canvas = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number; rem: number }>();
  useLayoutEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight, rem: parseFloat(getComputedStyle(document.documentElement).fontSize) });
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  const x = (id: string) => ((at[id].col + 0.5) / cols) * 100;
  // A lone step sits in the middle. Stacked steps spread from there: as far as the canvas goes,
  // but no further apart than a step with its label and note needs, so a fork stays a fork on a tall canvas.
  const y = (id: string) => {
    const { row, rows } = at[id];
    if (rows === 1) return 50;
    const gap = Math.min(100 / (rows - 1), size && size.h > 0 ? ((ROW_GAP_REM * size.rem) / size.h) * 100 : 100);
    return 50 + (row - (rows - 1) / 2) * gap;
  };

  return (
    <div className="relative h-full bg-wash">
      {/* Steps hang from their icon, so the lines join icon to icon and the labels sit clear below. The bottom inset is the room a step at the very bottom needs: a label on two lines, its app and a note on two lines. */}
      <div ref={canvas} className="absolute inset-x-[0.6rem] bottom-[9.2rem] top-[2.2rem] @max-[30rem]:hidden">
        {size && size.w > 0 && (
          <svg className="absolute inset-0 size-full overflow-visible" viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none" aria-hidden="true">
            {/* Every dotted line first, then the solid ones: two lines out of one step share their first stretch. */}
            {[false, true].map((solid) => (
              <g key={String(solid)} fill="none" strokeWidth="2">
                {edges.map(({ from, to }) => {
                  if (solid && !(state.ran.includes(from) && state.ran.includes(to))) return null;
                  const px = (id: string) => ({ x: (x(id) / 100) * size.w, y: (y(id) / 100) * size.h });
                  // The turn sits on the line between the last two columns: labels stop short of it on both sides.
                  const d = elbow(px(from), px(to), px(to).x - size.w / cols / 2, 14);
                  return solid ? (
                    <path key={`${from}>${to}`} d={d} data-edge={`${from}>${to}`} className="animate-fade stroke-ink" vectorEffect="non-scaling-stroke" />
                  ) : (
                    <path key={`${from}>${to}`} d={d} className="stroke-line" strokeDasharray="1 5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                  );
                })}
              </g>
            ))}
          </svg>
        )}

        <ol className="contents">
          {config.nodes.map((node) => {
            const ran = state.ran.includes(node.id);
            const note = state.notes[node.id];
            return (
              <li
                key={node.id}
                data-node={node.id}
                data-ran={ran || undefined}
                data-running={(running && state.last === node.id) || undefined}
                className="absolute flex w-[8.6rem] -translate-x-1/2 -translate-y-[1.25rem] flex-col items-center gap-[0.4rem] text-center"
                // A little narrower than its column, so the line between two columns stays free for the turns.
                style={{ left: `${x(node.id)}%`, top: `${y(node.id)}%`, maxWidth: `calc(${100 / cols}% - 0.6rem)` }}
              >
                <Mark node={node} state={state} running={running} />
                <Label node={node} ran={ran} />
                {note && <Note text={note} />}
              </li>
            );
          })}
        </ol>
      </div>

      {/* A narrow monitor has no room for a canvas, so there the same steps are a list, top to bottom. */}
      <ol className="hidden h-full flex-col gap-[0.55rem] p-[0.9rem] @max-[30rem]:flex">
        {config.nodes.map((node) => {
          const ran = state.ran.includes(node.id);
          const note = state.notes[node.id];
          return (
            <li key={node.id} data-step={node.id} className="flex items-center gap-[0.7rem]">
              <Mark node={node} state={state} running={running} />
              <span className="flex min-w-0 flex-1 flex-col items-start gap-[0.25rem]">
                <Label node={node} ran={ran} />
                {note && <Note text={note} />}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
