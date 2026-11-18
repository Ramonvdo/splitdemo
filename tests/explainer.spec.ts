import { expect, test } from "@playwright/test";

// Explainer mode: a step's text alone, then one screen at a time.
const DEMO = "/speed-to-lead/?mode=explainer";

test("a demo opens as the story, and as the wall when its link asks for that", async ({ page }) => {
  await page.goto("/speed-to-lead/");
  await expect(page.locator("main.stage")).toHaveAttribute("data-mode", "explainer");
  await expect(page.locator("[data-slate]")).toContainText("A new patient texts after closing time");
  await expect(page.locator("[data-panel]:visible")).toHaveCount(0);
  await page.goto("/speed-to-lead/?mode=fast");
  await expect(page.locator("main.stage")).toHaveAttribute("data-mode", "fast");
  await expect(page.locator("[data-panel]:visible")).toHaveCount(4);
});

test("a step's text stands alone on the wall before anything of the step shows", async ({ page }) => {
  await page.goto(`${DEMO}&at=1&n=0`);
  const slate = page.locator("[data-slate]");
  await expect(slate).toContainText("Step 2 of 8");
  await expect(slate).toContainText("Nobody is at the desk. The text starts the automation anyway.");
  await expect(page.locator("[data-panel]:visible")).toHaveCount(0);
  // The bar leaves the line to the card.
  await expect(page.locator("[data-caption]")).toHaveCount(0);
});

test("after the text one screen shows, with the text under it", async ({ page }) => {
  await page.goto(`${DEMO}&at=1`);
  await expect(page.locator("[data-slate]")).toHaveCount(0);
  await expect(page.locator("[data-panel]:visible")).toHaveCount(1);
  await expect(page.locator('[data-panel="flow"]')).toBeVisible();
  await expect(page.locator("[data-caption]")).toContainText("Nobody is at the desk.");
});

test("the viewer starts the story, reads the first step, and sends the message themselves", async ({ page }) => {
  await page.goto(DEMO);
  const slate = page.locator("[data-slate]");
  await expect(slate).toContainText("A new patient texts after closing time");
  await slate.getByRole("button", { name: "Play the demo" }).click();
  await expect(slate).toContainText("Send the text a new patient would.");
  // The card leaves by itself, and the phone waits for the press.
  const phone = page.locator('[data-panel="phone"]');
  await phone.getByRole("button", { name: "Send" }).click();
  await expect(phone.getByRole("listitem").filter({ hasText: "I chipped a tooth" })).toBeVisible();
  await expect(page.locator("[data-panel]:visible")).toHaveCount(1);
  await expect(page.locator("main.stage")).toHaveAttribute("data-status", "playing");
});

test("left alone, the screens come one at a time in the order the script names them", async ({ page }) => {
  // The story takes about 80 seconds, and longer while the other tests keep the machine busy.
  test.setTimeout(240_000);
  // What stands on the wall, noted each time it changes: "card", "results", or the screens in view.
  await page.addInitScript(() => {
    const seen: string[] = [];
    Object.assign(window, { seen });
    const look = () => {
      const stage = document.querySelector("main.stage");
      if (stage) {
        const screens = [...stage.querySelectorAll<HTMLElement>("[data-panel]:not([inert])")].map((el) => el.dataset.panel);
        const now = stage.querySelector("[data-slate]") ? "card" : stage.querySelector("[data-results]") ? "results" : screens.join("+");
        if (now !== seen[seen.length - 1]) seen.push(now);
      }
      requestAnimationFrame(look);
    };
    requestAnimationFrame(look);
  });
  await page.goto(`${DEMO}&autoplay=1`);
  await expect(page.locator("main.stage")).toHaveAttribute("data-done", "true", { timeout: 210_000 });
  // Read off examples/speed-to-lead/demo.json: each beat's card, then the panel of each action, a panel acted on twice in a row counted once. The slide closes it.
  expect(await page.evaluate(() => (window as unknown as { seen: string[] }).seen)).toEqual([
    ...["card", "phone"],
    // Three steps of the automation, one a beat: its card, then the automation again.
    ...["card", "flow"],
    ...["card", "flow"],
    ...["card", "flow"],
    ...["card", "flow", "phone"],
    ...["card", "flow", "crm"],
    ...["card", "phone", "crm"],
    ...["card", "flow", "numbers"],
    "results",
  ]);
});

test("a step reached along a line stays quiet until the line has been drawn to it", async ({ page }) => {
  // The step before it has run: the next beat runs the one the line leads to.
  await page.goto(`${DEMO}&at=1`);
  await page.locator("main.stage").waitFor();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-node="read"]')).toHaveAttribute("data-ran", "true");
  // Every motion on the page, held at one moment after the step ran.
  const at = (ms: number) =>
    page.evaluate((ms) => {
      for (const motion of document.getAnimations()) {
        motion.pause();
        motion.currentTime = ms;
      }
      const line = getComputedStyle(document.querySelector('[data-edge="text>read"]')!);
      const lit = getComputedStyle(document.querySelector('[data-node="read"] [data-lit]')!);
      return { drawn: 1 - parseFloat(line.strokeDashoffset), lit: Number(lit.opacity) };
    }, ms);
  // A line takes 600 ms: half-way it is half drawn, and the step it runs to is still at rest.
  const half = await at(300);
  expect(half.drawn).toBeCloseTo(0.5, 2);
  expect(half.lit).toBe(0);
  expect(await at(1000)).toEqual({ drawn: 1, lit: 1 });
});

test("on the wall a line has no time to travel: the step lights at once", async ({ page }) => {
  await page.goto("/speed-to-lead/?mode=fast&at=1");
  await page.locator("main.stage").waitFor();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator('[data-node="read"]')).toHaveAttribute("data-ran", "true");
  const delay = await page.locator('[data-node="read"] [data-lit]').evaluate((el) => getComputedStyle(el).animationDelay);
  expect(parseFloat(delay)).toBe(0);
});
