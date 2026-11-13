import { useMemo } from "react";
import { cn } from "../../lib/style.ts";
import { Icon } from "../icons.tsx";
import type { PanelProps } from "../types.ts";
import { place } from "./place.ts";
import type { State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

type Node = Config["nodes"][number];

/** A step's icon: quiet until it runs, the tally while it runs, dark with a check once it is done. */
function Mark({ node, state }: { node: Node; state: State }) {
  const ran = state.ran.includes(node.id);
  const live = state.last === node.id;
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
    <span className={cn("rounded-control bg-wash px-[0.25rem] leading-tight", ran ? "font-semibold" : "text-muted")}>
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
export default function Panel({ config, state }: PanelProps<Config, State, Action>) {
  const { at, cols } = useMemo(() => place(config.nodes), [config.nodes]);
  const x = (id: string) => ((at[id].col + 0.5) / cols) * 100;
  // A lone step sits in the middle. Stacked steps spread over the full height, so a note under one stays clear of the next.
  const y = (id: string) => (at[id].rows === 1 ? 50 : (at[id].row / (at[id].rows - 1)) * 100);
  const edges = config.nodes.flatMap((node) => (node.after ?? []).map((from) => ({ from, to: node.id })));

  return (
    <div className="relative h-full bg-wash">
      {/* Steps hang from their icon, so the lines join icon to icon and the labels sit clear below. The bottom inset is the room a step at the very bottom needs: a label on two lines, its app and a note on two lines. */}
      <div className="absolute inset-x-[0.6rem] bottom-[8.8rem] top-[2.2rem] @max-[30rem]:hidden">
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
            const note = state.notes[node.id];
            return (
              <li
                key={node.id}
                data-node={node.id}
                data-ran={ran || undefined}
                className="absolute flex w-[8.6rem] -translate-x-1/2 -translate-y-[1.25rem] flex-col items-center gap-[0.4rem] text-center"
                style={{ left: `${x(node.id)}%`, top: `${y(node.id)}%`, maxWidth: `${100 / cols}%` }}
              >
                <Mark node={node} state={state} />
                <Label node={node} ran={ran} />
                {note && <Note text={note} />}
              </li>
            );
          })}
        </ol>
      </div>

      {/* A narrow monitor has no room for a canvas, so there the same steps are a list, top to bottom. */}
      <ol className="hidden h-full flex-col justify-center gap-[0.55rem] p-[0.9rem] @max-[30rem]:flex">
        {config.nodes.map((node) => {
          const ran = state.ran.includes(node.id);
          const note = state.notes[node.id];
          return (
            <li key={node.id} data-step={node.id} className="flex items-center gap-[0.7rem]">
              <Mark node={node} state={state} />
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
