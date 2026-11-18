import type { IconName } from "./icons.tsx";

/**
 * What a panel preset is made of.
 *
 * Logic (reduce.ts) is pure and has no React in it, so the check script can dry-run a whole demo in node.
 * The view (Panel.tsx) draws config + state and nothing else.
 */
export interface PanelLogic<C = any, S = any, A extends { type: string } = any> {
  /** Stands for the panel where there is no room for its label: a tab on a phone. */
  icon: IconName;
  initial(config: C): S;
  /** Returns the next state. Throws, with a message a demo author can act on, when the action is impossible. */
  reduce(state: S, action: A, config: C): S;
  /** Action types a viewer can press themselves, so a beat may `wait` on them. */
  triggers?: A["type"][];
  /** Drawn tall and narrow: takes the full-height slot of the rail layout. */
  portrait?: boolean;
  /**
   * Explainer mode gives every change time to be read: by default the words in the action itself.
   * Answer here for an action where that is wrong: the `words` it really puts on screen, or that it `travels` in along a line first.
   * `state` is the panel before the change.
   */
  pace?(action: A, state: S, config: C): { words?: number; travels?: boolean } | undefined;
}

export interface PanelProps<C = any, S = any, A = any> {
  config: C;
  state: S;
  /** The action the demo is waiting on the viewer to press. */
  pending?: A;
  /** Press the pending action. */
  onTrigger?: () => void;
  /** The action is on this panel right now: its label carries the tally. Something that is "running" runs only while this is true. */
  live?: boolean;
  /** The time in the story right now, e.g. "21:14". */
  clock?: string;
  /**
   * The stage jumped here (a step back, a screenshot), so show the picture finished.
   * CSS animation is already stopped for you; this is for motion a panel drives from JavaScript.
   */
  still?: boolean;
}
