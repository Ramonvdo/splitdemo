import "./skin.css";
import type { CSSProperties } from "react";
import { cn } from "../../lib/style.ts";
import { Icon } from "../icons.tsx";
import { TONE_TEXT, type Tone } from "../tones.ts";
import type { PanelProps } from "../types.ts";
import type { State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

/** The dot in front of the status. */
const DOT: Record<Tone, string> = { good: "bg-good", wait: "bg-wait", info: "bg-info", idle: "bg-idle" };

/** An email campaign: the sequence that goes out, and the counters that say how it is doing. */
export default function Panel({ config, state }: PanelProps<Config, State, Action>) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-[2.6rem] shrink-0 items-center gap-[0.6rem] bg-app px-[0.9rem] text-on-app">
        <Icon name="send" className="size-[1.15rem] shrink-0" />
        <h3 className="truncate text-lead font-semibold">{config.name}</h3>
        {state.status && (
          <span key={state.status.rev} data-status className={cn("ml-auto flex shrink-0 items-center gap-[0.4rem] rounded-full bg-window px-[0.65rem] py-[0.1rem] text-meta font-medium text-ink", state.status.rev > 0 && "animate-pop")}>
            <span className={cn("size-[0.5rem] rounded-full", DOT[state.status.tone ?? "idle"])} />
            {state.status.text}
          </span>
        )}
      </header>

      <ol className="flex min-h-0 flex-1 flex-col justify-center gap-[0.35rem] px-[0.6rem] py-[0.5rem]">
        {config.steps.map((step, i) => {
          const sent = state.sent.includes(step.id);
          const note = state.notes[step.id];
          return (
            // A step that goes out gets a new key, so it mounts again and flashes.
            <li key={sent ? `${step.id}:sent` : step.id} data-step={step.id} data-sent={sent || undefined} className={cn("relative flex items-center gap-[0.7rem] rounded-control px-[0.3rem] py-[0.3rem]", sent && "flash")}>
              <span className={cn("grid size-[1.7rem] shrink-0 place-items-center rounded-full border text-meta font-semibold tabular-nums", sent ? "border-ink bg-ink text-window" : "border-line bg-window text-muted")}>
                {sent ? <Icon name="check" className="size-[0.95rem]" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate font-medium", !sent && "text-muted")}>{step.title}</p>
                {step.when && <p className="text-meta text-muted">{step.when}</p>}
              </div>
              {note && <span className="shrink-0 animate-pop rounded-full bg-wash px-[0.65rem] py-[0.1rem] text-meta font-medium">{note}</span>}
            </li>
          );
        })}
      </ol>

      <dl className="grid shrink-0 grid-cols-[repeat(var(--n),minmax(0,1fr))] border-t border-line bg-wash @max-[30rem]:grid-cols-2" style={{ "--n": state.stats.length } as CSSProperties}>
        {state.stats.map((stat) => (
          <div key={stat.id} data-stat={stat.id} className="flex min-w-0 flex-col-reverse border-l border-line px-[0.9rem] py-[0.5rem] first:border-l-0 @max-[30rem]:border-l-0">
            {/* A changed counter gets a new key, so it mounts again and flashes. */}
            <dd key={stat.rev} className={cn("rounded-control text-big font-semibold tabular-nums tracking-tight", stat.tone && TONE_TEXT[stat.tone], stat.rev > 0 && "flash")}>
              {stat.value}
            </dd>
            <dt className="truncate text-meta text-muted">{stat.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
