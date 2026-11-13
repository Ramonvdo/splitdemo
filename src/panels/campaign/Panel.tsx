import type { CSSProperties } from "react";
import { cn } from "../../lib/style.ts";
import { Icon } from "../icons.tsx";
import { TONES, TONE_TEXT } from "../tones.ts";
import type { PanelProps } from "../types.ts";
import type { State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

/** An email campaign: the sequence that goes out, and the counters that say how it is doing. */
export default function Panel({ config, state }: PanelProps<Config, State, Action>) {
  return (
    <div className="flex h-full flex-col gap-[0.7rem] p-[0.8rem]">
      <header className="flex items-center justify-between gap-2">
        <h3 className="truncate text-lead font-semibold">{config.name}</h3>
        {state.status && (
          <span key={state.status.rev} data-status className={cn("shrink-0 rounded-full px-[0.65rem] py-[0.1rem] text-meta font-medium", TONES[state.status.tone ?? "idle"], state.status.rev > 0 && "animate-pop")}>
            {state.status.text}
          </span>
        )}
      </header>

      <ol className="flex min-h-0 flex-1 flex-col gap-[0.45rem]">
        {config.steps.map((step, i) => {
          const sent = state.sent.includes(step.id);
          const note = state.notes[step.id];
          return (
            // A step that goes out gets a new key, so it mounts again and flashes.
            <li key={sent ? `${step.id}:sent` : step.id} data-step={step.id} data-sent={sent || undefined} className={cn("flex items-center gap-[0.7rem] rounded-control border border-line px-[0.7rem] py-[0.5rem]", sent && "flash")}>
              <span className={cn("grid size-[1.7rem] shrink-0 place-items-center rounded-full text-meta font-semibold tabular-nums", sent ? "bg-ink text-window" : "bg-wash text-muted")}>
                {sent ? <Icon name="check" className="size-[0.95rem]" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate font-medium", !sent && "text-muted")}>{step.title}</p>
                {step.when && <p className="text-meta text-muted">{step.when}</p>}
              </div>
              {note && <span className="shrink-0 animate-pop text-meta font-medium tabular-nums">{note}</span>}
            </li>
          );
        })}
      </ol>

      <dl className="grid grid-cols-[repeat(var(--n),minmax(0,1fr))] gap-[0.5rem] @max-[30rem]:grid-cols-2" style={{ "--n": state.stats.length } as CSSProperties}>
        {state.stats.map((stat) => (
          <div key={stat.id} data-stat={stat.id} className="flex min-w-0 flex-col-reverse rounded-control border border-line px-[0.7rem] py-[0.45rem]">
            {/* A changed counter gets a new key, so it mounts again and flashes. */}
            <dd key={stat.rev} className={cn("rounded-control text-big font-bold tabular-nums tracking-tight", stat.tone && TONE_TEXT[stat.tone], stat.rev > 0 && "flash")}>
              {stat.value}
            </dd>
            <dt className="truncate text-meta text-muted">{stat.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
