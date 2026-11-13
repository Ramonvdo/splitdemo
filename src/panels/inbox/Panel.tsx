import { cn } from "../../lib/style.ts";
import { TONES } from "../tones.ts";
import type { PanelProps } from "../types.ts";
import type { Mail, State } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

function Tag({ mail }: { mail: Mail }) {
  if (!mail.tag) return null;
  return <span className={cn("shrink-0 rounded-full px-[0.55rem] py-[0.05rem] text-meta font-medium", TONES[mail.tone ?? "idle"])}>{mail.tag}</span>;
}

/** A mailbox. New mail lands on top; an opened mail shows next to the list with its reply under it. */
export default function Panel({ config, state }: PanelProps<Config, State, Action>) {
  const open = state.mails.find((mail) => mail.id === state.open);
  const unread = state.mails.filter((mail) => mail.unread).length;
  return (
    <div className={cn("grid h-full", open ? "grid-cols-[minmax(0,5fr)_minmax(0,7fr)] @max-[30rem]:grid-cols-1" : "grid-cols-1")}>
      {/* On a narrow monitor an opened mail takes the whole window. */}
      <div className={cn("flex min-h-0 min-w-0 flex-col", open && "@max-[30rem]:hidden")}>
        <h3 className="flex items-baseline justify-between gap-2 border-b border-line px-[0.9rem] py-[0.6rem] text-meta font-semibold">
          <span className="truncate">{config.title ?? "Inbox"}</span>
          <span className="shrink-0 tabular-nums text-muted">{unread ? `${unread} new` : ""}</span>
        </h3>
        <ul className="min-h-0 flex-1">
          {state.mails.map((mail) => (
            // A received or labelled mail gets a new key, so it mounts again and shows what changed.
            <li
              key={`${mail.id}:${mail.rev}`}
              data-mail={mail.id}
              data-unread={mail.unread || undefined}
              className={cn("flex gap-[0.6rem] border-b border-line py-[0.55rem] pl-[0.7rem] pr-[0.9rem]", mail === open && "bg-wash", mail.how === "land" && "flash animate-land", mail.how === "flash" && "flash")}
            >
              <span className={cn("mt-[0.42rem] size-[0.5rem] shrink-0 rounded-full", mail.unread && "bg-info")}>{mail.unread && <span className="sr-only">Unread</span>}</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline justify-between gap-2">
                  <span className={cn("truncate", mail.unread && "font-semibold")}>{mail.from}</span>
                  {mail.time && <span className="shrink-0 text-meta tabular-nums text-muted">{mail.time}</span>}
                </p>
                <p className="flex items-center justify-between gap-2 text-meta">
                  <span className={cn("truncate", !mail.unread && "text-muted")}>{mail.subject}</span>
                  <Tag mail={mail} />
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {open && (
        <article key={open.id} data-reading={open.id} className="flex min-h-0 min-w-0 animate-fade flex-col gap-[0.55rem] border-l border-line p-[0.9rem] @max-[30rem]:border-l-0">
          <h4 className="truncate text-lead font-semibold">{open.subject}</h4>
          <p className="flex items-center gap-[0.5rem] text-meta text-muted">
            <span className="truncate">
              {open.from}
              {open.time && ` · ${open.time}`}
            </span>
            <Tag mail={open} />
          </p>
          {open.body && <p>{open.body}</p>}
          {open.reply && (
            <div key={open.reply.text} className="mt-auto animate-land rounded-control border border-line bg-wash px-[0.8rem] py-[0.6rem]">
              <p className="text-meta font-semibold text-muted">{open.reply.label ?? "Reply"}</p>
              <p>{open.reply.text}</p>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
