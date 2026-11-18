import { lazy, Suspense, useState } from "react";
import { cn } from "../lib/style.ts";
import { clamp, field, shown, sign, typed, work } from "./roi.ts";
import type { Demo } from "./types.ts";
import { words } from "./words.ts";

// The charts bring the chart library with them, so they load on their own.
const Charts = lazy(() => import("./ResultsCharts.tsx"));

/**
 * The slide after the story: what came of it, why that matters, and a calculator the viewer fills in with their own numbers.
 * It lies over the wall like a card does. With a calculator it is a light sheet, because the charts are drawn for a light window.
 * Without one it is a card like the ones before each step, with the numbers as large as a step's text.
 * On a phone the two columns become one, in the order a thumb reads it: what came of it, what that is worth, the fields that change it, the charts.
 */
export function Results({ demo, still }: { demo: Demo; still: boolean }) {
  const say = words(demo.lang);
  const roi = demo.results?.roi;
  // A field holds what was typed, as typed. The sums use the number it comes to, kept within the field's limits.
  const [raw, setRaw] = useState<Record<string, string>>(() => Object.fromEntries((roi?.inputs ?? []).map((input) => [input.id, field(input.value, demo.lang)])));
  const values = Object.fromEntries((roi?.inputs ?? []).map((input) => [input.id, clamp(input, typed(raw[input.id], demo.lang))]));
  const worked = roi && work(roi, values);
  const money = (value: number) => shown(value, "money", roi?.currency ?? "USD", demo.lang);

  return (
    <section data-results aria-label={say.results} className={cn("absolute inset-0 z-[2] animate-fade overflow-y-auto", roi ? "rounded-monitor bg-window text-ink" : "bg-stage")}>
      <div className={cn("grid min-h-full gap-[2.2rem] p-[2rem] compact:grid-cols-1 compact:gap-[1.4rem] compact:p-[1.1rem]", roi ? "grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" : "mx-auto max-w-[60rem] content-center")}>
        <div className={cn("flex min-w-0 flex-col", roi ? "gap-[1.3rem] compact:contents" : "gap-[1.8rem]")}>
          <p>
            <span className="rounded-full bg-tally px-[0.9rem] py-[0.25rem] text-lead font-semibold text-on-tally">{say.results}</span>
          </p>
          {/* Without a title of its own the slide starts at the numbers; the strip over the wall carries the demo's title. A phone's strip has no room for it, so there the slide says it. */}
          <h2 className={cn("text-balance text-huge font-semibold tracking-[-0.02em]", !demo.results?.title && "hidden compact:block")}>{demo.results?.title ?? demo.title}</h2>
          <dl className={cn("flex flex-wrap gap-y-[1rem]", roi ? "gap-x-[2rem]" : "gap-x-[3.4rem] gap-y-[1.6rem]")} data-outcome>
            {demo.outcome.map((o, i) => (
              <div key={i} className="flex flex-col-reverse justify-end border-l-2 border-tally pl-[0.8rem]">
                <dt className={cn("leading-tight", roi ? "text-body text-muted" : "pt-[0.5rem] text-lead text-stage-muted")}>
                  {o.label}
                  {o.was && (
                    <span className={cn("block font-medium", roi ? "text-ink/75" : "text-stage-ink/75")}>
                      {say.was} {o.was}
                    </span>
                  )}
                </dt>
                <dd className={cn("font-bold", roi ? "text-outcome tracking-tight" : "text-card tracking-[-0.03em] compact:text-huge")}>{o.value}</dd>
              </div>
            ))}
          </dl>
          {demo.results?.text && <p className={cn("max-w-[40rem] text-pretty text-lead", roi ? "text-muted" : "text-stage-muted")}>{demo.results.text}</p>}

          {roi && (
            <fieldset className="mt-auto rounded-control bg-wash p-[1.1rem] compact:order-1 compact:mt-0">
              <legend className="float-left mb-[0.9rem] w-full text-lead font-semibold">{say.numbers}</legend>
              <div className="clear-both grid grid-cols-2 gap-[0.9rem]">
                {roi.inputs.map((input) => (
                  <label key={input.id} className="flex min-w-0 flex-col justify-between gap-[0.35rem]">
                    <span className="text-meta leading-tight text-muted">{input.label}</span>
                    <span className="flex items-center gap-[0.35rem] rounded-control border border-line bg-window px-[0.75rem] text-lead has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-tally">
                      {input.kind === "money" && <span className="text-muted">{sign(roi.currency, demo.lang)}</span>}
                      <input
                        data-input={input.id}
                        inputMode="decimal"
                        autoComplete="off"
                        value={raw[input.id]}
                        onChange={(e) => setRaw({ ...raw, [input.id]: e.target.value })}
                        // Leaving the field shows the number the sums are using.
                        onBlur={() => setRaw({ ...raw, [input.id]: field(values[input.id], demo.lang) })}
                        className="h-[2.7rem] w-full min-w-0 bg-transparent font-semibold tabular-nums outline-none"
                      />
                      {input.kind === "percent" && <span className="text-muted">%</span>}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>

        {roi && worked && (
          <div className="flex min-w-0 flex-col gap-[1.2rem] compact:contents">
            <div className="flex flex-wrap items-end gap-x-[2.4rem] gap-y-[0.8rem]">
              <p className="flex flex-col">
                <output data-monthly className="text-card font-bold tracking-[-0.03em]">
                  {money(worked.monthly)}
                </output>
                <span className="text-lead text-muted">{roi.label ?? say.monthly}</span>
              </p>
              {roi.cost?.monthly !== undefined && (
                <p className="flex flex-col pb-[0.15rem]">
                  <output data-net className="text-big font-semibold">
                    {money(worked.net)}
                  </output>
                  <span className="text-body text-muted">{say.net(money(roi.cost.monthly))}</span>
                </p>
              )}
              <p className="flex flex-col pb-[0.15rem]">
                <output data-year className="text-big font-semibold">
                  {money(worked.year)}
                </output>
                <span className="text-body text-muted">{say.year}</span>
              </p>
            </div>
            {/* The line keeps its place when the numbers stop paying, so the charts under it do not jump. */}
            {roi.cost && (
              <p data-payback className="min-h-[1.5em] text-lead font-semibold">
                {worked.payback && say.payback(worked.payback)}
              </p>
            )}
            <Suspense fallback={<span data-loading hidden />}>
              <Charts roi={roi} worked={worked} say={say} money={money} still={still} />
            </Suspense>
          </div>
        )}
      </div>
    </section>
  );
}
