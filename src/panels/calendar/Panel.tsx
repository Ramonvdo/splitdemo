import "./skin.css";
import type { CSSProperties } from "react";
import { cn } from "../../lib/style.ts";
import { Glyph } from "../glyphs.tsx";
import { Icon } from "../icons.tsx";
import type { PanelProps } from "../types.ts";
import { shown, type State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

/** A week of bookings, one column a day, in time order. New bookings land in their day. */
export default function Panel({ config, state }: PanelProps<Config, State, Action>) {
  return (
    <div className="flex h-full flex-col">
      {/* The calendar's own bar: which week this is, and the controls every calendar has. They do nothing here. */}
      <header className="flex h-[1.9rem] shrink-0 items-center gap-[0.5rem] border-b border-line px-[0.6rem] @max-[30rem]:hidden">
        <span className="grid size-[1.25rem] shrink-0 place-items-center rounded-[0.3rem] bg-app text-on-app">
          <Icon name="calendar" className="size-[0.85rem]" />
        </span>
        {config.title && <p className="truncate text-meta font-semibold">{config.title}</p>}
        <span aria-hidden="true" className="ml-auto flex shrink-0 items-center gap-[0.4rem] text-muted">
          <Glyph name="back" className="size-[0.85rem]" />
          <Glyph name="back" className="size-[0.85rem] rotate-180" />
          <span className="ml-[0.3rem] flex h-[1.3rem] items-center rounded-control bg-wash p-[0.12rem]">
            <span className="grid h-full w-[1.4rem] place-items-center">
              <Glyph name="lines" className="size-[0.8rem]" />
            </span>
            <span data-view className="grid h-full w-[1.4rem] place-items-center rounded-[0.22rem] bg-window text-mark">
              <Glyph name="grid" className="size-[0.8rem]" />
            </span>
          </span>
        </span>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-[repeat(var(--n),minmax(0,1fr))] @max-[30rem]:grid-cols-1 @max-[30rem]:content-start" style={{ "--n": config.days.length } as CSSProperties}>
        {config.days.map((day) => {
          const events = state.events.filter((event) => event.day === day.id);
          const today = config.today === day.id;
          return (
            <section key={day.id} data-day={day.id} className="flex min-w-0 flex-col border-l border-line first:border-l-0 @max-[30rem]:border-l-0 @max-[30rem]:border-t @max-[30rem]:first:border-t-0">
              <h3 className="flex h-[2.1rem] shrink-0 items-center justify-center border-b border-line px-[0.3rem] text-meta font-medium">
                <span className={cn("truncate rounded-full px-[0.6rem] py-[0.1rem]", today ? "bg-mark text-on-app" : "text-muted")}>
                  {day.label}
                  {today && <span className="sr-only"> (today)</span>}
                </span>
              </h3>
              <ul className="flex flex-1 flex-col gap-[0.3rem] p-[0.3rem] @max-[30rem]:grid @max-[30rem]:flex-none @max-[30rem]:grid-cols-2">
                {events.map((event) => (
                  // A booked, moved or cancelled booking gets a new key, so it mounts again and shows what changed.
                  <li
                    key={`${event.id}:${event.rev}`}
                    data-event={event.id}
                    data-tone={event.tone ?? "idle"}
                    data-cancelled={event.cancelled || undefined}
                    className={cn("min-w-0 rounded-control py-[0.3rem] pl-[0.65rem] pr-[0.45rem]", event.how === "land" && "flash animate-land", event.how === "flash" && "flash")}
                  >
                    <p className="text-meta">
                      {shown(event.time, config.ampm)}
                      {event.cancelled && <span> · Cancelled</span>}
                    </p>
                    <p className={cn("line-clamp-2 font-semibold leading-snug", event.cancelled && "line-through")}>{event.title}</p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
