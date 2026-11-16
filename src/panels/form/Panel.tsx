import "./skin.css";
import { TapDot } from "../../engine/TapDot.tsx";
import { cn } from "../../lib/style.ts";
import { Glyph } from "../glyphs.tsx";
import { Icon } from "../icons.tsx";
import type { PanelProps } from "../types.ts";
import type { State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

/** A web form, as the person filling it in sees it. Answers appear, the button is pressed, and a confirmation takes the button's place. */
export default function Panel({ config, state, pending, onTrigger }: PanelProps<Config, State, Action>) {
  const ready = pending?.type === "submit";
  const filled = Object.keys(state.values).length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* With an address, the form sits in a browser: it is a page on their own site. */}
      {config.site && (
        <div className="flex h-[2.2rem] shrink-0 items-center gap-[0.65rem] border-b border-line bg-wash px-[0.8rem]">
          <span aria-hidden="true" className="flex shrink-0 gap-[0.3rem]">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-[0.55rem] rounded-full bg-line" />
            ))}
          </span>
          <p data-url className="flex h-[1.45rem] min-w-0 flex-1 items-center gap-[0.35rem] rounded-full px-[0.7rem] text-meta text-muted">
            <Glyph name="lock" className="size-[0.8rem] shrink-0" />
            <span className="truncate">{config.site}</span>
          </p>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-[1rem] p-[1.2rem]">
        <header>
          <h3 className="text-huge leading-none">{config.title}</h3>
          {config.intro && <p className="mt-[0.45rem] text-meta text-muted">{config.intro}</p>}
        </header>

        <div className="grid gap-[0.8rem] @min-[34rem]:grid-cols-2">
          {config.fields.map((field) => {
            const value = state.values[field.id];
            return (
              <div key={field.id} data-field={field.id} data-filled={value !== undefined || undefined} className="min-w-0">
                <p className="mb-[0.3rem] text-meta font-medium">{field.label}</p>
                {field.options ? (
                  <ul className="flex flex-wrap gap-[0.4rem]">
                    {field.options.map((option) => (
                      // The chosen answer gets a new key, so it mounts again and pops.
                      <li key={option === value ? `${option}:on` : option} data-input={option === value ? undefined : ""} className={cn("rounded-full border px-[0.75rem] py-[0.3rem] text-meta", option === value ? "animate-pop border-ink bg-ink font-medium text-window" : "border-line text-muted")}>
                        {option}
                        {option === value && <span className="sr-only"> (chosen)</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  // A filled field gets a new key, so it mounts again and flashes.
                  <p key={value ?? ""} data-input className={cn("min-h-[2.5rem] rounded-control border px-[0.8rem] py-[0.5rem] leading-snug", value === undefined ? "text-muted" : "flash", state.last === field.id && !state.sent ? "border-ink" : "border-line")}>
                    {value ?? field.placeholder ?? " "}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {state.sent ? (
          // What was sent stays in view above this, so the other screens can be read against it.
          <div data-sent className="flex animate-pop items-start gap-[0.7rem] rounded-control bg-good/10 px-[0.9rem] py-[0.75rem]">
            <span className="grid size-[1.6rem] shrink-0 place-items-center rounded-full bg-good text-window">
              <Icon name="check" className="size-[0.95rem] stroke-[3]" />
            </span>
            <p className="min-w-0 leading-snug">
              <span className="block font-semibold">{config.done?.title ?? "Thank you"}</span>
              {config.done?.text && <span className="block text-meta text-muted">{config.done.text}</span>}
            </p>
          </div>
        ) : (
          <button type="button" disabled={!ready} onClick={onTrigger} className={cn("relative rounded-full px-[1rem] py-[0.7rem] font-semibold", filled ? "bg-app text-on-app" : "bg-wash text-muted")}>
            {config.button ?? "Send"}
            {ready && <TapDot />}
          </button>
        )}
      </div>
    </div>
  );
}
