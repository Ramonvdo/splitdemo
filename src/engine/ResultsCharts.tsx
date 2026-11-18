import { Band } from "@/components/charts/band";
import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { Line, LineChart } from "@/components/charts/line-chart";
import { StaticChartPreviewProvider } from "@/components/charts/static-chart-preview-context";
import { ChartTooltip, TooltipContent } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { curveLinear } from "d3-shape";
import { useReducedMotion } from "motion/react";
import { Fragment, type ReactNode } from "react";
import { axisRoom } from "../lib/style.ts";
import type { Worked } from "./roi.ts";
import type { Lang, Roi } from "./types.ts";
import type { Words } from "./words.ts";

function Figure({ title, label, wide, legend, children }: { title: string; label: string; wide?: boolean; legend?: ReactNode; children: ReactNode }) {
  return (
    <figure className="flex min-h-0 min-w-0 flex-col gap-[0.35rem] rounded-control border border-line px-[0.9rem] pt-[0.7rem] compact:h-[17rem] compact:flex-none" style={{ flex: wide ? 3 : 2 }}>
      <figcaption className="text-meta font-medium leading-tight">{title}</figcaption>
      {legend}
      <div className="min-h-0 flex-1" role="img" aria-label={label}>
        {children}
      </div>
    </figure>
  );
}

interface End {
  label: string;
  value: string;
  stroke: string;
  dashed?: boolean;
}

/** What each line is and where it ends. The words stay in the text's own colours; the stroke beside them says which line. */
function Legend({ ends }: { ends: End[] }) {
  return (
    <ul data-legend className="flex flex-wrap gap-x-[1rem] gap-y-[0.1rem] text-meta text-muted">
      {ends.map((end) => (
        <li key={end.label} className="flex items-center gap-[0.35rem] whitespace-nowrap">
          <svg aria-hidden width="18" height="6" className="shrink-0">
            <line x1="1" y1="3" x2="17" y2="3" stroke={end.stroke} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={end.dashed ? "4 4" : undefined} />
          </svg>
          {end.label} <b className="font-semibold text-ink">{end.value}</b>
        </li>
      ))}
    </ul>
  );
}

export interface ChartsProps {
  roi: Roi;
  today: Record<string, number>;
  system: number;
  worked: Worked;
  say: Words;
  money: (value: number) => string;
  still: boolean;
  lang?: Lang;
}

/** A year as the business works today next to a year with the system, and what the system costs in that year. */
function Year({ roi, worked, say, money, calm }: ChartsProps & { calm: boolean }) {
  // What a month comes to counts twelve times in a year, or with `monthly` 1 + 2 + ... + 12 times.
  const months = roi.monthly ? 78 : 12;
  const cost = (roi.cost?.monthly ?? 0) * 12 + (roi.cost?.once ?? 0);
  // One series per bar, so each wears its own colour: today in grey, the system in the demo's accent, the cost outlined.
  const bars = [
    { label: say.today, today: worked.before * months, system: 0, cost: 0 },
    { label: say.system, today: 0, system: worked.after * months, cost: 0 },
    ...(cost ? [{ label: say.cost, today: 0, system: 0, cost }] : []),
  ];
  const title = say.yearly(roi.saving === true);
  return (
    <Figure title={title} label={`${title}: ${bars.map((bar) => `${bar.label} ${money(bar.today + bar.system + bar.cost)}`).join(", ")}`}>
      <BarChart data={bars} xDataKey="label" aspectRatio="auto" className="h-full" margin={{ top: 12, right: 4, bottom: axisRoom(), left: 4 }} barGap={0.35} stacked stackGap={0.01} animationDuration={700}>
        <Grid horizontal numTicksRows={3} />
        <Bar dataKey="today" fill="var(--color-muted)" lineCap={4} animate={!calm} showValue valueLabelColor="var(--color-window)" valueLabelFormatter={money} />
        <Bar dataKey="system" fill="var(--chart-1)" lineCap={4} animate={!calm} showValue valueLabelColor="var(--chart-on-1)" valueLabelFormatter={money} />
        <Bar dataKey="cost" fill="var(--color-line)" lineCap={4} animate={!calm} showValue valueLabelColor="var(--color-ink)" valueLabelFormatter={money} />
        <BarXAxis showAllLabels />
      </BarChart>
    </Figure>
  );
}

/**
 * What the system adds, month by month, after what it costs. Carrying on as today is the flat line at nothing: on two rising
 * totals the setup and the month it is earned back would vanish, and a saving would run the other way up.
 */
function Months({ roi, worked, say, money, calm }: ChartsProps & { calm: boolean }) {
  const rows = worked.running.map((system, month) => ({ month, system, half: worked.cautious[month], today: 0 }));
  const title = say.added(roi.saving === true, roi.cost !== undefined);
  const ends: End[] = [
    { label: say.system, value: money(worked.year), stroke: "var(--chart-1)" },
    { label: say.half, value: money(worked.cautious[12]), stroke: "var(--chart-1)", dashed: true },
    { label: say.carry, value: money(0), stroke: "var(--color-muted)" },
  ];
  return (
    <Figure wide title={title} legend={<Legend ends={ends} />} label={`${title}: ${ends.map((end) => `${end.label} ${end.value}`).join(", ")}`}>
      <LineChart data={rows} xDataKey="month" aspectRatio="auto" className="h-full" margin={{ top: 10, right: 10, bottom: axisRoom(), left: 10 }} animationDuration={calm ? 0 : 700} yDomainTween={!calm}>
        <Grid horizontal numTicksRows={3} />
        {/* Between the lines: grey while the setup is still being earned back, the accent from the month it has paid for itself. */}
        <Band upperKey="system" lowerKey="today" curve={curveLinear} fill="var(--chart-1)" negativeFill="var(--color-muted)" fillOpacity={0.14} upperStroke={false} lowerStroke={false} showInTooltip={false} />
        <Line dataKey="today" stroke="var(--color-muted)" strokeWidth={2} curve={curveLinear} animate={!calm} fadeEdges={false} showHighlight={false} />
        <Line dataKey="half" stroke="var(--chart-1)" strokeWidth={2} curve={curveLinear} animate={!calm} fadeEdges={false} showHighlight={false} dashFromIndex={0} dashArray="4,4" />
        <Line dataKey="system" stroke="var(--chart-1)" curve={curveLinear} animate={!calm} fadeEdges={false} showHighlight={false} />
        <XAxis numTicks={7} labels={rows.map((row) => String(row.month))} />
        <ChartTooltip
          showDatePill={false}
          content={({ point }) => (
            <TooltipContent
              title={say.month(String(point.month))}
              rows={[
                { color: "var(--chart-1)", label: say.system, value: money(Number(point.system)) },
                { color: "var(--chart-1)", label: say.half, value: money(Number(point.half)) },
                { color: "var(--color-muted)", label: say.carry, value: money(0) },
              ]}
            />
          )}
        />
      </LineChart>
    </Figure>
  );
}

/**
 * The charts of the report. They follow the numbers: a changed one moves the marks, and nothing draws itself in again.
 * A picture or a viewer who asked for less motion gets them as they end.
 */
export default function ResultsCharts(props: ChartsProps) {
  const calm = useReducedMotion() === true || props.still;
  const Still = calm ? StaticChartPreviewProvider : Fragment;
  return (
    <div className="flex min-h-[15rem] flex-1 gap-[1rem] compact:order-2 compact:flex-col">
      <Still>
        <Months {...props} calm={calm} />
        <Year {...props} calm={calm} />
      </Still>
    </div>
  );
}
