import type { Tone } from "../tones.ts";
import type { PanelLogic } from "../types.ts";
import type { Action, Config, Point } from "./schema.ts";

export interface Tile {
  id: string;
  label: string;
  value: string;
  delta?: string;
  tone?: Tone;
  /** How many times the demo has changed this tile. The view flashes it when this changes. */
  rev: number;
}

export interface State {
  tiles: Tile[];
  /** The chart's bars, left to right. */
  points: Point[];
  /** How many times the demo has changed the chart. The view draws the chart in again when this changes. */
  pushes: number;
}

export const POINTS_MAX = 12;

export const logic: PanelLogic<Config, State, Action> = {
  icon: "chart",
  initial: (config) => ({ tiles: config.tiles.map((tile) => ({ ...tile, rev: 0 })), points: config.chart?.points ?? [], pushes: 0 }),
  reduce(state, action, config) {
    switch (action.type) {
      case "set": {
        const { type: _type, tile: id, ...fields } = action;
        if (!state.tiles.some((tile) => tile.id === id)) throw new Error(`there is no tile "${id}". Tiles: ${state.tiles.map((tile) => tile.id).join(", ")}`);
        return { ...state, tiles: state.tiles.map((tile) => (tile.id === id ? { ...tile, ...fields, rev: tile.rev + 1 } : tile)) };
      }
      case "push": {
        if (!config.chart) throw new Error("this board has no chart to push to. Add `chart` to the panel's config.");
        const point = { label: action.label, value: action.value };
        const known = state.points.some((p) => p.label === point.label);
        const points = known ? state.points.map((p) => (p.label === point.label ? point : p)) : [...state.points, point];
        if (points.length > POINTS_MAX) throw new Error(`the chart would hold ${points.length} bars and fits ${POINTS_MAX}`);
        return { ...state, points, pushes: state.pushes + 1 };
      }
    }
  },
};
