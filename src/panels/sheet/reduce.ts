import type { Tone } from "../tones.ts";
import type { PanelLogic } from "../types.ts";
import type { Action, Config } from "./schema.ts";

export interface Row {
  id: string;
  cells: Record<string, string>;
  tone?: Tone;
  /** How many times the demo has touched this row. */
  rev: number;
  /** The columns the last touch changed. The view flashes those cells. */
  changed: string[];
  /** The last touch added the row, so it lands. */
  landed?: boolean;
}

export interface State {
  /** Top to bottom. */
  rows: Row[];
}

/** More rows than this and the bottom ones fall off the monitor. */
export const ROWS_MAX = 7;

export const logic: PanelLogic<Config, State, Action> = {
  icon: "table",
  initial: (config) => ({ rows: (config.rows ?? []).map((row) => ({ ...row, rev: 0, changed: [] })) }),
  reduce(state, action, config) {
    const ids = config.columns.map((column) => column.id);
    const known = (cells: Record<string, string>) => {
      for (const key of Object.keys(cells)) if (!ids.includes(key)) throw new Error(`there is no column "${key}". Columns: ${ids.join(", ")}`);
      return cells;
    };
    switch (action.type) {
      case "add": {
        if (state.rows.some((row) => row.id === action.id)) throw new Error(`there is already a row "${action.id}"`);
        const cells = known(action.cells);
        if (state.rows.length + 1 > ROWS_MAX) throw new Error(`the sheet would hold ${state.rows.length + 1} rows and fits ${ROWS_MAX}`);
        const row: Row = { id: action.id, cells, rev: 1, changed: ids, landed: true };
        if (action.tone) row.tone = action.tone;
        return { rows: [...state.rows, row] };
      }
      case "set": {
        const row = state.rows.find((r) => r.id === action.row);
        if (!row) throw new Error(`there is no row "${action.row}". Rows: ${state.rows.map((r) => r.id).join(", ") || "none yet"}`);
        if (!action.cells && !action.tone) throw new Error(`"set" on "${row.id}" changes nothing. Name \`cells\` or \`tone\``);
        const cells = known(action.cells ?? {});
        // A new tone recolours the status pill, so that cell changed too.
        const tags = action.tone ? config.columns.filter((column) => column.tag).map((column) => column.id) : [];
        const changed = [...new Set([...Object.keys(cells), ...tags])];
        const next: Row = { id: row.id, cells: { ...row.cells, ...cells }, rev: row.rev + 1, changed };
        const tone = action.tone ?? row.tone;
        if (tone) next.tone = tone;
        return { rows: state.rows.map((r) => (r === row ? next : r)) };
      }
      case "fill": {
        known({ [action.column]: action.value });
        return {
          rows: state.rows.map((row) => {
            const tone = action.tone ?? row.tone;
            // A row that reads the same already is left alone, so it does not flash.
            if (row.cells[action.column] === action.value && tone === row.tone) return row;
            const next: Row = { id: row.id, cells: { ...row.cells, [action.column]: action.value }, rev: row.rev + 1, changed: [action.column] };
            if (tone) next.tone = tone;
            return next;
          }),
        };
      }
    }
  },
};
