import { Band } from "@/components/charts/band";
import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { FunnelChart } from "@/components/charts/funnel-chart";
import { Grid } from "@/components/charts/grid";
import { Line, LineChart } from "@/components/charts/line-chart";
import { StaticChartPreviewProvider } from "@/components/charts/static-chart-preview-context";
import { ChartTooltip, TooltipContent } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { curveLinear } from "d3-shape";
import { MotionGlobalConfig, useReducedMotion } from "motion/react";
import { Fragment, useEffect, type ReactNode } from "react";
import { axisRoom } from "../lib/style.ts";
import { shown, stages, type Stages, type Worked } from "./roi.ts";
import type { Lang, Roi } from "./types.ts";
import type { Words } from "./words.ts";

function Figure({ title, label, wide, legend, children }: { title: string; label: string; wide?: boolean; legend?: ReactNode; children: ReactNode }) {
  return (
    <figure className={`flex min-h-0 min-w-0 flex-col gap-[0.35rem] rounded-control border border-line px-[0.9rem] pt-[0.7rem] compact:h-[19rem] compact:flex-none ${wide ? "flex-[3]" : "flex-[2]"}`}>
      <figcaption className="text-meta font-medium leading-tight">{title}</figcaption>
      {legend}
      <div className="min-h-0 flex-1" role="img" aria-label={label}>
        {children}
      </div>
    </figure>
  );
}

interface Mark {
  stroke: string;
  dashed?: boolean;
  /** A bar or a funnel, not a line. */
  block?: boolean;
}

/** The mark a word stands beside: the word stays in the text's own colour, the mark says which line, bar or funnel. */
function Swatch({ stroke, dashed, block }: Mark) {
  if (block)
    return (
      <svg aria-hidden width="10" height="10" className="shrink-0">
        <rect width="10" height="10" rx="2.5" fill={stroke} />
      </svg>
    );
  return (
    <svg aria-hidden width="18" height="6" className="shrink-0">
      <line x1="1" y1="3" x2="17" y2="3" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={dashed ? "4 4" : undefined} />
    </svg>
  );
}

interface End extends Mark {
  label: string;
  value: string;
}

/** What each mark is and what it comes to. */
function Legend({ ends }: { ends: End[] }) {
  return (
    <ul data-legend className="flex flex-wrap gap-x-[1rem] gap-y-[0.1rem] text-meta text-muted">
      {ends.map((end) => (
        <li key={end.label} className="flex items-center gap-[0.35rem] whitespace-nowrap">
          <Swatch {...end} />
          {end.label} <b className="font-semibold text-ink">{end.value}</b>
        </li>
      ))}
    </ul>
  );
}

/** What the system costs: a lighter grey than today's bar, so the two greys are told apart by how dark they are. */
const COST = "var(--color-stage-muted)";

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

/**
 * A year as the business works today next to a year with the system, and what the system costs in that year.
 * The legend names the bars and says what each comes to: three axis labels do not fit under bars this narrow.
 */
function Year({ roi, worked, say, money, calm }: ChartsProps & { calm: boolean }) {
  // What a month comes to counts twelve times in a year, or with `monthly` 1 + 2 + ... + 12 times.
  const months = roi.monthly ? 78 : 12;
  const cost = (roi.cost?.monthly ?? 0) * 12 + (roi.cost?.once ?? 0);
  // One series per bar, so each wears its own colour: today in grey, the system in the demo's accent, the cost in a lighter grey.
  const bars = [
    { label: say.today, today: worked.before * months, system: 0, cost: 0 },
    { label: say.system, today: 0, system: worked.after * months, cost: 0 },
    ...(cost ? [{ label: say.cost, today: 0, system: 0, cost }] : []),
  ];
  const ends: End[] = [
    { label: say.today, value: money(bars[0].today), stroke: "var(--color-muted)", block: true },
    { label: say.system, value: money(bars[1].system), stroke: "var(--chart-1)", block: true },
    ...(cost ? [{ label: say.cost, value: money(cost), stroke: COST, block: true }] : []),
  ];
  const title = say.yearly(roi.saving === true);
  return (
    <Figure title={title} legend={<Legend ends={ends} />} label={`${title}: ${ends.map((end) => `${end.label} ${end.value}`).join(", ")}`}>
      <BarChart data={bars} xDataKey="label" aspectRatio="auto" className="h-full" margin={{ top: 8, right: 4, bottom: 10, left: 4 }} barGap={0.3} stacked stackGap={0.01} animationDuration={700}>
        <Grid horizontal numTicksRows={3} />
        <Bar dataKey="today" fill="var(--color-muted)" lineCap={4} animate={!calm} />
        <Bar dataKey="system" fill="var(--chart-1)" lineCap={4} animate={!calm} />
        <Bar dataKey="cost" fill={COST} lineCap={4} animate={!calm} />
      </BarChart>
    </Figure>
  );
}

