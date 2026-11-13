import type { Tone } from "../tones.ts";
import type { PanelLogic } from "../types.ts";
import type { Action, Config } from "./schema.ts";

export interface Mail {
  id: string;
  from: string;
  subject: string;
  body?: string;
  time?: string;
  tag?: string;
  tone?: Tone;
  unread: boolean;
  /** The reply under this mail, and who wrote it. */
  reply?: { text: string; label?: string };
  /** How many times the demo has changed how this mail looks in the list. */
  rev: number;
  /** How the last change shows: the mail lands (received) or flashes (labelled). */
  how?: "land" | "flash";
}

export interface State {
  /** Newest first. */
  mails: Mail[];
  /** The mail shown next to the list. */
  open?: string;
}

/** More mails than this and the bottom ones fall off the monitor. */
export const MAILS_MAX = 5;

export const logic: PanelLogic<Config, State, Action> = {
  icon: "mail",
  initial: (config) => ({ mails: (config.mails ?? []).map((mail) => ({ ...mail, unread: mail.unread ?? false, rev: 0 })) }),
  reduce(state, action) {
    const find = (id: string) => {
      const mail = state.mails.find((m) => m.id === id);
      if (!mail) throw new Error(`there is no mail "${id}". Mails: ${state.mails.map((m) => m.id).join(", ") || "none yet"}`);
      return mail;
    };
    const change = (mail: Mail, to: Partial<Mail>) => state.mails.map((m) => (m === mail ? { ...m, ...to } : m));
    switch (action.type) {
      case "receive": {
        const { type: _type, ...fields } = action;
        if (state.mails.some((m) => m.id === action.id)) throw new Error(`there is already a mail "${action.id}"`);
        if (state.mails.length + 1 > MAILS_MAX) throw new Error(`the inbox would hold ${state.mails.length + 1} mails and fits ${MAILS_MAX}`);
        return { ...state, mails: [{ ...fields, unread: true, rev: 1, how: "land" }, ...state.mails] };
      }
      case "open": {
        const mail = find(action.mail);
        if (state.open === mail.id) throw new Error(`"${mail.id}" is already open`);
        return { mails: change(mail, { unread: false }), open: mail.id };
      }
      case "tag": {
        const mail = find(action.mail);
        const to: Partial<Mail> = { tag: action.tag, rev: mail.rev + 1, how: "flash" };
        if (action.tone) to.tone = action.tone;
        return { ...state, mails: change(mail, to) };
      }
      case "reply": {
        const mail = find(action.mail);
        const reply: Mail["reply"] = { text: action.text };
        if (action.label) reply.label = action.label;
        return { mails: change(mail, { unread: false, reply }), open: mail.id };
      }
    }
  },
};
