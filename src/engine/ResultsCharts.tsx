import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip, TooltipContent } from "@/components/charts/tooltip";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { axisRoom, cn } from "../lib/style.ts";
import type { Worked } from "./roi.ts";
import type { Roi } from "./types.ts";
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

/**
 * The two charts of the results slide. What comes in each month next to what it costs, and the first twelve months added up.
 * They follow the calculator: a changed number moves the bars, and nothing draws itself in again.
 */
export default function ResultsCharts({ roi, worked, say, money, still }: { roi: Roi; worked: Worked; say: Words; money: (value: number) => string; still: boolean }) {
  const calm = useReducedMotion() === true || still;
  // One bar per gain, and one for the monthly cost. Two series, so the cost can wear a quieter colour than what comes in.
  const each = [...worked.gains.map((gain) => ({ label: gain.label, gain: gain.monthly, cost: 0 })), ...(roi.cost?.monthly ? [{ label: say.cost, gain: 0, cost: roi.cost.monthly }] : [])];
  const months = worked.running.map((total, i) => ({ label: String(i + 1), total }));
  const margin = { top: 12, right: 4, bottom: axisRoom(), left: 4 };

  return (
    // Three bars or more need the whole width for their names, so the charts go under each other.
    <div className={cn("flex min-h-[15rem] flex-1 gap-[1rem] compact:order-2 compact:flex-col", each.length > 2 && "flex-col")}>
      {/* One bar says nothing a number does not say better. */}
      {each.length > 1 && (
        <Figure title={say.each} label={`${say.each}: ${each.map((bar) => `${bar.label} ${money(bar.gain + bar.cost)}`).join(", ")}`}>
          <BarChart data={each} xDataKey="label" aspectRatio="auto" className="h-full" margin={margin} barGap={0.35} stacked stackGap={0.01} animationDuration={700}>
            <Grid horizontal numTicksRows={3} />
            <Bar dataKey="gain" fill="var(--chart-1)" lineCap={4} animate={!calm} showValue valueLabelColor="var(--chart-on-1)" valueLabelFormatter={money} />
            <Bar dataKey="cost" fill="var(--color-muted)" lineCap={4} animate={!calm} showValue valueLabelColor="var(--color-window)" valueLabelFormatter={money} />
            <BarXAxis showAllLabels />
          </BarChart>
        </Figure>
      )}
      <Figure wide title={say.added(roi.cost?.once ? money(roi.cost.once) : undefined)} label={`${say.added()}: ${months.map((bar) => `${say.month(bar.label)} ${money(bar.total)}`).join(", ")}`}>
        <BarChart data={months} xDataKey="label" aspectRatio="auto" className="h-full" margin={margin} barGap={0.3} animationDuration={700}>
          {/* Months spent earning the setup back hang under the line; the line is where it has paid for itself. */}
          <Grid horizontal numTicksRows={3} highlightRowValues={worked.running[0] < 0 ? [0] : undefined} />
          <Bar dataKey="total" fill="var(--chart-1)" lineCap={4} animate={!calm} />
          <BarXAxis showAllLabels />
          <ChartTooltip showDatePill={false} content={({ point }) => <TooltipContent title={say.month(String(point.label))} rows={[{ color: "var(--chart-1)", label: say.sum, value: money(Number(point.total)) }]} />} />
        </BarChart>
      </Figure>
    </div>
  );
}
