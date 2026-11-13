import type { CSSProperties } from "react";
import { cn } from "../../lib/style.ts";
import { TONE_TEXT } from "../tones.ts";
import type { PanelProps } from "../types.ts";
import type { State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

/** A week of bookings, one column a day, in time order. New bookings land in their day. */
export default function Panel({ config, state }: PanelProps<Config, State, Action>) {
  return (
    <div className="grid h-full grid-cols-[repeat(var(--n),minmax(0,1fr))] gap-[0.5rem] p-[0.7rem] @max-[30rem]:grid-cols-1 @max-[30rem]:content-start" style={{ "--n": config.days.length } as CSSProperties}>
      {config.days.map((day) => {
        const events = state.events.filter((event) => event.day === day.id);
        return (
          <section key={day.id} data-day={day.id} className="flex min-w-0 flex-col gap-[0.4rem] rounded-control bg-wash p-[0.45rem]">
            <h3 className="flex h-[1.5rem] items-center justify-between gap-1 px-[0.2rem] text-meta font-semibold">
              <span className="truncate">{day.label}</span>
              {config.today === day.id && <span className="shrink-0 rounded-full bg-ink px-[0.5rem] font-medium text-window">Today</span>}
            </h3>
            <ul className="flex flex-col gap-[0.35rem] @max-[30rem]:grid @max-[30rem]:grid-cols-2">
              {events.map((event) => (
                // A booked, moved or cancelled booking gets a new key, so it mounts again and shows what changed.
                <li
                  key={`${event.id}:${event.rev}`}
                  data-event={event.id}
                  data-cancelled={event.cancelled || undefined}
                  className={cn(
                    "min-w-0 rounded-control border-l-[0.23rem] border-current bg-window px-[0.5rem] py-[0.35rem]",
                    // The tone colours the edge only; the text inside sets its own colour.
                    (!event.cancelled && TONE_TEXT[event.tone ?? "idle"]) || "text-muted",
                    event.how === "land" && "flash animate-land",
                    event.how === "flash" && "flash",
                  )}
                >
                  <p className="font-mono text-meta tabular-nums text-muted">
                    {event.time}
                    {event.cancelled && <span className="font-sans"> · Cancelled</span>}
                  </p>
                  <p className={cn("line-clamp-2 font-medium leading-snug", event.cancelled ? "text-muted line-through" : "text-ink")}>{event.title}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
