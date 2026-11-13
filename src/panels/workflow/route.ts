export interface Point {
  x: number;
  y: number;
}

/**
 * The line from one step's icon to the next, as SVG path data.
 * It leaves level, turns once at `turn` (the line between the two columns, where no label reaches) and arrives level.
 * So a line never runs under a label, whatever the canvas measures.
 */
export function elbow(from: Point, to: Point, turn: number, radius: number): string {
  const drop = to.y - from.y;
  if (Math.abs(drop) < 1) return `M ${from.x} ${from.y} H ${to.x}`;
  const way = Math.sign(drop);
  const r = Math.max(0, Math.min(radius, Math.abs(drop) / 2, turn - from.x, to.x - turn));
  return [
    `M ${from.x} ${from.y}`,
    `H ${turn - r}`,
    `Q ${turn} ${from.y} ${turn} ${from.y + way * r}`,
    `V ${to.y - way * r}`,
    `Q ${turn} ${to.y} ${turn + r} ${to.y}`,
    `H ${to.x}`,
  ].join(" ");
}
