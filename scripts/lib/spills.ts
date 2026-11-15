import type { Page } from "@playwright/test";

/** The stage, once every part of it that loads on its own has arrived. Wait for this before judging a picture. */
export const READY = "main.stage:not(:has([data-loading]))";

/**
 * Everything under `root` that does not fit where it is, each with the panel it is in.
 * Hidden monitors count too: they are laid out, only not painted.
 */
export function spills(page: Page, root = "main.stage"): Promise<string[]> {
  return page.evaluate((root) => {
    const out: string[] = [];
    const doc = document.documentElement;
    if (doc.scrollWidth > innerWidth || doc.scrollHeight > innerHeight) out.push("the page scrolls");
    for (const el of document.querySelectorAll<HTMLElement>(`${root} *`)) {
      const style = getComputedStyle(el);
      // Ellipsis is a choice the panel made; anything else that does not fit is a spill.
      if (style.textOverflow === "ellipsis" || el.closest("svg")) continue;
      // Text for screen readers only is clipped to a pixel on purpose.
      if (el.clientWidth <= 1 && el.clientHeight <= 1) continue;
      const box = el.closest<HTMLElement>("[data-panel], [data-example]");
      const where = box?.dataset.panel ?? box?.dataset.example ?? "outside the panels";
      if (el.scrollWidth > el.clientWidth + 1 && style.overflowX !== "visible") out.push(`${where}, cut off sideways: ${el.textContent?.slice(0, 40)}`);
      if (el.scrollHeight > el.clientHeight + 1 && style.overflowY === "hidden" && !el.dataset.scrolls) out.push(`${where}, cut off below: ${el.textContent?.slice(0, 40)}`);
    }
    return out;
  }, root);
}

/** Waits until everything that is moving in has landed. A check made mid-fade measures a colour nobody ever reads. */
export function settle(page: Page): Promise<unknown> {
  return page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}
