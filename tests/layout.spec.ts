import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const DEMO = "/speed-to-lead/";
const SIZES = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

for (const size of SIZES) {
  test(`nothing spills or gets cut off at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    for (const at of ["0", "3", "end"]) {
      await page.goto(`${DEMO}?at=${at}`);
      await page.locator("main.stage").waitFor();
      const spills = await page.evaluate(() => {
        const out: string[] = [];
        const doc = document.documentElement;
        if (doc.scrollWidth > innerWidth || doc.scrollHeight > innerHeight) out.push("the page scrolls");
        for (const el of document.querySelectorAll<HTMLElement>("main.stage *")) {
          const style = getComputedStyle(el);
          // Ellipsis is a choice the panel made; anything else that does not fit is a spill.
          if (style.textOverflow === "ellipsis" || el.closest("svg")) continue;
          // Text for screen readers only is clipped to a pixel on purpose.
          if (el.clientWidth <= 1 && el.clientHeight <= 1) continue;
          if (el.scrollWidth > el.clientWidth + 1 && style.overflowX !== "visible") out.push(`cut off sideways: ${el.textContent?.slice(0, 40)}`);
          if (el.scrollHeight > el.clientHeight + 1 && style.overflowY === "hidden" && !el.dataset.scrolls) out.push(`cut off below: ${el.textContent?.slice(0, 40)}`);
        }
        return out;
      });
      expect(spills, `at=${at}`).toEqual([]);
    }
  });
}

test("no serious accessibility problems, waiting or finished", async ({ page }) => {
  for (const query of ["", "?at=end"]) {
    await page.goto(DEMO + query);
    await page.locator("main.stage").waitFor();
    const { violations } = await new AxeBuilder({ page }).analyze();
    const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`), query || "start").toEqual([]);
  }
});

test("every control is reachable and named from the keyboard", async ({ page }) => {
  await page.goto(DEMO);
  await page.locator("main.stage").waitFor();
  const names: string[] = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    names.push(await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent ?? ""));
  }
  expect(names).toEqual(expect.arrayContaining(["Send", "Play", "Step forward"]));
});
