import { cn } from "../../lib/style.ts";
import { TONES } from "../tones.ts";
import type { PanelProps } from "../types.ts";
import type { State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

/** A pipeline board: stages left to right, one card per lead or deal. */
export default function Panel({ config, state }: PanelProps<Config, State, Action>) {
  return (
    <div className="flex h-full gap-[0.6rem] bg-wash p-[0.7rem] @max-[30rem]:flex-col">
      {config.columns.map((column) => {
        const cards = state.cards.filter((card) => card.column === column.id);
        return (
          <section key={column.id} aria-label={column.title} data-column={column.id} className="flex min-w-0 flex-1 flex-col gap-[0.5rem] @max-[30rem]:flex-none">
            <h3 className="flex items-baseline justify-between gap-2 px-[0.3rem] text-meta font-semibold">
              <span className="truncate">{column.title}</span>
              <span className="tabular-nums text-muted">{cards.length}</span>
            </h3>
            <ul className="flex min-h-0 flex-1 flex-col gap-[0.5rem] rounded-control @max-[30rem]:grid @max-[30rem]:grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))]">
              {cards.map((card) => (
                // A touched card gets a new key, so it mounts again and its entrance shows what changed.
                <li
                  key={`${card.id}:${card.rev}`}
                  data-card={card.id}
                  className={cn("min-w-0 rounded-control border border-line bg-window px-[0.7rem] py-[0.55rem]", card.how === "land" && "flash animate-land", card.how === "flash" && "flash")}
                >
                  <p className="truncate font-semibold leading-tight">{card.title}</p>
                  {card.subtitle && <p className="truncate text-meta text-muted">{card.subtitle}</p>}
                  {(card.value || card.tag) && (
                    <p className="mt-[0.4rem] flex items-center justify-between gap-2 text-meta">
                      <span className="font-semibold tabular-nums">{card.value}</span>
                      {card.tag && <span className={cn("truncate rounded-full px-[0.55rem] py-[0.1rem] font-medium", TONES[card.tone ?? "idle"])}>{card.tag}</span>}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
