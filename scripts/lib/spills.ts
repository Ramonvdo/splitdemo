import type { Page } from "@playwright/test";

/** The stage, once every part of it that loads on its own has arrived. Wait for this before judging a picture. */
export const READY = "main.stage:not(:has([data-loading]))";

/**
 * Everything under `root` that does not fit where it is, each with the panel it is in.
 * Hidden monitors count too: they are laid out, only not painted.
 * It measures once the page's own typefaces are in: text set in the stand-in face is wider, and gets cut where the real one fits.
 */
export function spills(page: Page, root = "main.stage"): Promise<string[]> {
  return page.evaluate(async (root) => {
    await document.fonts.ready;
    const out: string[] = [];
    const doc = document.documentElement;
    const scrolls = doc.scrollWidth > innerWidth || doc.scrollHeight > innerHeight;
    // What a scrolling page is blamed on: the first text that reaches past the window.
    let past: string | undefined;
    for (const el of document.querySelectorAll<HTMLElement>(`${root} *`)) {
      if (el.closest("svg")) continue;
      // Text for screen readers only is clipped to a pixel on purpose.
      if (el.clientWidth <= 1 && el.clientHeight <= 1) continue;
      const style = getComputedStyle(el);
      const box = el.closest<HTMLElement>("[data-panel], [data-example]");
      const where = box?.dataset.panel ?? box?.dataset.example ?? "outside the panels";
      const text = el.textContent?.slice(0, 40);
      if (scrolls && !past && !el.firstElementChild && text) {
        const rect = el.getBoundingClientRect();
        if (rect.right > innerWidth + 1 || rect.bottom > innerHeight + 1) past = `${where}: ${text}`;
      }
      if (style.textOverflow === "ellipsis") {
        // Three dots hide the rest of something the viewer came to read.
        if (el.scrollWidth > el.clientWidth + 1) out.push(`${where}, cut short: ${text}`);
        continue;
      }
      if (el.scrollWidth > el.clientWidth + 1 && style.overflowX !== "visible") out.push(`${where}, cut off sideways: ${text}`);
      if (el.scrollHeight > el.clientHeight + 1 && style.overflowY === "hidden" && !el.dataset.scrolls) out.push(`${where}, cut off below: ${text}`);
    }
    if (scrolls) out.unshift(past ? `the page scrolls, first past the edge: ${past}` : "the page scrolls");
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
