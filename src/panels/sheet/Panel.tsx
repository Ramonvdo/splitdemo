import "./skin.css";
import { cn } from "../../lib/style.ts";
import { Glyph } from "../glyphs.tsx";
import { Icon } from "../icons.tsx";
import type { PanelProps } from "../types.ts";
import type { State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

// On a narrow monitor a row turns into a small card: the first cell is its title, a status sits beside it, the rest under it.
const ROW = "@max-[30rem]:h-auto @max-[30rem]:grid-cols-[minmax(0,1fr)_auto]! @max-[30rem]:items-center @max-[30rem]:gap-x-[0.7rem] @max-[30rem]:px-[0.8rem] @max-[30rem]:py-[0.5rem] @max-[30rem]:last:border-b-0";
const CELL = "relative truncate border-l border-line px-[0.45rem] leading-[1.6rem] @max-[30rem]:border-0 @max-[30rem]:p-0 @max-[30rem]:leading-[1.4]";
const TITLE = "@max-[30rem]:col-start-1 @max-[30rem]:row-start-1 @max-[30rem]:font-semibold";
const STATUS = "@max-[30rem]:col-start-2 @max-[30rem]:row-start-1";
const REST = "@max-[30rem]:col-span-2 @max-[30rem]:text-muted";
/** The grey margin: a row's number, a column's letter. */
const EDGE = "bg-wash text-center leading-[1.6rem] tabular-nums text-muted @max-[30rem]:hidden";
/** Empty rows under the last one, so the grid runs to the bottom of the window. The window cuts off the ones that do not fit. */
const GRID_ROWS = 26;

/** The empty column after the last one: a sheet never ends where its data does. */
const SPARE = <span aria-hidden="true" className="border-l border-line @max-[30rem]:hidden" />;

const letter = (i: number) => String.fromCharCode(65 + i);

/** A spreadsheet: one row per lead, order or request. Rows land at the bottom; changed cells flash, and the selection sits on the last one written. */
export default function Panel({ config, state }: PanelProps<Config, State, Action>) {
  // Every row is its own grid on the same tracks, so the columns line up and a single row can land.
  const tracks = { gridTemplateColumns: `2.2rem ${config.columns.map((column) => `minmax(0, ${column.wide ? 2 : 1}fr)`).join(" ")} minmax(1.6rem, 0.3fr)` };
  const onRow = state.active ? state.rows.findIndex((row) => row.id === state.active!.row) : -1;
  const onColumn = onRow < 0 ? -1 : config.columns.findIndex((column) => column.id === state.active!.column);
  // Before anything is written the selection is where a sheet opens: A1, the first header.
  const cellName = onColumn < 0 ? "A1" : `${letter(onColumn)}${onRow + 2}`;
  const cellText = onColumn < 0 ? config.columns[0].title : (state.rows[onRow].cells[config.columns[onColumn].id] ?? "");
  return (
    <div className="flex h-full flex-col text-meta">
      <header data-chrome className="flex h-[2.2rem] shrink-0 items-center gap-[0.55rem] px-[0.7rem]">
        <span className="grid size-[1.45rem] shrink-0 place-items-center rounded-[0.3rem] bg-app text-on-app">
          <Icon name="table" className="size-[1rem]" />
        </span>
        <p className="truncate text-body">{config.title ?? "Untitled spreadsheet"}</p>
        <Icon name="star" className="size-[1rem] shrink-0 text-muted" />
        <span aria-hidden="true" className="ml-auto flex shrink-0 items-center gap-[0.75rem] text-muted @max-[30rem]:hidden">
          <Icon name="clock" className="size-[1.1rem]" />
          <Icon name="message" className="size-[1.1rem]" />
          <span className="flex h-[1.5rem] items-center gap-[0.3rem] rounded-full bg-app-wash px-[0.7rem] text-ink">
            <Glyph name="lock" className="size-[0.85rem]" />
            <Icon name="users" className="size-[0.95rem]" />
          </span>
          <span className="grid size-[1.5rem] place-items-center rounded-full bg-mark text-on-app">
            <Glyph name="person" className="size-[0.95rem]" />
          </span>
        </span>
      </header>
      <div aria-hidden="true" data-chrome className="flex h-[1.7rem] shrink-0 items-center border-y border-line @max-[30rem]:hidden">
        <span className="flex h-full w-[4.6rem] shrink-0 items-center justify-between border-r border-line px-[0.6rem] tabular-nums">
          {cellName}
          <Glyph name="caret" className="size-[0.6rem] text-muted" />
        </span>
        <span className="px-[0.65rem] italic text-muted">fx</span>
        <span className="min-w-0 flex-1 truncate border-l border-line pl-[0.65rem]">{cellText}</span>
      </div>
      <div role="table" className="flex min-h-0 flex-1 flex-col @max-[30rem]:border-t @max-[30rem]:border-line">
        <div aria-hidden="true" className="grid h-[1.3rem] shrink-0 border-b border-line @max-[30rem]:hidden" style={tracks}>
          <span className="bg-wash" />
          {config.columns.map((column, at) => (
            <span key={column.id} data-on={at === Math.max(onColumn, 0) || undefined} className="border-l border-line bg-wash text-center leading-[1.25rem] text-muted">
              {letter(at)}
            </span>
          ))}
          <span className="border-l border-line bg-wash text-center leading-[1.25rem] text-muted">{letter(config.columns.length)}</span>
        </div>
        <div role="row" data-frozen className="grid h-[1.65rem] shrink-0 font-semibold @max-[30rem]:hidden" style={tracks}>
          <span role="columnheader" data-on={onColumn < 0 || undefined} className={cn(EDGE, "font-normal")}>
            <span aria-hidden="true">1</span>
            <span className="sr-only">Row</span>
          </span>
          {config.columns.map((column, at) => (
            <span key={column.id} role="columnheader" data-active={(onColumn < 0 && at === 0) || undefined} className={CELL}>
              {column.title}
            </span>
          ))}
          {SPARE}
        </div>
        <div role="rowgroup" className="shrink-0">
          {state.rows.map((row, i) => (
            <div key={row.id} role="row" data-row={row.id} className={cn("grid h-[1.65rem] border-b border-line", ROW, row.landed && "animate-land")} style={tracks}>
              <span role="cell" data-on={i === onRow || undefined} className={EDGE}>
                {i + 2}
              </span>
              {config.columns.map((column, at) => {
                const text = row.cells[column.id] ?? "";
                const hit = row.changed.includes(column.id);
                return (
                  // A changed cell gets a new key, so it mounts again and flashes.
                  <span
                    key={hit ? `${column.id}:${row.rev}` : column.id}
                    role="cell"
                    data-cell={column.id}
                    data-active={(i === onRow && at === onColumn) || undefined}
                    className={cn(CELL, at === 0 ? TITLE : column.tag ? STATUS : REST, hit && "flash")}
                  >
                    {column.tag && text ? (
                      <span data-tone={row.tone ?? "idle"} className="inline-flex h-[1.25rem] max-w-full items-center gap-[0.2rem] rounded-full pl-[0.55rem] pr-[0.4rem] align-middle leading-[1.25rem]">
                        <span className="min-w-0 truncate">{text}</span>
                        <Glyph name="caret" className="size-[0.55rem] shrink-0" />
                      </span>
                    ) : (
                      text
                    )}
                  </span>
                );
              })}
              {SPARE}
            </div>
          ))}
        </div>
        <div aria-hidden="true" data-scrolls className="min-h-0 flex-1 overflow-hidden @max-[30rem]:hidden">
          {Array.from({ length: GRID_ROWS - state.rows.length }, (_, i) => (
            <div key={i} className="grid h-[1.65rem] border-b border-line" style={tracks}>
              <span className={EDGE}>{state.rows.length + 2 + i}</span>
              {config.columns.map((column) => (
                <span key={column.id} className="border-l border-line" />
              ))}
              {SPARE}
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true" data-chrome className="flex h-[1.8rem] shrink-0 items-center gap-[0.9rem] border-t border-line bg-wash pl-[0.9rem] text-muted">
        <Glyph name="plus" className="size-[0.95rem]" />
        <Glyph name="lines" className="size-[0.95rem]" />
        <span data-tab className="flex h-full items-center gap-[0.4rem] px-[0.85rem] font-medium">
          {config.tab ?? "Sheet1"}
          <Glyph name="caret" className="size-[0.55rem]" />
        </span>
      </div>
    </div>
  );
}
