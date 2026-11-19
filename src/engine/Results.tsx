import { useEffect, useState, type ReactNode } from "react";
import { clamp, field, target, typed, work } from "./roi.ts";
import { Field, Report } from "./ResultsReport.tsx";
import type { Demo, Roi, RoiInput } from "./types.ts";
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
  /** They went through the questions to the end, so the numbers are theirs even where they left our estimate. */
  answered?: boolean;
  /** The viewer did something here. A slide nobody touched is not worth remembering. */
  own?: boolean;
}

const PRIMARY = "rounded-control bg-tally px-[1.3rem] py-[0.7rem] text-lead font-semibold text-on-tally";
const QUIET = "rounded-control border border-stage-line px-[1.3rem] py-[0.7rem] text-lead font-medium text-stage-ink";

/** The slide itself. It lies over the wall like a card does: dark for the card and the questions, a light sheet for the report. */
function Slide({ demo, light, children }: { demo: Demo; light?: boolean; children: ReactNode }) {
  return (
    <section data-results aria-label={words(demo.lang).results} className={light ? "absolute inset-0 z-[2] animate-fade overflow-y-auto rounded-monitor bg-window text-ink" : "absolute inset-0 z-[2] animate-fade overflow-y-auto bg-stage"}>
      {children}
    </section>
  );
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

/** One question on the dark of the stage, like the cards of the story. The field holds our estimate until they type their own. */
function Question({ demo, roi, input, n, of, value, onType, onLeave, onBack, onNext }: { demo: Demo; roi: Roi; input: RoiInput; n: number; of: number; value: string; onType: (text: string) => void; onLeave: () => void; onBack: () => void; onNext: () => void }) {
  const say = words(demo.lang);
  return (
    <form
      data-question={input.id}
      className="mx-auto grid min-h-full max-w-[60rem] animate-fade content-center gap-[1.5rem] p-[2rem] compact:gap-[1.2rem] compact:p-[1.1rem]"
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <p className="text-lead font-medium text-stage-muted">{say.of(n + 1, of)}</p>
      <h2 className="max-w-[42rem] text-balance text-huge font-semibold tracking-[-0.02em]">{input.ask}</h2>
      {/* Typing takes the estimate's place: nobody should have to clear the field first. */}
      <div className="max-w-[20rem]">
        <Field input={input} roi={roi} lang={demo.lang} label={input.ask!} large autoFocus onFocus={(e) => e.currentTarget.select()} value={value} onChange={(e) => onType(e.target.value)} onBlur={onLeave} />
      </div>
      <p className="text-lead text-stage-muted">
        {input.note && <span className="block">{input.note}</span>}
        {say.unsure}
      </p>
      <p className="flex flex-wrap gap-[0.7rem]">
        <button type="button" className={QUIET} onClick={onBack}>
          {say.previous}
        </button>
        <button type="submit" className={PRIMARY}>
          {n === of - 1 ? say.see : say.next}
        </button>
      </p>
    </form>
  );
}

function Calculator({ demo, roi, still, ask, open }: { demo: Demo; roi: Roi; still: boolean; ask: boolean; open?: Step }) {
  const lang = demo.lang;
  const say = words(lang);
  const [answers, setAnswers] = useState<Answers>(
    () => kept.get(roi) ?? { raw: Object.fromEntries(roi.inputs.map((input) => [input.id, field(input.value, lang)])), touched: [], step: open ?? (ask ? "intro" : "report") },
  );
  useEffect(() => {
    if (answers.own) kept.set(roi, answers);
  }, [roi, answers]);

  // A field holds what was typed, as typed. The sums use the number it comes to, kept within the field's limits.
  const pulled = roi.inputs.find((input) => input.id === roi.lever.input)!;
  const reach = roi.lever.to ?? pulled.value + (roi.lever.add ?? 0);
  const today = Object.fromEntries(roi.inputs.map((input) => [input.id, clamp(input, typed(answers.raw[input.id], lang), input === pulled ? reach : undefined)]));
  // Until the viewer sets the system's number themselves, it follows what they do today.
  const system = answers.lever === undefined ? target(roi, today) : clamp(pulled, typed(answers.lever, lang), reach);
  const worked = work(roi, today, system);

  const onType = (id: string, text: string) =>
    setAnswers((was) => ({ ...was, own: true, ...(id === "lever" ? { lever: text } : { raw: { ...was.raw, [id]: text } }), touched: was.touched.includes(id) ? was.touched : [...was.touched, id] }));
  // Leaving a field shows the number the sums are using.
  const onLeave = (id: string) => setAnswers((was) => (id === "lever" ? (was.lever === undefined ? was : { ...was, lever: field(system, lang) }) : { ...was, raw: { ...was.raw, [id]: field(today[id], lang) } }));

  // Only what an owner knows offhand is asked. The rest are our estimates, open to change on the report.
  const asked = roi.inputs.filter((input) => input.ask);
  const step = typeof answers.step === "number" && answers.step >= asked.length ? "report" : answers.step;
  const go = (to: Step) => setAnswers((was) => ({ ...was, own: true, step: to, answered: was.answered || to === "report" }));

  if (step === "intro")
    return (
      <Slide demo={demo}>
        <Closing demo={demo}>
          <p>
            <button type="button" data-work className={PRIMARY} onClick={() => go(0)}>
              {say.work}
            </button>
          </p>
        </Closing>
      </Slide>
    );
  if (step !== "report") {
    const input = asked[step];
    return (
      <Slide demo={demo}>
        <Question
          key={input.id}
          demo={demo}
          roi={roi}
          input={input}
          n={step}
          of={asked.length}
          value={answers.raw[input.id]}
          onType={(text) => onType(input.id, text)}
          onLeave={() => onLeave(input.id)}
          onBack={() => go(step === 0 ? "intro" : step - 1)}
          onNext={() => go(step === asked.length - 1 ? "report" : step + 1)}
        />
      </Slide>
    );
  }
  return (
    <Slide key="report" demo={demo} light>
      <Report
        demo={demo}
        roi={roi}
        raw={answers.raw}
        lever={answers.lever ?? field(system, lang)}
        today={today}
        system={system}
        worked={worked}
        touched={answers.touched}
        theirs={answers.touched.length > 0 || answers.answered === true}
        still={still}
        onType={onType}
        onLeave={onLeave}
        onChange={ask ? () => go(0) : undefined}
      />
    </Slide>
  );
}

/**
 * The slide after the story. A demo without a calculator ends on what came of it. With one, the viewer is offered to work it
 * out on their own numbers: a question a screen, then a report. A film or a picture has nobody to ask (`ask` is off), so it
 * shows the report on the demo's example numbers.
 */
export function Results({ demo, still, ask, open }: { demo: Demo; still: boolean; ask: boolean; open?: Step }) {
  const roi = demo.results?.roi;
  if (roi) return <Calculator demo={demo} roi={roi} still={still} ask={ask} open={open} />;
  return (
    <Slide demo={demo}>
      <Closing demo={demo} />
    </Slide>
  );
}
