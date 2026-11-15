import type { Tone } from "../tones.ts";
import type { PanelLogic } from "../types.ts";
import type { Action, Config } from "./schema.ts";

/** A day shows this many bookings, each with a title of up to two lines. More and the bottom ones fall off the monitor. */
export const DAY_MAX = 3;

export interface Booking {
  id: string;
  day: string;
  /** "HH:MM", so plain text order is time order. */
  time: string;
  title: string;
  tone?: Tone;
  cancelled?: boolean;
  /** How many times the demo has touched this booking. */
  rev: number;
  /** How the last touch shows: the booking lands (booked, moved) or flashes (cancelled). */
  how?: "land" | "flash";
}

export interface State {
  /** By day, left to right, and then by time. */
  events: Booking[];
}

export const logic: PanelLogic<Config, State, Action> = {
  icon: "calendar",
  initial: (config) => sorted((config.events ?? []).map((event) => ({ ...event, rev: 0 })), config),
  reduce(state, action, config) {
    const days = config.days.map((day) => day.id);
    const day = (id: string) => {
      if (!days.includes(id)) throw new Error(`there is no day "${id}". Days: ${days.join(", ")}`);
      return id;
    };
    const find = (id: string) => {
      const event = state.events.find((e) => e.id === id);
      if (!event) throw new Error(`there is no booking "${id}". Bookings: ${state.events.map((e) => e.id).join(", ") || "none yet"}`);
      return event;
    };
    /** The bookings left once `at` is free for `mover`: a cancelled booking in that slot makes way. Throws when a live one holds it or the day is full. */
    const free = (at: { day: string; time: string }, mover?: Booking) => {
      const others = state.events.filter((e) => e !== mover);
      const holder = others.find((e) => e.day === at.day && e.time === at.time && !e.cancelled);
      if (holder) throw new Error(`${at.day} ${at.time} is taken by "${holder.id}"`);
      const rest = others.filter((e) => !(e.day === at.day && e.time === at.time));
      const count = rest.filter((e) => e.day === at.day).length + 1;
      if (count > DAY_MAX) throw new Error(`"${at.day}" would hold ${count} bookings and fits ${DAY_MAX}`);
      return rest;
    };
    switch (action.type) {
      case "book": {
        day(action.day);
        if (state.events.some((e) => e.id === action.id)) throw new Error(`there is already a booking "${action.id}"`);
        const booking: Booking = { id: action.id, day: action.day, time: action.time, title: action.title, rev: 1, how: "land" };
        if (action.tone) booking.tone = action.tone;
        return sorted([...free(action), booking], config);
      }
      case "move": {
        const event = find(action.event);
        if (event.cancelled) throw new Error(`"${event.id}" is cancelled, so it cannot move`);
        day(action.day);
        if (event.day === action.day && event.time === action.time) throw new Error(`"${event.id}" is already on ${event.day} at ${event.time}`);
        return sorted([...free(action, event), { ...event, day: action.day, time: action.time, rev: event.rev + 1, how: "land" }], config);
      }
      case "cancel": {
        const event = find(action.event);
        if (event.cancelled) throw new Error(`"${event.id}" is already cancelled`);
        return { events: state.events.map((e) => (e === event ? { ...e, cancelled: true, rev: e.rev + 1, how: "flash" } : e)) };
      }
    }
  },
};

/** A booking's time as the viewer reads it: "13:00", or "1:00 PM" on a calendar that shows AM and PM. */
export function shown(time: string, ampm?: boolean): string {
  if (!ampm) return time;
  const [hours, minutes] = time.split(":");
  const h = Number(hours);
  return `${h % 12 || 12}:${minutes} ${h < 12 ? "AM" : "PM"}`;
}

function sorted(events: Booking[], config: Config): State {
  const at = (id: string) => config.days.findIndex((day) => day.id === id);
  return { events: [...events].sort((a, b) => at(a.day) - at(b.day) || a.time.localeCompare(b.time)) };
}
