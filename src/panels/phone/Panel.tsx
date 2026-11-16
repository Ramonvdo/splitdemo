import "./skin.css";
import { TapDot } from "../../engine/TapDot.tsx";
import { cn } from "../../lib/style.ts";
import { Glyph } from "../glyphs.tsx";
import type { PanelProps } from "../types.ts";
import type { State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

/** A phone screen with one message thread. The viewer is looking over the shoulder of the phone's owner. */
export default function Panel({ config, state, pending, onTrigger, clock }: PanelProps<Config, State, Action>) {
  const draft = pending?.type === "send" ? pending.text : undefined;
  return (
    <div className="relative flex h-full flex-col">
      <div className="relative flex items-center justify-between bg-app-wash px-[1.5rem] pt-[0.75rem] text-meta font-semibold">
        <span className="tabular-nums">{clock ?? " "}</span>
        {/* The camera, in the middle of the top edge. */}
        <span aria-hidden="true" className="absolute left-1/2 top-[0.55rem] h-[1.5rem] w-[5.2rem] -translate-x-1/2 rounded-full bg-ink" />
        <span className="flex items-center gap-[0.3rem]" aria-hidden="true">
          <Glyph name="signal" className="size-[1.05rem]" />
          <Glyph name="battery" className="size-[1.5rem]" />
        </span>
      </div>

      <header className="relative flex flex-col items-center border-b border-line bg-app-wash px-[2.6rem] pb-[0.55rem] pt-[0.7rem] text-center">
        <Glyph name="back" className="absolute left-[0.8rem] top-[1.2rem] size-[1.5rem] text-mark" />
        <span className="grid size-[2.5rem] shrink-0 place-items-center rounded-full bg-muted text-lead font-medium text-window" aria-hidden="true">
          {config.contact.slice(0, 1)}
        </span>
        <p className="mt-[0.25rem] max-w-full truncate text-meta font-medium">{config.contact}</p>
        {config.subtitle && <p className="max-w-full truncate text-meta text-muted">{config.subtitle}</p>}
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Under the title, so the viewer still reads whose thread this is. */}
        {state.notice && (
          <div key={state.notice.text} className="absolute inset-x-[0.6rem] top-[0.6rem] z-10 flex animate-land items-start gap-[0.7rem] rounded-[1.3rem] border border-line bg-window px-[0.8rem] py-[0.7rem]" role="status">
            <span aria-hidden="true" className="mt-[0.1rem] grid size-[2.2rem] shrink-0 place-items-center rounded-[0.6rem] bg-app text-on-app">
              <Glyph name="person" className="size-[1.3rem]" />
            </span>
            <span className="min-w-0">
              <span className="block text-meta font-semibold">{state.notice.title}</span>
              <span className="block leading-snug">{state.notice.text}</span>
            </span>
          </div>
        )}

        {/* Newest at the bottom; older messages slide up and out of view. */}
        <ol className="flex min-h-0 flex-1 flex-col justify-end gap-[0.4rem] overflow-hidden px-[0.9rem] py-[0.8rem]">
          {state.messages.map((message, i) =>
            message.from === "event" ? (
              <li key={i} className="shrink-0 animate-land self-center py-[0.15rem] text-center text-meta font-medium text-muted">
                {message.text}
              </li>
            ) : (
              <li
                key={i}
                className={cn(
                  "max-w-[80%] shrink-0 animate-land whitespace-pre-line rounded-[1.3rem] px-[0.9rem] py-[0.5rem] leading-snug",
                  message.from === "me" ? "self-end rounded-br-[0.4rem] bg-app text-on-app" : "self-start rounded-bl-[0.4rem] bg-wash",
                )}
              >
                <span className="sr-only">{message.from === "me" ? "Sent: " : "Received: "}</span>
                {message.text}
              </li>
            ),
          )}
          {state.typing && (
            <li key="typing" className="flex shrink-0 animate-pop gap-[0.3rem] self-start rounded-[1.3rem] rounded-bl-[0.4rem] bg-wash px-[0.95rem] py-[0.8rem]" aria-label="Typing">
              {[0, 1, 2].map((i) => (
                <span key={i} className="size-[0.45rem] animate-blink rounded-full bg-muted" style={{ animationDelay: `${i * 180}ms` }} />
              ))}
            </li>
          )}
        </ol>
      </div>

      <div className="flex items-end gap-[0.5rem] px-[0.7rem] pt-[0.5rem]">
        <span aria-hidden="true" className="grid size-[2.4rem] shrink-0 place-items-center rounded-full bg-wash text-muted">
          <Glyph name="plus" className="size-[1.1rem]" />
        </span>
        <p className={cn("min-h-[2.4rem] min-w-0 flex-1 rounded-[1.2rem] border border-line px-[0.9rem] py-[0.45rem] leading-snug", !draft && "text-muted")}>{draft ?? config.subtitle ?? "Message"}</p>
        <button
          type="button"
          aria-label="Send"
          disabled={!draft}
          onClick={onTrigger}
          className="relative grid size-[2.4rem] shrink-0 place-items-center rounded-full bg-app text-on-app disabled:bg-wash disabled:text-muted"
        >
          <svg viewBox="0 0 24 24" className="size-[1.2rem]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
          {draft && <TapDot />}
        </button>
      </div>
      {/* The bar a phone without a home button has along its bottom edge. */}
      <span aria-hidden="true" className="mx-auto mb-[0.45rem] mt-[0.55rem] h-[0.32rem] w-[8rem] shrink-0 rounded-full bg-ink" />
    </div>
  );
}
