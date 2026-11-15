import { useEffect, useMemo, useState } from "react";
import { presets } from "../panels/registry.ts";

interface Example {
  label: string;
  config: unknown;
  actions: { type: string }[];
}

const examples = import.meta.glob<Example>("../panels/*/example.json", { eager: true, import: "default" });
const docs = import.meta.glob<string>("../panels/*/panel.md", { eager: true, query: "?raw", import: "default" });

/** The first paragraph of a panel.md: what the viewer sees. */
function sees(doc = ""): string {
  return doc.split(/\r?\n\s*\r?\n/).find((block) => block.trim() && !block.startsWith("#")) ?? "";
}

/** The time between two actions while an example replays. */
const STEP_MS = 900;

function Card({ name, example }: { name: string; example: Example }) {
  const { logic, View } = presets[name];
  /** How many of the example's actions have happened. */
  const [n, setN] = useState(example.actions.length);
  const state = useMemo(() => example.actions.slice(0, n).reduce((at, action) => logic.reduce(at, action, example.config), logic.initial(example.config)), [n, example, logic]);

  useEffect(() => {
    if (n >= example.actions.length) return;
    const timer = setTimeout(() => setN(n + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [n, example.actions.length]);

  return (
    <article data-example={name} className="flex max-w-full flex-col gap-[0.5rem]">
      <header className="flex items-baseline gap-[0.8rem]">
        <h2 className="font-mono text-lead font-semibold">{name}</h2>
        <p className="min-w-0 flex-1 truncate text-meta text-stage-muted">{example.label}</p>
        <button type="button" onClick={() => setN(0)} className="rounded-full border border-stage-line px-[0.8rem] py-[0.15rem] text-meta hover:bg-stage-raise">
          Replay
        </button>
      </header>
      {/* The same window a monitor on the wall has, at the size of its usual cell. */}
      <div className={`@container relative max-w-full overflow-hidden rounded-monitor bg-window text-ink ${logic.portrait ? "h-[46rem] w-[22rem]" : "h-[22rem] w-[44rem]"}`}>
        <div className="relative size-full">
          <View config={example.config} state={state} live={n < example.actions.length} />
        </div>
      </div>
      <p className={`text-meta text-stage-muted ${logic.portrait ? "w-[22rem]" : "w-[44rem]"} max-w-full`}>{sees(docs[`../panels/${name}/panel.md`])}</p>
    </article>
  );
}

/** Dev only: every preset drawn with its example, wide ones first. */
export default function Gallery() {
  const names = Object.keys(presets)
    .filter((name) => examples[`../panels/${name}/example.json`])
    .sort((a, b) => Number(presets[a].logic.portrait ?? false) - Number(presets[b].logic.portrait ?? false) || a.localeCompare(b));
  return (
    <main className="gallery flex h-dvh flex-col gap-[1.4rem] overflow-y-auto p-[1.4rem]">
      <header className="flex flex-wrap items-baseline gap-x-[1rem]">
        <h1 className="text-big font-semibold">Panels</h1>
        <p className="text-stage-muted">Every preset, drawn with the example in its folder. Replay runs the example's actions one at a time.</p>
        <a href="/" className="ml-auto rounded-control text-meta underline underline-offset-4">
          Demos
        </a>
      </header>
      <div className="flex flex-wrap items-start gap-[1.4rem]">
        {names.map((name) => (
          <Card key={name} name={name} example={examples[`../panels/${name}/example.json`]} />
        ))}
      </div>
    </main>
  );
}
