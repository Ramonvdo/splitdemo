import { lazy, Suspense, type ReactNode } from "react";
import { cn } from "../lib/style.ts";
import { shown, sign, type Worked } from "./roi.ts";
import type { Demo, Roi, RoiInput } from "./types.ts";
import { words } from "./words.ts";

// The charts bring the chart library with them, so they load on their own.
const Charts = lazy(() => import("./ResultsCharts.tsx"));

/** One number the viewer can type over, with the sign or the % it is written with. */
export function Field({ input, roi, lang, label, large, lever, ...rest }: { input: RoiInput; roi: Roi; lang: Demo["lang"]; label: string; large?: boolean; lever?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span
      className={cn(
        "flex items-center gap-[0.35rem] rounded-control border bg-window text-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-tally",
        large ? "px-[1.1rem] text-huge" : "px-[0.6rem] text-lead",
        lever ? "border-tally" : "border-line",
      )}
    >
      {input.kind === "money" && <span className="text-muted">{sign(roi.currency, lang)}</span>}
      <input aria-label={label} inputMode="decimal" autoComplete="off" className={cn("w-full min-w-0 bg-transparent font-semibold tabular-nums outline-none selection:bg-tally/30", large ? "h-[4.4rem]" : "h-[2.3rem]")} {...rest} />
      {input.kind === "percent" && <span className="text-muted">%</span>}
    </span>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <span className="inline-block rounded-full border border-line bg-window px-[0.5rem] py-[0.05rem] text-meta font-medium text-muted">{children}</span>;
}

export interface ReportProps {
  demo: Demo;
  roi: Roi;
  /** What each field holds, as typed, and the lever's field with the system. */
  raw: Record<string, string>;
  lever: string;
  /** The numbers the sums use. */
  today: Record<string, number>;
  system: number;
  worked: Worked;
  /** The fields the viewer typed in; "lever" for the system's number. */
  touched: string[];
  /** The viewer gave numbers of their own, so the table is theirs. */
  theirs: boolean;
  still: boolean;
  onType: (id: string, text: string) => void;
  onLeave: (id: string) => void;
  /** Back to the questions, where there are any to go back to. */
  onChange?: () => void;
}

/**
 * The report on a light sheet, because the charts are drawn for a light window. Left: what came of the story and the numbers
 * the sums use, each one open to change. Right: what those numbers come to, and the charts.
 * On a phone the columns become one, in the order a thumb reads it: what came of it, what that is worth, the numbers that change it, the charts.
 * What came of it is a line per number there, so the first field is on the screen the slide opens on.
 */
export function Report({ demo, roi, raw, lever, today, system, worked, touched, theirs, still, onType, onLeave, onChange }: ReportProps) {
  const say = words(demo.lang);
  const money = (value: number) => shown(value, "money", roi.currency, demo.lang);
  const share = worked.point && roi.inputs.find((input) => input.id === worked.point!.id);
  const costs = say.costs(roi.cost?.once ? money(roi.cost.once) : undefined, roi.cost?.monthly ? money(roi.cost.monthly) : undefined);

  return (
    <div data-report className="grid min-h-full grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-[2rem] p-[1.8rem] compact:grid-cols-1 compact:gap-[1.3rem] compact:p-[1.1rem]">
      <div className="flex min-w-0 flex-col gap-[1.1rem] compact:contents">
        <p>
          <span className="rounded-full bg-tally px-[0.9rem] py-[0.25rem] text-lead font-semibold text-on-tally">{say.results}</span>
        </p>
        {/* Without a title of its own the slide starts at the numbers; the strip over the wall carries the demo's title. A phone's strip has no room for it, so there the slide says it. */}
        <h2 className={cn("text-balance text-huge font-semibold tracking-[-0.02em]", !demo.results?.title && "hidden compact:block")}>{demo.results?.title ?? demo.title}</h2>
        <dl className="flex flex-wrap gap-x-[2rem] gap-y-[1rem] compact:flex-col compact:flex-nowrap compact:gap-y-[0.35rem]" data-outcome>
          {demo.outcome.map((o, i) => (
            <div key={i} className="flex flex-col-reverse justify-end border-l-2 border-tally pl-[0.8rem] compact:flex-row-reverse compact:items-baseline compact:gap-x-[0.6rem]">
              <dt className="text-body leading-tight text-muted compact:min-w-0">
                {o.label}
                {o.was && (
                  <span className="block font-medium text-ink/75 compact:inline compact:before:content-[',_']">
                    {say.was} {o.was}
                  </span>
                )}
              </dt>
              <dd className="text-outcome font-bold tracking-tight compact:shrink-0 compact:text-big">{o.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto rounded-control bg-wash p-[1rem] compact:order-1 compact:mt-0">
          <table data-numbers className="w-full border-separate border-spacing-y-[0.45rem]">
            <caption className="mb-[0.4rem] text-left text-lead font-semibold">
              <span className="flex items-baseline justify-between gap-[1rem]">
                {theirs ? say.yours : say.example}
                {onChange && (
                  <button type="button" data-change onClick={onChange} className="rounded-control text-meta font-medium text-muted underline underline-offset-4">
                    {say.change}
                  </button>
                )}
              </span>
            </caption>
            <thead>
              <tr className="text-meta text-muted">
                <td />
                {/* On a phone the column is a third: an amount of five digits has to fit its field. */}
                <th scope="col" className="w-[26%] pb-[0.1rem] text-left font-medium compact:w-[33%]">
                  {say.today}
                </th>
                <th scope="col" className="w-[30%] pb-[0.1rem] pl-[0.6rem] text-left font-medium">
                  {say.system}
                </th>
              </tr>
            </thead>
            <tbody>
              {roi.inputs.map((input) => {
                const pulled = input.id === roi.lever.input;
                return (
                  <tr key={input.id}>
                    <th scope="row" className="pr-[0.6rem] text-left text-meta font-normal leading-tight text-muted">
                      {input.label}
                      {/* A number of ours says so under its name, with where it comes from. Typed over, it is theirs. */}
                      {!touched.includes(input.id) && (!input.ask || input.note) && (
                        <span className="mt-[0.2rem] block text-ink/60">
                          {!input.ask && <Tag>{say.estimate}</Tag>} {input.note}
                        </span>
                      )}
                    </th>
                    <td>
                      <Field input={input} roi={roi} lang={demo.lang} label={input.label} data-input={input.id} value={raw[input.id]} onChange={(e) => onType(input.id, e.target.value)} onBlur={() => onLeave(input.id)} />
                    </td>
                    <td className="pl-[0.6rem]">
                      {pulled ? (
                        // Where the column is too narrow for both, the tag goes under the field.
                        <span className="flex flex-wrap items-center gap-x-[0.4rem] gap-y-[0.2rem]">
                          <span className="min-w-[4.6rem] flex-1">
                            <Field input={input} roi={roi} lang={demo.lang} label={`${input.label}, ${say.system.toLowerCase()}`} lever data-lever value={lever} onChange={(e) => onType("lever", e.target.value)} onBlur={() => onLeave("lever")} />
                          </span>
                          {!touched.includes("lever") && <Tag>{say.estimate}</Tag>}
                        </span>
                      ) : (
                        // The system leaves this number as it is.
                        <span className="px-[0.6rem] text-lead text-muted">{shown(today[input.id], input.kind, roi.currency, demo.lang)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-[0.9rem] compact:contents">
        <div className="flex flex-wrap items-end gap-x-[2.4rem] gap-y-[0.8rem]">
          <p className="flex flex-col">
            <output data-monthly className="text-card font-bold tracking-[-0.03em]">
              {money(worked.effect)}
            </output>
            <span className="text-lead text-muted">{roi.label ?? (roi.saving ? say.saved : roi.monthly ? say.growing : say.monthly)}</span>
          </p>
          {roi.monthly ? (
            <p className="flex flex-col pb-[0.15rem]">
              <output data-by12 className="text-big font-semibold">
                {money(worked.months[11])}
              </output>
              <span className="text-body text-muted">{say.by12}</span>
            </p>
          ) : (
            roi.cost?.monthly !== undefined && (
              <p className="flex flex-col pb-[0.15rem]">
                <output data-net className="text-big font-semibold">
                  {money(worked.effect - roi.cost.monthly)}
                </output>
                <span className="text-body text-muted">{say.net(money(roi.cost.monthly))}</span>
              </p>
            )
          )}
          <p className="flex flex-col pb-[0.15rem]">
            <output data-year className="text-big font-semibold">
              {money(worked.year)}
            </output>
            <span className="text-body text-muted">{say.year(roi.cost !== undefined)}</span>
          </p>
        </div>
        {/* The lines keep their place when the numbers stop paying, so the charts under them do not jump. */}
        <div className="flex min-h-[1.5em] flex-wrap items-baseline gap-x-[1.4rem] gap-y-[0.2rem] text-lead">
          {worked.effect === 0 ? (
            <p data-nothing className="font-semibold">
              {say.nothing}
            </p>
          ) : (
            <>
              {/* The costs the year counts are named here, so the figures above can be checked against each other. */}
              {costs && (
                <p data-payback className="font-semibold">
                  {say.payback(costs, worked.payback)}
                </p>
              )}
              {/* On the lever the row is the one with the coloured field, so the sentence needs no name for it. */}
              {worked.point && share && (
                <p data-point className="text-muted">
                  {say.point(money(worked.point.year), share.id === roi.lever.input ? undefined : share.label)}
                </p>
              )}
            </>
          )}
        </div>
        <Suspense fallback={<span data-loading hidden />}>
          <Charts roi={roi} today={today} system={system} worked={worked} say={say} money={money} still={still} lang={demo.lang} />
        </Suspense>
      </div>
    </div>
  );
}
