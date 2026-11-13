import { lazy, Suspense, type CSSProperties } from "react";
import { cn } from "../../lib/style.ts";
import { TONES } from "../tones.ts";
import type { PanelProps } from "../types.ts";
import type { State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

const Chart = lazy(() => import("./Chart.tsx"));

/** The owner's numbers: up to four tiles, and one bar chart under them. */
export default function Panel({ config, state, still }: PanelProps<Config, State, Action>) {
  return (
    <div className="flex h-full flex-col gap-[0.7rem] p-[0.8rem]">
      <dl className="grid grid-cols-[repeat(var(--n),minmax(0,1fr))] gap-[0.6rem] @max-[30rem]:grid-cols-2" style={{ "--n": state.tiles.length } as CSSProperties}>
        {state.tiles.map((tile) => (
          <div key={tile.id} data-tile={tile.id} className="flex min-w-0 flex-col-reverse justify-end rounded-control border border-line px-[0.8rem] py-[0.6rem]">
            {/* A changed number gets a new key, so it mounts again and flashes. */}
            <dd key={tile.rev} className={cn("flex flex-col items-start rounded-control", tile.rev > 0 && "flash")}>
              <span className="text-big font-bold tabular-nums tracking-tight">{tile.value}</span>
              {/* The line is always there, so a tile keeps its height when a change arrives. */}
              <span className="flex h-[1.5rem] items-center">
                {tile.delta && <span className={cn("rounded-full px-[0.5rem] py-[0.05rem] text-meta font-medium", TONES[tile.tone ?? "idle"])}>{tile.delta}</span>}
              </span>
            </dd>
            <dt className="truncate text-meta text-muted">{tile.label}</dt>
          </div>
        ))}
      </dl>

      {config.chart && (
        <figure className="flex min-h-0 flex-1 flex-col gap-[0.3rem] rounded-control border border-line px-[0.8rem] pt-[0.6rem]">
          <figcaption className="text-meta font-semibold">{config.chart.title}</figcaption>
          <div className="min-h-0 flex-1" role="img" aria-label={`${config.chart.title}: ${state.points.map((p) => `${p.label} ${p.value}`).join(", ")}`}>
            {/* Until the chart arrives its place stays empty and keeps its size, so nothing moves when it lands. */}
            <Suspense fallback={<span data-loading hidden />}>
              <Chart points={state.points} pushes={state.pushes} still={still} />
            </Suspense>
          </div>
        </figure>
      )}
    </div>
  );
}
