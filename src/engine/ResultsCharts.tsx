import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip, TooltipContent } from "@/components/charts/tooltip";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { axisRoom } from "../lib/style.ts";
import type { Worked } from "./roi.ts";
import type { Lang, Roi } from "./types.ts";
import type { Words } from "./words.ts";

function Figure({ title, label, wide, children }: { title: string; label: string; wide?: boolean; children: ReactNode }) {
  return (
    <figure className="flex min-h-0 min-w-0 flex-col gap-[0.3rem] rounded-control border border-line px-[0.9rem] pt-[0.7rem] compact:h-[15rem] compact:flex-none" style={{ flex: wide ? 3 : 2 }}>
      <figcaption className="text-meta font-medium leading-tight">{title}</figcaption>
      <div className="min-h-0 flex-1" role="img" aria-label={label}>
        {children}
      </div>
    </figure>
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
 * The charts of the report. They follow the numbers: a changed one moves the marks, and nothing draws itself in again.
 */
export default function ResultsCharts(props: ChartsProps) {
  const { roi, worked, say, money, still } = props;
  const calm = useReducedMotion() === true || still;
  const months = worked.running.slice(1).map((total, i) => ({ label: String(i + 1), total }));

  return (
    <div className="flex min-h-[15rem] flex-1 gap-[1rem] compact:order-2 compact:flex-col">
      <Figure wide title={say.added(roi.cost?.once ? money(roi.cost.once) : undefined)} label={`${say.added()}: ${months.map((bar) => `${say.month(bar.label)} ${money(bar.total)}`).join(", ")}`}>
        <BarChart data={months} xDataKey="label" aspectRatio="auto" className="h-full" margin={{ top: 12, right: 4, bottom: axisRoom(), left: 4 }} barGap={0.3} animationDuration={700}>
          {/* Months spent earning the setup back hang under the line; the line is where it has paid for itself. */}
          <Grid horizontal numTicksRows={3} highlightRowValues={worked.running[0] < 0 ? [0] : undefined} />
          <Bar dataKey="total" fill="var(--chart-1)" lineCap={4} animate={!calm} />
          <BarXAxis showAllLabels />
          <ChartTooltip showDatePill={false} content={({ point }) => <TooltipContent title={say.month(String(point.label))} rows={[{ color: "var(--chart-1)", label: say.sum, value: money(Number(point.total)) }]} />} />
        </BarChart>
      </Figure>
      <Year {...props} calm={calm} />
    </div>
  );
}
