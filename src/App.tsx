import { lazy, Suspense, useEffect, useState } from "react";
import { prepare, Stage, type Flags, type Ready } from "./engine/Stage.tsx";
import type { Demo } from "./engine/types.ts";

/** Where the dev server shows every panel with its example. No demo can take this path: a slug starts with a letter or digit. */
const GALLERY = "/__panels";
// A build is one demo, so the gallery and the examples it draws stay out of it.
const Gallery = import.meta.env.DEV ? lazy(() => import("./gallery/Gallery.tsx")) : undefined;

type View =
  | { kind: "loading" }
  | { kind: "gallery" }
  | { kind: "demo"; ready: Ready }
  | { kind: "problems"; problems: string[] }
  | { kind: "index"; demos: { slug: string; title: string; source: string }[] };

function flags(): Flags {
  const q = new URLSearchParams(location.search);
  const at = q.get("at");
  const n = q.get("n");
  return {
    mode: q.get("mode") === "explainer" ? "explainer" : "fast",
    autoplay: q.get("autoplay") === "1",
    record: q.get("record") === "1",
    bare: q.get("bare") === "1",
    at: at === "start" || at === "end" ? at : at !== null && /^\d+$/.test(at) ? Number(at) : undefined,
    n: n !== null && /^\d+$/.test(n) ? Number(n) : undefined,
  };
}

async function load(): Promise<View> {
  if (import.meta.env.DEV && location.pathname === GALLERY) return { kind: "gallery" };
  // In dev the root lists every demo. A build is one demo: the demo.json that sits next to it.
  if (import.meta.env.DEV && location.pathname === "/") {
    return { kind: "index", demos: await (await fetch("/__demos.json")).json() };
  }
  const res = await fetch("./demo.json", { cache: "no-store" });
  if (res.status === 422 || res.status === 404) return { kind: "problems", problems: (await res.json()).problems };
  if (!res.ok) return { kind: "problems", problems: [`demo.json did not load (${res.status}).`] };
  try {
    return { kind: "demo", ready: prepare((await res.json()) as Demo) };
  } catch (e) {
    return { kind: "problems", problems: [e instanceof Error ? e.message : String(e)] };
  }
}

export function App() {
  const [view, setView] = useState<View>({ kind: "loading" });
  useEffect(() => {
    load().then(setView, (e) => setView({ kind: "problems", problems: [String(e)] }));
  }, []);
  useEffect(() => {
    if (view.kind === "demo") document.title = view.ready.demo.title;
  }, [view]);

  if (view.kind === "loading") return null;
  if (view.kind === "gallery")
    return (
      <Suspense fallback={null}>{Gallery && <Gallery />}</Suspense>
    );
  if (view.kind === "demo") return <Stage ready={view.ready} flags={flags()} />;
  if (view.kind === "problems") {
    return (
      <main className="mx-auto flex h-dvh max-w-[60rem] flex-col justify-center gap-4 p-8">
        <h1 className="text-big font-semibold">This demo cannot play yet</h1>
        <ul className="flex flex-col gap-2 font-mono text-body text-stage-muted">
          {view.problems.map((problem, i) => (
            <li key={i}>{problem}</li>
          ))}
        </ul>
      </main>
    );
  }
  return (
    <main className="mx-auto flex h-dvh max-w-[60rem] flex-col justify-center gap-4 p-8">
      <h1 className="text-big font-semibold">Demos</h1>
      <ul className="flex flex-col gap-1 text-lead">
        {view.demos.map((d) => (
          <li key={d.slug}>
            <a className="flex items-baseline gap-3 rounded-control px-3 py-2 hover:bg-stage-raise" href={`/${d.slug}/`}>
              <span className="font-semibold">{d.title}</span>
              <span className="font-mono text-meta text-stage-muted">
                {d.slug} · {d.source}
              </span>
            </a>
          </li>
        ))}
        {view.demos.length === 0 && <li className="text-stage-muted">No demos yet.</li>}
      </ul>
      <a className="self-start rounded-control px-3 text-meta text-stage-muted underline underline-offset-4" href={GALLERY}>
        Every panel, with its example
      </a>
    </main>
  );
}
