import type { PanelLogic } from "../types.ts";
import type { Action, Config } from "./schema.ts";

export interface State {
  /** The answers so far, by field id. */
  values: Record<string, string>;
  /** The field filled last. The view marks it as the one being typed in. */
  last?: string;
  sent: boolean;
}

export const logic: PanelLogic<Config, State, Action> = {
  portrait: true,
  triggers: ["submit"],
  initial: () => ({ values: {}, sent: false }),
  reduce(state, action, config) {
    switch (action.type) {
      case "fill": {
        const field = config.fields.find((f) => f.id === action.field);
        if (!field) throw new Error(`there is no field "${action.field}". Fields: ${config.fields.map((f) => f.id).join(", ")}`);
        if (state.sent) throw new Error(`the form is already sent, so "${field.id}" cannot be filled in`);
        if (field.options && !field.options.includes(action.value)) throw new Error(`"${action.value}" is not an answer to "${field.id}". Answers: ${field.options.join(", ")}`);
        return { values: { ...state.values, [field.id]: action.value }, last: field.id, sent: false };
      }
      case "submit": {
        if (state.sent) throw new Error("the form is already sent");
        if (Object.keys(state.values).length === 0) throw new Error("the form is empty. Fill in a field before it is sent");
        return { values: state.values, sent: true };
      }
    }
  },
};
