import { expect, it } from "vitest";
import { elbow } from "./route.ts";

// Worked by hand on squared paper: out level, one turn on the line between the two columns, in level.
it("joins two steps on the same height with a straight line", () => {
  expect(elbow({ x: 0, y: 40 }, { x: 100, y: 40 }, 50, 10)).toBe("M 0 40 H 100");
});

it("drops to a lower step with a rounded turn at each end of the drop", () => {
  expect(elbow({ x: 0, y: 0 }, { x: 100, y: 60 }, 50, 10)).toBe("M 0 0 H 40 Q 50 0 50 10 V 50 Q 50 60 60 60 H 100");
});

it("climbs to a higher step the same way, mirrored", () => {
  expect(elbow({ x: 0, y: 60 }, { x: 100, y: 0 }, 50, 10)).toBe("M 0 60 H 40 Q 50 60 50 50 V 10 Q 50 0 60 0 H 100");
});

it("tightens the turns when the drop is shorter than two of them", () => {
  expect(elbow({ x: 0, y: 0 }, { x: 100, y: 12 }, 50, 10)).toBe("M 0 0 H 44 Q 50 0 50 6 V 6 Q 50 12 56 12 H 100");
});
