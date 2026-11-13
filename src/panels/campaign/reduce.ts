import type { Tone } from "../tones.ts";
import type { PanelLogic } from "../types.ts";
import type { Action, Config } from "./schema.ts";

export interface Stat {
  id: string;
  label: string;
  value: string;
  tone?: Tone;
  /** How many times the demo has changed this counter. The view flashes it when this changes. */
  rev: number;
}

export interface State {
  status?: { text: string; tone?: Tone; rev: number };
  /** The ids of the steps that have gone out, in order. */
  sent: string[];
  /** What each sent step says about how it went. */
  notes: Record<string, string>;
  stats: Stat[];
}

export const logic: PanelLogic<Config, State, Action> = {
  icon: "send",
  initial(config) {
    const state: State = { sent: [], notes: {}, stats: config.stats.map((stat) => ({ ...stat, rev: 0 })) };
    if (config.status) state.status = { ...config.status, rev: 0 };
    return state;
  },
  reduce(state, action, config) {
    switch (action.type) {
      case "status": {
        const status: State["status"] = { text: action.text, rev: (state.status?.rev ?? 0) + 1 };
        if (action.tone) status.tone = action.tone;
        return { ...state, status };
      }
      case "send": {
        const ids = config.steps.map((step) => step.id);
        const at = ids.indexOf(action.step);
        if (at < 0) throw new Error(`there is no step "${action.step}". Steps: ${ids.join(", ")}`);
        if (state.sent.includes(action.step)) throw new Error(`"${action.step}" has already gone out`);
        if (at > state.sent.length) throw new Error(`"${action.step}" goes out after "${ids[state.sent.length]}". Send that one first.`);
        return { ...state, sent: [...state.sent, action.step], notes: action.note ? { ...state.notes, [action.step]: action.note } : state.notes };
      }
      case "stat": {
        if (!state.stats.some((stat) => stat.id === action.stat)) throw new Error(`there is no counter "${action.stat}". Counters: ${state.stats.map((stat) => stat.id).join(", ")}`);
        return {
          ...state,
          stats: state.stats.map((stat) => {
            if (stat.id !== action.stat) return stat;
            const next: Stat = { ...stat, value: action.value, rev: stat.rev + 1 };
            if (action.tone) next.tone = action.tone;
            return next;
          }),
        };
      }
    }
  },
};
