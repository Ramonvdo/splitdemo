import type { PanelLogic } from "../types.ts";
import type { Action, Config, Message } from "./schema.ts";

export interface State {
  messages: Message[];
  /** The contact is typing. */
  typing: boolean;
  notice?: { title: string; text: string };
}

export const logic: PanelLogic<Config, State, Action> = {
  icon: "phone",
  portrait: true,
  triggers: ["send"],
  initial: (config) => ({ messages: config.messages ?? [], typing: false }),
  reduce(state, action) {
    switch (action.type) {
      case "send":
        return { messages: [...state.messages, { from: "me", text: action.text }], typing: state.typing };
      case "receive":
        return { messages: [...state.messages, { from: "them", text: action.text }], typing: false };
      case "event":
        return { ...state, messages: [...state.messages, { from: "event", text: action.text }] };
      case "typing":
        return { ...state, typing: true };
      case "notify":
        return { ...state, notice: { title: action.title, text: action.text } };
    }
  },
};
