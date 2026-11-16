import "./skin.css";
import { cn } from "../../lib/style.ts";
import { Glyph } from "../glyphs.tsx";
import { Icon } from "../icons.tsx";
import type { PanelProps } from "../types.ts";
import type { Mail, State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

function Tag({ mail }: { mail: Mail }) {
  if (!mail.tag) return null;
  return (
    <span data-tone={mail.tone ?? "idle"} className="shrink-0 rounded-[0.3rem] px-[0.45rem] py-[0.05rem] text-meta font-medium">
      {mail.tag}
    </span>
  );
}

/** A mailbox. New mail lands on top; an opened mail shows next to the list with its reply under it. */
export default function Panel({ config, state }: PanelProps<Config, State, Action>) {
  const open = state.mails.find((mail) => mail.id === state.open);
  const unread = state.mails.filter((mail) => mail.unread).length;
  return (
    <div className="flex h-full flex-col bg-wash">
      <h3 className="flex h-[2.5rem] shrink-0 items-center gap-[0.6rem] px-[0.8rem] font-medium">
        <Glyph name="lines" className="size-[1.1rem] shrink-0 text-muted" />
        <Icon name="mail" className="size-[1.25rem] shrink-0 text-app" />
        <span className="truncate">{config.title ?? "Inbox"}</span>
        <span className="shrink-0 text-meta font-normal tabular-nums text-muted">{unread ? `${unread} new` : ""}</span>
        <span aria-hidden="true" className="ml-auto flex h-[1.7rem] w-[38%] items-center rounded-full bg-app-wash px-[0.7rem] text-muted @max-[30rem]:hidden">
          <Icon name="search" className="size-[1rem]" />
        </span>
        <span aria-hidden="true" className="grid size-[1.6rem] shrink-0 place-items-center rounded-full bg-app text-on-app @max-[30rem]:ml-auto">
          <Glyph name="person" className="size-[1rem]" />
        </span>
      </h3>
      <div className={cn("grid min-h-0 flex-1", open ? "grid-cols-[minmax(0,5fr)_minmax(0,7fr)] @max-[30rem]:grid-cols-1" : "grid-cols-1")}>
        {/* On a narrow monitor an opened mail takes the whole window. */}
        <ul className={cn("min-h-0 min-w-0 border-t border-line", open && "@max-[30rem]:hidden")}>
          {state.mails.map((mail) => (
            // A received or labelled mail gets a new key, so it mounts again and shows what changed.
            <li
              key={`${mail.id}:${mail.rev}`}
              data-mail={mail.id}
              data-unread={mail.unread || undefined}
              className={cn(
                "flex gap-[0.55rem] border-b border-line py-[0.5rem] pl-[0.7rem] pr-[0.8rem]",
                mail === open ? "bg-app-wash" : mail.unread && "bg-window",
                mail.how === "land" && "flash animate-land",
                mail.how === "flash" && "flash",
              )}
            >
              <span className={cn("mt-[0.45rem] size-[0.5rem] shrink-0 rounded-full", mail.unread && "bg-mark")}>{mail.unread && <span className="sr-only">Unread</span>}</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline justify-between gap-2">
                  <span className={cn("truncate", mail.unread && "font-semibold")}>{mail.from}</span>
                  {mail.time && <span className={cn("shrink-0 text-meta", mail.unread ? "font-semibold" : "text-muted")}>{mail.time}</span>}
                </p>
                <p className="flex items-center justify-between gap-2 text-meta">
                  <span className={cn("truncate", !mail.unread && "text-muted")}>{mail.subject}</span>
                  <Tag mail={mail} />
                </p>
              </div>
            </li>
          ))}
        </ul>

        {open && (
          <article key={open.id} data-reading={open.id} className="mb-[0.6rem] mr-[0.6rem] flex min-h-0 min-w-0 animate-fade flex-col gap-[0.5rem] rounded-[0.9rem] bg-window p-[0.9rem] @max-[30rem]:ml-[0.6rem]">
            <div className="flex items-center gap-[0.6rem]">
              <h4 className="truncate text-lead">{open.subject}</h4>
              <Tag mail={open} />
            </div>
            <p className="flex items-center gap-[0.55rem] text-meta">
              <span aria-hidden="true" className="grid size-[1.7rem] shrink-0 place-items-center rounded-full bg-app-wash font-semibold text-mark">
                {open.from.slice(0, 1)}
              </span>
              <span className="truncate font-semibold">{open.from}</span>
              {open.time && <span className="ml-auto shrink-0 text-muted">{open.time}</span>}
            </p>
            {open.body && <p>{open.body}</p>}
            {open.reply && (
              <div key={open.reply.text} data-reply className="mt-auto animate-land rounded-[0.9rem] border border-line bg-window px-[0.8rem] py-[0.55rem]">
                <p className="flex items-center gap-[0.35rem] text-meta font-semibold text-muted">
                  <Glyph name="reply" className="size-[0.95rem]" />
                  {open.reply.label ?? "Reply"}
                </p>
                <p>{open.reply.text}</p>
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
}
