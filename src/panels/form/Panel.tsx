import { TapDot } from "../../engine/TapDot.tsx";
import { cn } from "../../lib/style.ts";
import { Icon } from "../icons.tsx";
import type { PanelProps } from "../types.ts";
import type { State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

/** A web form, as the person filling it in sees it. Answers appear, the button is pressed, a confirmation takes its place. */
export default function Panel({ config, state, pending, onTrigger }: PanelProps<Config, State, Action>) {
  const ready = pending?.type === "submit";
  const filled = Object.keys(state.values).length > 0;

  if (state.sent)
    return (
      <div className="grid h-full place-items-center p-[1.4rem] text-center">
        <div data-sent className="animate-pop">
          <span className="mx-auto grid size-[3rem] place-items-center rounded-full bg-good/10 text-good">
            <Icon name="check" className="size-[1.5rem]" />
          </span>
          <p className="mt-[0.9rem] text-lead font-semibold">{config.done?.title ?? "Thank you"}</p>
          {config.done?.text && <p className="mt-[0.3rem] text-muted">{config.done.text}</p>}
        </div>
      </div>
    );

  return (
    <div className="flex h-full flex-col gap-[1rem] p-[1.2rem]">
      <header>
        <h3 className="text-lead font-semibold leading-tight">{config.title}</h3>
        {config.intro && <p className="mt-[0.3rem] text-meta text-muted">{config.intro}</p>}
      </header>

      <div className="grid gap-[0.85rem] @min-[34rem]:grid-cols-2">
        {config.fields.map((field) => {
          const value = state.values[field.id];
          return (
            <div key={field.id} data-field={field.id} data-filled={value !== undefined || undefined} className="min-w-0">
              <p className="mb-[0.3rem] text-meta font-medium">{field.label}</p>
              {field.options ? (
                <ul className="flex flex-wrap gap-[0.4rem]">
                  {field.options.map((option) => (
                    // The chosen answer gets a new key, so it mounts again and pops.
                    <li key={option === value ? `${option}:on` : option} className={cn("rounded-full border px-[0.75rem] py-[0.3rem] text-meta", option === value ? "animate-pop border-ink bg-ink font-medium text-window" : "border-line text-muted")}>
                      {option}
                      {option === value && <span className="sr-only"> (chosen)</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                // A filled field gets a new key, so it mounts again and flashes.
                <p key={value ?? ""} className={cn("min-h-[2.5rem] rounded-control border px-[0.8rem] py-[0.5rem] leading-snug", value === undefined ? "text-muted" : "flash", state.last === field.id ? "border-ink" : "border-line")}>
                  {value ?? field.placeholder ?? " "}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!ready}
        onClick={onTrigger}
        className={cn("relative rounded-control px-[1rem] py-[0.7rem] font-semibold", filled ? "bg-ink text-window" : "bg-wash text-muted")}
      >
        {config.button ?? "Send"}
        {ready && <TapDot />}
      </button>
    </div>
  );
}
