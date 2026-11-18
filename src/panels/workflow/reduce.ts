import type { PanelLogic } from "../types.ts";
import type { Action, Config } from "./schema.ts";

export interface State {
  /** The ids of the steps that have run, in the order they ran. */
  ran: string[];
  /** The step that ran most recently. */
  last?: string;
  /** That step was reached along the line from a step before it. */
  along?: boolean;
  /** How many times a step has run, so the same step running twice still shows. */
  runs: number;
  /** What a step found or did, by step id. */
  notes: Record<string, string>;
}

/** A step that follows one that ran is reached along the line between them, the first time it runs. */
function along(state: State, id: string, config: Config): boolean {
  const after = config.nodes.find((node) => node.id === id)?.after ?? [];
  return !state.ran.includes(id) && after.some((from) => state.ran.includes(from));
}

export const logic: PanelLogic<Config, State, Action> = {
  icon: "branch",
  initial: () => ({ ran: [], runs: 0, notes: {} }),
  pace: (action, state, config) => (along(state, action.node, config) ? { travels: true } : undefined),
  reduce(state, action, config) {
    const node = config.nodes.find((n) => n.id === action.node);
    if (!node) throw new Error(`there is no node "${action.node}". Nodes: ${config.nodes.map((n) => n.id).join(", ")}`);
    const needs = node.after ?? [];
    if (needs.length && !needs.some((id) => state.ran.includes(id)))
      throw new Error(`"${node.id}" comes after ${needs.map((id) => `"${id}"`).join(" and ")}, which ${needs.length > 1 ? "have" : "has"} not run yet`);
    return {
      ran: state.ran.includes(node.id) ? state.ran : [...state.ran, node.id],
      last: node.id,
      along: along(state, node.id, config),
      runs: state.runs + 1,
      notes: action.note ? { ...state.notes, [node.id]: action.note } : state.notes,
    };
  },
};
