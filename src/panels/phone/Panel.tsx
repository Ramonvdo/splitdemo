import { TapDot } from "../../engine/TapDot.tsx";
import { cn } from "../../lib/utils.ts";
import type { PanelProps } from "../types.ts";
import type { State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

/** A phone screen with one message thread. The viewer is looking over the shoulder of the phone's owner. */
export default function Panel({ config, state, pending, onTrigger, clock }: PanelProps<Config, State, Action>) {
  const draft = pending?.type === "send" ? pending.text : undefined;
  return (
    <div className="relative flex h-full flex-col">
      <div className="flex items-center justify-between px-[1.4rem] pt-[0.8rem] text-meta font-semibold tabular-nums">
        <span>{clock ?? " "}</span>
        <span className="flex items-end gap-[0.18rem]" aria-hidden="true">
          {[0.35, 0.5, 0.65, 0.8].map((h) => (
            <span key={h} className="w-[0.2rem] rounded-full bg-ink" style={{ height: `${h}rem` }} />
          ))}
        </span>
      </div>

      <header className="flex items-center gap-[0.75rem] border-b border-line px-[1.1rem] py-[0.8rem]">
        <span className="grid size-[2.5rem] shrink-0 place-items-center rounded-full bg-wash text-lead font-semibold" aria-hidden="true">
          {config.contact.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lead font-semibold leading-tight">{config.contact}</p>
          {config.subtitle && <p className="truncate text-meta text-muted">{config.subtitle}</p>}
        </div>
      </header>

      {state.notice && (
        <div key={state.notice.text} className="absolute inset-x-[0.7rem] top-[0.7rem] z-10 animate-land rounded-monitor bg-ink px-[1rem] py-[0.75rem] text-window" role="status">
          <p className="text-meta font-semibold opacity-70">{state.notice.title}</p>
          <p className="leading-snug">{state.notice.text}</p>
        </div>
      )}

      {/* Newest at the bottom; older messages slide up and out of view. */}
      <ol className="flex min-h-0 flex-1 flex-col justify-end gap-[0.5rem] overflow-hidden px-[1rem] py-[0.9rem]">
        {state.messages.map((message, i) => (
          <li
            key={i}
            className={cn(
              "max-w-[84%] shrink-0 animate-land whitespace-pre-line rounded-[1.25rem] px-[0.95rem] py-[0.55rem] leading-snug",
              message.from === "me" ? "self-end rounded-br-[0.35rem] bg-ink text-window" : "self-start rounded-bl-[0.35rem] bg-wash",
            )}
          >
            <span className="sr-only">{message.from === "me" ? "Sent: " : "Received: "}</span>
            {message.text}
          </li>
        ))}
        {state.typing && (
          <li key="typing" className="flex shrink-0 animate-pop gap-[0.3rem] self-start rounded-[1.25rem] rounded-bl-[0.35rem] bg-wash px-[0.95rem] py-[0.8rem]" aria-label="Typing">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-[0.45rem] animate-blink rounded-full bg-muted" style={{ animationDelay: `${i * 180}ms` }} />
            ))}
          </li>
        )}
      </ol>

      <div className="flex items-end gap-[0.6rem] border-t border-line px-[0.8rem] py-[0.7rem]">
        <p className={cn("min-h-[2.6rem] min-w-0 flex-1 rounded-[1.3rem] border border-line px-[0.95rem] py-[0.55rem] leading-snug", !draft && "text-muted")}>{draft ?? "Message"}</p>
        <button
          type="button"
          aria-label="Send"
          disabled={!draft}
          onClick={onTrigger}
          className="relative grid size-[2.6rem] shrink-0 place-items-center rounded-full bg-ink text-window disabled:bg-wash disabled:text-muted"
        >
          <svg viewBox="0 0 24 24" className="size-[1.2rem]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
          {draft && <TapDot />}
        </button>
      </div>
    </div>
  );
}
