import "./skin.css";
import { cn } from "../../lib/style.ts";
import { Glyph } from "../glyphs.tsx";
import { Icon, type IconName } from "../icons.tsx";
import { TONES } from "../tones.ts";
import type { PanelProps } from "../types.ts";
import type { State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

/** The app's own navigation, down the left edge. The second one is where the viewer is: the pipeline. */
const RAIL: IconName[] = ["search", "users", "mail", "calendar", "chart"];

/** A pipeline board: stages left to right, one card per lead or deal. */
export default function Panel({ config, state }: PanelProps<Config, State, Action>) {
  return (
    <div className="flex h-full bg-wash">
      <div aria-hidden="true" className="flex w-[2.7rem] shrink-0 flex-col items-center gap-[0.35rem] bg-app py-[0.6rem] text-on-app @max-[30rem]:hidden">
        {RAIL.map((name, i) => (
          <span key={name} className={cn("grid size-[1.9rem] place-items-center rounded-control", i === 1 ? "bg-on-app/15" : "opacity-65")}>
            <Icon name={name} className="size-[1.15rem]" />
          </span>
        ))}
        <span className="mt-auto grid size-[1.7rem] place-items-center rounded-full bg-on-app/20">
          <Glyph name="person" className="size-[1rem]" />
        </span>
      </div>
      <div className="flex min-w-0 flex-1 gap-[0.5rem] p-[0.6rem] @max-[30rem]:flex-col">
        {config.columns.map((column) => {
          const cards = state.cards.filter((card) => card.column === column.id);
          return (
            <section key={column.id} aria-label={column.title} data-column={column.id} className="flex min-w-0 flex-1 flex-col rounded-control border border-line bg-app-wash @max-[30rem]:flex-none">
              <h3 className="flex h-[2rem] shrink-0 items-center justify-between gap-2 rounded-t-control border-b border-line bg-window px-[0.6rem] pt-[0.15rem] text-meta font-semibold">
                <span className="truncate">{column.title}</span>
                <span className="rounded-full bg-app-wash px-[0.5rem] tabular-nums text-muted">{cards.length}</span>
              </h3>
              <ul className="flex min-h-0 flex-1 flex-col gap-[0.4rem] p-[0.4rem] @max-[30rem]:grid @max-[30rem]:grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))]">
                {cards.map((card) => (
                  // A touched card gets a new key, so it mounts again and its entrance shows what changed.
                  <li
                    key={`${card.id}:${card.rev}`}
                    data-card={card.id}
                    className={cn("min-w-0 rounded-control border border-line bg-window px-[0.6rem] py-[0.45rem]", card.how === "land" && "flash animate-land", card.how === "flash" && "flash")}
                  >
                    <p className="truncate font-semibold leading-tight text-mark">{card.title}</p>
                    {card.subtitle && <p className="truncate text-meta text-muted">{card.subtitle}</p>}
                    {(card.value || card.tag) && (
                      <p className="mt-[0.3rem] flex items-center justify-between gap-2 text-meta">
                        <span className="font-semibold tabular-nums">{card.value}</span>
                        {card.tag && <span className={cn("truncate rounded-control px-[0.45rem] py-[0.05rem] font-medium", TONES[card.tone ?? "idle"])}>{card.tag}</span>}
                      </p>
                    )}
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
