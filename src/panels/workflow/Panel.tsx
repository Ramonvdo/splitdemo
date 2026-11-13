import { useMemo } from "react";
import { cn } from "../../lib/style.ts";
import { Icon } from "../icons.tsx";
import type { PanelProps } from "../types.ts";
import { place } from "./place.ts";
import type { State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

/** The automation as a short flow, left to right. Steps light up as they run and say what they found. */
export default function Panel({ config, state }: PanelProps<Config, State, Action>) {
  const { at, cols } = useMemo(() => place(config.nodes), [config.nodes]);
  const x = (id: string) => ((at[id].col + 0.5) / cols) * 100;
  const y = (id: string) => ((at[id].row + 0.5) / at[id].rows) * 100;
  const edges = config.nodes.flatMap((node) => (node.after ?? []).map((from) => ({ from, to: node.id })));

  return (
    <div className="relative h-full bg-wash">
      {/* Steps hang from their icon, so the lines join icon to icon and the labels sit clear below. */}
      <div className="absolute inset-x-[0.6rem] bottom-[4.6rem] top-[1.9rem]">
        <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {edges.map(({ from, to }) => {
            const mid = (x(from) + x(to)) / 2;
            const d = `M ${x(from)} ${y(from)} C ${mid} ${y(from)}, ${mid} ${y(to)}, ${x(to)} ${y(to)}`;
            const done = state.ran.includes(from) && state.ran.includes(to);
            return (
              <g key={`${from}>${to}`} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke">
                <path d={d} className="stroke-line" strokeDasharray="1 5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                {done && <path d={d} className="animate-fade stroke-ink" vectorEffect="non-scaling-stroke" />}
              </g>
            );
          })}
        </svg>

        <ol className="contents">
          {config.nodes.map((node) => {
            const ran = state.ran.includes(node.id);
            const live = state.last === node.id;
            const note = state.notes[node.id];
            return (
              <li
                key={node.id}
                data-node={node.id}
                data-ran={ran || undefined}
                className="absolute flex w-[8.6rem] -translate-x-1/2 -translate-y-[1.25rem] flex-col items-center gap-[0.4rem] text-center"
                style={{ left: `${x(node.id)}%`, top: `${y(node.id)}%`, maxWidth: `${100 / cols}%` }}
              >
                <span
                  key={live ? state.runs : "rest"}
                  className={cn(
                    "relative grid size-[2.5rem] place-items-center rounded-control border",
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
                <span className={cn("leading-tight", ran ? "font-semibold" : "text-muted")}>
                  {node.label}
                  {node.app && <span className="block text-meta font-normal text-muted">{node.app}</span>}
                  <span className="sr-only">{ran ? " (done)" : " (not yet)"}</span>
                </span>
                {note && (
                  <span key={note} className="flash animate-land rounded-control border border-line bg-window px-[0.5rem] py-[0.2rem] text-meta leading-tight">
                    {note}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
