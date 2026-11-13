/** A step as the layout needs it. */
export interface Step {
  id: string;
  after?: string[];
}

export interface Placed {
  /** Column and row of each step, by id. `rows` is how many steps share its column. */
  at: Record<string, { col: number; row: number; rows: number }>;
  cols: number;
}

/** A canvas this wide and this tall still reads at a glance. */
export const MAX_COLS = 6;
export const MAX_ROWS = 3;

/**
 * Lays steps out left to right: a step sits one column past the last step it comes after.
 * Steps that share a column stack in the order they were written. Throws when the flow cannot be drawn.
 */
export function place(steps: Step[]): Placed {
  const byId = new Map(steps.map((step) => [step.id, step]));
  if (byId.size !== steps.length) throw new Error("two nodes share an id");
  const col = new Map<string, number>();
  const visit = (step: Step, trail: string[]): number => {
    const known = col.get(step.id);
    if (known !== undefined) return known;
    if (trail.includes(step.id)) throw new Error(`"${step.id}" comes after itself: ${[...trail, step.id].join(" > ")}`);
    let at = 0;
    for (const id of step.after ?? []) {
      const before = byId.get(id);
      if (!before) throw new Error(`"${step.id}" comes after "${id}", which is not a node`);
      at = Math.max(at, visit(before, [...trail, step.id]) + 1);
    }
    col.set(step.id, at);
    return at;
  };
  for (const step of steps) visit(step, []);

  const cols = Math.max(...col.values()) + 1;
  if (cols > MAX_COLS) throw new Error(`the flow is ${cols} steps long and the canvas fits ${MAX_COLS}. Merge steps that the viewer does not need to tell apart.`);
  const counts = new Array<number>(cols).fill(0);
  const at: Placed["at"] = {};
  for (const step of steps) at[step.id] = { col: col.get(step.id)!, row: counts[col.get(step.id)!]++, rows: 0 };
  for (const spot of Object.values(at)) spot.rows = counts[spot.col];
  const tall = counts.findIndex((count) => count > MAX_ROWS);
  if (tall >= 0) throw new Error(`${counts[tall]} nodes share step ${tall + 1} and the canvas fits ${MAX_ROWS} on top of each other`);
  return { at, cols };
}
