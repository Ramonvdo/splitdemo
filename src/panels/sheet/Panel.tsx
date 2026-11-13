import { cn } from "../../lib/style.ts";
import { TONES } from "../tones.ts";
import type { PanelProps } from "../types.ts";
import type { State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

// On a narrow monitor a row turns into a small card: the first cell is its title, the rest sit under it.
const ROW = "@max-[30rem]:flex @max-[30rem]:flex-wrap @max-[30rem]:items-center @max-[30rem]:gap-x-[0.7rem] @max-[30rem]:px-[0.7rem] @max-[30rem]:py-[0.45rem] @max-[30rem]:first:border-t-0";
const CELL = "truncate border-l border-line px-[0.6rem] py-[0.5rem] @max-[30rem]:border-0 @max-[30rem]:p-0";
const TITLE = "@max-[30rem]:w-full @max-[30rem]:font-semibold";

/** A spreadsheet: one row per lead, order or request. Rows land at the bottom; changed cells flash. */
export default function Panel({ config, state }: PanelProps<Config, State, Action>) {
  // Every row is its own grid on the same tracks, so the columns line up and a single row can land.
  const tracks = { gridTemplateColumns: `2.3rem ${config.columns.map((column) => `minmax(0, ${column.wide ? 2 : 1}fr)`).join(" ")}` };
  return (
    <div className="h-full p-[0.7rem]">
      <div role="table" className="overflow-hidden rounded-control border border-line text-meta">
        <div role="row" className="grid bg-wash font-semibold @max-[30rem]:hidden" style={tracks}>
          <span role="columnheader">
            <span className="sr-only">Row</span>
          </span>
          {config.columns.map((column) => (
            <span key={column.id} role="columnheader" className={CELL}>
              {column.title}
            </span>
          ))}
        </div>
        <div role="rowgroup">
          {state.rows.map((row, i) => (
            <div key={row.id} role="row" data-row={row.id} className={cn("grid border-t border-line", ROW, row.landed && "animate-land")} style={tracks}>
              <span role="cell" className="grid place-items-center bg-wash tabular-nums text-muted @max-[30rem]:hidden">
                {i + 1}
              </span>
              {config.columns.map((column, at) => {
                const text = row.cells[column.id] ?? "";
                const hit = row.changed.includes(column.id);
                return (
                  // A changed cell gets a new key, so it mounts again and flashes.
                  <span key={hit ? `${column.id}:${row.rev}` : column.id} role="cell" data-cell={column.id} className={cn(CELL, at === 0 && TITLE, hit && "flash")}>
                    {column.tag && text ? <span className={cn("rounded-full px-[0.55rem] py-[0.1rem] font-medium", TONES[row.tone ?? "idle"])}>{text}</span> : text}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
