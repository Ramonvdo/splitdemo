import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { useReducedMotion } from "motion/react";
import type { State } from "./reduce.ts";

/**
 * The bar chart, in a file of its own so it loads on its own: it brings the chart library with it,
 * and a demo's first picture should not wait for that.
 */
export default function Chart({ points, pushes, still }: { points: State["points"]; pushes: number; still?: boolean }) {
  const calm = useReducedMotion() === true || still === true;
  return (
    // A push draws the bars in again: that is how the viewer sees the chart change.
    <BarChart data={points} xDataKey="label" aspectRatio="auto" className="h-full" margin={{ top: 22, right: 4, bottom: 30, left: 4 }} barGap={0.4} animationDuration={700} revealSignature={String(pushes)}>
      <Grid horizontal numTicksRows={3} />
      <Bar dataKey="value" fill="var(--chart-1)" lineCap={4} animate={!calm} showValue valueLabelColor="var(--color-on-tally)" />
      <BarXAxis showAllLabels />
    </BarChart>
  );
}
