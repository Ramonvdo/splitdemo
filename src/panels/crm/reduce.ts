import type { Tone } from "../tones.ts";
import type { PanelLogic } from "../types.ts";
import type { Action, Config } from "./schema.ts";

export interface Card {
  id: string;
  column: string;
  title: string;
  subtitle?: string;
  value?: string;
  tag?: string;
  tone?: Tone;
  /** How many times the demo has touched this card. The view replays its entrance when this changes. */
  rev: number;
  /** How the last touch shows: the card lands (added, moved) or flashes (changed in place). */
  how?: "land" | "flash";
}

export interface State {
  /** Every card on the board. Within a column, the order here is top to bottom. */
  cards: Card[];
}

/** More cards than this in one column and the bottom ones fall off the monitor. */
export const COLUMN_MAX = 4;

function fits(cards: Card[], column: string): Card[] {
  const count = cards.filter((c) => c.column === column).length;
  if (count > COLUMN_MAX) throw new Error(`"${column}" would hold ${count} cards and a column fits ${COLUMN_MAX}. Move or leave out a card.`);
  return cards;
}

export const logic: PanelLogic<Config, State, Action> = {
  initial: (config) => ({ cards: (config.cards ?? []).map((card) => ({ ...card, rev: 0 })) }),
  reduce(state, action, config) {
    const column = (id: string) => {
      if (!config.columns.some((c) => c.id === id)) throw new Error(`there is no column "${id}". Columns: ${config.columns.map((c) => c.id).join(", ")}`);
      return id;
    };
    const find = (id: string) => {
      const card = state.cards.find((c) => c.id === id);
      if (!card) throw new Error(`there is no card "${id}". Cards: ${state.cards.map((c) => c.id).join(", ") || "none yet"}`);
      return card;
    };
    switch (action.type) {
      case "add": {
        const { type: _type, to, ...fields } = action;
        if (state.cards.some((c) => c.id === action.id)) throw new Error(`there is already a card "${action.id}"`);
        return { cards: fits([{ ...fields, column: column(to), rev: 1, how: "land" }, ...state.cards], to) };
      }
      case "move": {
        const card = find(action.card);
        if (card.column === column(action.to)) throw new Error(`"${card.id}" is already in "${action.to}"`);
        const rest = state.cards.filter((c) => c !== card);
        return { cards: fits([{ ...card, column: action.to, rev: card.rev + 1, how: "land" }, ...rest], action.to) };
      }
      case "set": {
        const { type: _type, card: id, ...fields } = action;
        const card = find(id);
        if (Object.keys(fields).length === 0) throw new Error(`"set" on "${id}" changes nothing. Name a field: title, subtitle, value, tag or tone`);
        return { cards: state.cards.map((c) => (c === card ? { ...c, ...fields, rev: c.rev + 1, how: "flash" } : c)) };
      }
    }
  },
};
