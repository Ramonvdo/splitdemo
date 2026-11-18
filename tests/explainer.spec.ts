import { expect, test } from "@playwright/test";

// Explainer mode: a step's text alone, then one screen at a time.
const DEMO = "/speed-to-lead/?mode=explainer";

test("a step's text stands alone on the wall before anything of the step shows", async ({ page }) => {
  await page.goto(`${DEMO}&at=1&n=0`);
  const slate = page.locator("[data-slate]");
  await expect(slate).toContainText("Step 2 of 6");
  await expect(slate).toContainText("Nobody is at the desk. The message gets read anyway.");
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
  test.setTimeout(150_000);
  // What stands on the wall, noted each time it changes: "card", or the screens in view.
  await page.addInitScript(() => {
    const seen: string[] = [];
    Object.assign(window, { seen });
    const look = () => {
      const stage = document.querySelector("main.stage");
      if (stage) {
        const screens = [...stage.querySelectorAll<HTMLElement>("[data-panel]:not([inert])")].map((el) => el.dataset.panel);
        const now = stage.querySelector("[data-slate]") ? "card" : screens.join("+");
        if (now !== seen[seen.length - 1]) seen.push(now);
      }
      requestAnimationFrame(look);
    };
    requestAnimationFrame(look);
  });
  await page.goto(`${DEMO}&autoplay=1`);
  await expect(page.locator("main.stage")).toHaveAttribute("data-done", "true", { timeout: 130_000 });
  // Read off examples/speed-to-lead/demo.json: each beat's card, then the panel of each action, a panel acted on twice in a row counted once.
  expect(await page.evaluate(() => (window as unknown as { seen: string[] }).seen)).toEqual([
    ...["card", "phone"],
    ...["card", "flow", "phone", "flow"],
    ...["card", "flow", "phone"],
    ...["card", "flow", "crm"],
    ...["card", "phone", "crm"],
    ...["card", "flow", "numbers"],
  ]);
});
