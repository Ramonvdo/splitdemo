import { useEffect, useState, type ReactNode } from "react";
import { clamp, field, target, typed, work } from "./roi.ts";
import { Report } from "./ResultsReport.tsx";
import type { Demo, Roi } from "./types.ts";
import { words } from "./words.ts";

/** Where the viewer is on the slide: the card that closes the story, a question (counted from 0), or the report. */
export type Step = "intro" | "report" | number;

interface Answers {
  /** What each field holds, as typed. */
  raw: Record<string, string>;
  /** The lever's number with the system, once the viewer typed one. */
  lever?: string;
  /** The fields the viewer typed in; "lever" for the system's number. */
  touched: string[];
  step: Step;
}

/** What a viewer answered stays for the visit: the slide comes and goes with the story, and their numbers should not. */
const kept = new WeakMap<Roi, Answers>();

/** The card that closes the story: what came of it, on the dark of the stage like the cards before each step. */
function Closing({ demo, children }: { demo: Demo; children?: ReactNode }) {
  const say = words(demo.lang);
  return (
    <div className="mx-auto grid min-h-full max-w-[60rem] content-center gap-[1.8rem] p-[2rem] compact:gap-[1.4rem] compact:p-[1.1rem]">
      <p>
        <span className="rounded-full bg-tally px-[0.9rem] py-[0.25rem] text-lead font-semibold text-on-tally">{say.results}</span>
      </p>
      {/* Without a title of its own the slide starts at the numbers; the strip over the wall carries the demo's title. A phone's strip has no room for it, so there the slide says it. */}
      <h2 className={demo.results?.title ? "text-balance text-huge font-semibold tracking-[-0.02em]" : "hidden text-balance text-huge font-semibold tracking-[-0.02em] compact:block"}>{demo.results?.title ?? demo.title}</h2>
      <dl className="flex flex-wrap gap-x-[3.4rem] gap-y-[1.6rem]" data-outcome>
        {demo.outcome.map((o, i) => (
          <div key={i} className="flex flex-col-reverse justify-end border-l-2 border-tally pl-[0.8rem]">
            <dt className="pt-[0.5rem] text-lead leading-tight text-stage-muted">
              {o.label}
              {o.was && (
                <span className="block font-medium text-stage-ink/75">
                  {say.was} {o.was}
                </span>
              )}
            </dt>
            <dd className="text-card font-bold tracking-[-0.03em] compact:text-huge">{o.value}</dd>
          </div>
        ))}
      </dl>
      {demo.results?.text && <p className="max-w-[40rem] text-pretty text-lead text-stage-muted">{demo.results.text}</p>}
      {children}
    </div>
  );
}

function Calculator({ demo, roi, still, ask, open }: { demo: Demo; roi: Roi; still: boolean; ask: boolean; open?: Step }) {
  const lang = demo.lang;
  const [answers, setAnswers] = useState<Answers>(
    () => kept.get(roi) ?? { raw: Object.fromEntries(roi.inputs.map((input) => [input.id, field(input.value, lang)])), touched: [], step: open ?? (ask ? "intro" : "report") },
  );
  useEffect(() => {
    kept.set(roi, answers);
  }, [roi, answers]);

  // A field holds what was typed, as typed. The sums use the number it comes to, kept within the field's limits.
  const pulled = roi.inputs.find((input) => input.id === roi.lever.input)!;
  const reach = roi.lever.to ?? pulled.value + (roi.lever.add ?? 0);
  const today = Object.fromEntries(roi.inputs.map((input) => [input.id, clamp(input, typed(answers.raw[input.id], lang), input === pulled ? reach : undefined)]));
  // Until the viewer sets the system's number themselves, it follows what they do today.
  const system = answers.lever === undefined ? target(roi, today) : clamp(pulled, typed(answers.lever, lang), reach);
  const worked = work(roi, today, system);

  const onType = (id: string, text: string) =>
    setAnswers((was) => ({ ...was, ...(id === "lever" ? { lever: text } : { raw: { ...was.raw, [id]: text } }), touched: was.touched.includes(id) ? was.touched : [...was.touched, id] }));
  // Leaving a field shows the number the sums are using.
  const onLeave = (id: string) => setAnswers((was) => (id === "lever" ? (was.lever === undefined ? was : { ...was, lever: field(system, lang) }) : { ...was, raw: { ...was.raw, [id]: field(today[id], lang) } }));

  return (
    <Report
      demo={demo}
      roi={roi}
      raw={answers.raw}
      lever={answers.lever ?? field(system, lang)}
      today={today}
      system={system}
      worked={worked}
      touched={answers.touched}
      theirs={answers.touched.length > 0}
      still={still}
      onType={onType}
      onLeave={onLeave}
    />
  );
}

/**
 * The slide after the story. It lies over the wall like a card does. A demo without a calculator ends on what came of it.
 * With one, the viewer is asked for their own numbers and gets a report worked out on them; a film or a picture has nobody
 * to ask (`ask` is off), so it shows the report on the demo's example numbers.
 */
export function Results({ demo, still, ask, open }: { demo: Demo; still: boolean; ask: boolean; open?: Step }) {
  const roi = demo.results?.roi;
  return (
    <section data-results aria-label={words(demo.lang).results} className={roi ? "absolute inset-0 z-[2] animate-fade overflow-y-auto rounded-monitor bg-window text-ink" : "absolute inset-0 z-[2] animate-fade overflow-y-auto bg-stage"}>
      {roi ? <Calculator demo={demo} roi={roi} still={still} ask={ask} open={open} /> : <Closing demo={demo} />}
    </section>
  );
}