/** Whole things in a year. Less than one is not none. */
function count(n: number, roi: Roi, lang?: Lang) {
  return n > 0 && n < 1 ? "<1" : shown(Math.round(n), undefined, roi.currency, lang);
}

/** The funnel's own gap between two stages. The rows of counts under it keep the same columns. */
const GAP = 4;

function Cells({ of, className, ...rest }: { of: string[]; className?: string; "data-before"?: true }) {
  return (
    <ul {...rest} className={`grid text-center text-meta leading-tight ${className ?? "text-muted"}`} style={{ gridTemplateColumns: `repeat(${of.length}, minmax(0, 1fr))`, gap: GAP }}>
      {of.map((cell, i) => (
        <li key={i} className="truncate">
          {cell}
        </li>
      ))}
    </ul>
  );
}

/** One funnel: whose it is, the shape with each stage's share of the first, and the count under every stage. */
function Half({ name, color, counts, before, calm }: { name: string; color: string; counts: { label: string; value: number; shown: string }[]; before?: string[]; calm: boolean }) {
  return (
    <div data-funnel className="flex min-h-0 flex-1 flex-col gap-[0.1rem]">
      <p className="flex items-center gap-[0.35rem] text-meta text-muted">
        <Swatch block stroke={color} />
        {name}
      </p>
      <div className="min-h-0 flex-1">
        <FunnelChart
          data={counts}
          color={color}
          gap={GAP}
          showValues={false}
          showLabels={false}
          style={{ aspectRatio: "auto", height: "100%" }}
          staggerDelay={calm ? 0 : 0.12}
          enterTransition={calm ? { duration: 0 } : undefined}
        />
      </div>
      <Cells of={counts.map((stage) => stage.shown)} className="font-semibold text-ink" />
      {before && <Cells data-before of={before} />}
    </div>
  );
}

/**
 * The chain as a funnel, counted over a year. Where today and the system start from the same count the two are drawn one
 * over the other, so the stage that widens shows. Where the system changes how much goes in, its funnel is drawn alone with
 * today's count under each stage: on one scale today's would be a sliver.
 */
function Funnel({ roi, say, lang, funnel, calm }: ChartsProps & { funnel: Stages; calm: boolean }) {
  const { drawn, lead, pair } = funnel;
  const say1 = (n: number) => count(n, roi, lang);
  const title = say.funnel(drawn[0].name.toLowerCase(), drawn[drawn.length - 1].name.toLowerCase());
  const line = (name: string, pick: "today" | "after") => `${name}: ${drawn.map((stage) => `${stage.name} ${say1(stage[pick])}`).join(", ")}.`;
  const sides = pair ? [line(say.today, "today"), line(say.system, "after")] : [line(say.system, "after"), line(say.today, "today")];
  const side = (pick: "today" | "after") => drawn.map((stage) => ({ label: stage.name, value: stage[pick], shown: say1(stage[pick]) }));
  return (
    <Figure
      title={title}
      label={`${title}. ${sides.join(" ")}`}
      legend={
        lead.length > 0 && (
          <p data-lead className="text-meta text-muted">
            {lead.map((stage) => say.lead(stage.name, say1(stage.after), say1(stage.today))).join("; ")}
          </p>
        )
      }
    >
      <div className="flex h-full flex-col gap-[0.3rem] pb-[0.6rem]">
        {pair && <Half name={say.today} color="var(--color-muted)" counts={side("today")} calm={calm} />}
        <Half name={say.system} color="var(--chart-1)" counts={side("after")} before={pair ? undefined : drawn.map((stage) => say.formerly(say1(stage.today)))} calm={calm} />
        <Cells of={drawn.map((stage) => stage.name)} />
      </div>
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
  const funnel = stages(props.roi, props.today, props.system);
  // The funnel fades its shares in on a clock of its own with no switch. Motion's skip is the one that reaches it.
  MotionGlobalConfig.skipAnimations = calm;
  useEffect(
    () => () => {
      MotionGlobalConfig.skipAnimations = false;
    },
    [],
  );
  return (
    <div className="flex min-h-[15rem] flex-1 gap-[1rem] compact:order-2 compact:flex-col">
      <Still>
        <Months {...props} calm={calm} />
        {funnel ? <Funnel {...props} funnel={funnel} calm={calm} /> : <Year {...props} calm={calm} />}
      </Still>
    </div>
  );
}
