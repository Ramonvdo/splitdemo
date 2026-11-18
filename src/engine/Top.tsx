import { cn } from "../lib/style.ts";
import type { Mode } from "./types.ts";
import type { Words } from "./words.ts";

interface TopProps {
  title: string;
  /** The demo's name shows once the story runs. Before that the opening picture carries it. */
  named: boolean;
  mode: Mode;
  /** Tells the demo the other way. Left out while recording: a film is one or the other. */
  onMode?: (mode: Mode) => void;
  w: Words;
}

const MODES: Mode[] = ["explainer", "fast"];

/**
 * The strip over the wall: which way the demo is told, and its name. It keeps its row in a film, so a film's wall is the viewer's wall.
 * Every pixel of it comes off the wall, so it is as low as a pointer can still hit, and it sits closer to the wall than the stage's rows do.
 */
export function Top({ title, named, mode, onMode, w }: TopProps) {
  return (
    <header data-top className="-mb-[0.4rem] flex min-h-[1.6rem] min-w-0 items-center gap-[0.9rem] compact:min-h-[2.4rem]">
      {onMode && (
        <div role="group" aria-label={w.mode} className="flex shrink-0 self-stretch rounded-full border border-stage-line p-[0.1rem]">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => onMode(m)}
              className={cn("rounded-full px-[0.8rem] text-meta font-medium transition-colors duration-200 compact:px-[1rem]", mode === m ? "bg-stage-line text-stage-ink" : "text-stage-muted hover:text-stage-ink")}
            >
              {w[m]}
            </button>
          ))}
        </div>
      )}
      {/* A phone has no room for it next to the switch. */}
      {named && <p className="min-w-0 animate-fade truncate text-meta text-stage-muted compact:hidden">{title}</p>}
    </header>
  );
}
