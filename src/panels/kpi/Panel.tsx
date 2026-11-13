import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { useReducedMotion } from "motion/react";
import { cn } from "../../lib/style.ts";
import { TONES } from "../tones.ts";
import type { PanelProps } from "../types.ts";
import type { State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

/** The owner's numbers: up to four tiles, and one bar chart under them. */
export default function Panel({ config, state, still }: PanelProps<Config, State, Action>) {
  const calm = useReducedMotion() === true || still === true;
  return (
    <div className="flex h-full flex-col gap-[0.7rem] p-[0.8rem]">
      <dl className="grid gap-[0.6rem]" style={{ gridTemplateColumns: `repeat(${state.tiles.length}, minmax(0, 1fr))` }}>
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
            {/* A push draws the bars in again: that is how the viewer sees the chart change. */}
            <BarChart data={state.points} xDataKey="label" aspectRatio="auto" className="h-full" margin={{ top: 22, right: 4, bottom: 30, left: 4 }} barGap={0.4} animationDuration={700} revealSignature={String(state.pushes)}>
              <Grid horizontal numTicksRows={3} />
              <Bar dataKey="value" fill="var(--chart-1)" lineCap={4} animate={!calm} showValue valueLabelColor="var(--color-on-tally)" />
              <BarXAxis showAllLabels />
            </BarChart>
          </div>
        </figure>
      )}
    </div>
  );
}
