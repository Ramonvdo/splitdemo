import { expect, test } from "@playwright/test";

const DEMO = "/speed-to-lead/";

test("left alone, it plays to the end and shows what the business gained", async ({ page }) => {
  await page.goto(`${DEMO}?autoplay=1`);
  await expect(page.locator("main.stage")).toHaveAttribute("data-done", "true", { timeout: 50_000 });
  await expect(page.locator('[data-column="booked"] [data-card="dana"]')).toContainText("Thu 10:00");
  await expect(page.locator('[data-tile="reply"]')).toContainText("38 sec");
  await expect(page.getByRole("img", { name: /Thu 1$/ })).toBeVisible();
  // The outcome, with what it was before.
  await expect(page.locator("dl").last()).toContainText("38 sec");
  await expect(page.locator("dl").last()).toContainText("was 14 h");
});

test("the viewer sends the first message themselves", async ({ page }) => {
  await page.goto(DEMO);
  const phone = page.locator('[data-panel="phone"]');
  await expect(phone).not.toContainText("Thursday");
  await phone.getByRole("button", { name: "Send" }).click();
  await expect(page.locator("main.stage")).toHaveAttribute("data-status", "playing");
  await expect(phone.getByRole("listitem").filter({ hasText: "I chipped a tooth" })).toBeVisible();
  // The automation picks it up without another press.
  await expect(page.locator('[data-node="text"]')).toHaveAttribute("data-ran", "true", { timeout: 10_000 });
});

test("the keyboard steps through, back, and starts over", async ({ page }) => {
  await page.goto(DEMO);
  const stage = page.locator("main.stage");
  const dana = page.locator('[data-card="dana"]');
  await stage.waitFor();
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
  await expect(stage).toHaveAttribute("data-beat", "3");
  await expect(stage).toHaveAttribute("data-status", "paused");
  await expect(page.locator('[data-column="new"]').locator(dana)).toBeVisible();

  await page.keyboard.press("ArrowLeft");
  await expect(stage).toHaveAttribute("data-beat", "2");
  await expect(dana).toHaveCount(0);

  await page.keyboard.press("r");
  await expect(stage).toHaveAttribute("data-beat", "0");
  await expect(page.locator('[data-panel="phone"]')).not.toContainText("Sorry to hear that");
});

test("with reduced motion it opens on the finished picture", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(DEMO);
  await expect(page.locator("main.stage")).toHaveAttribute("data-done", "true");
  await expect(page.locator('[data-tile="booked"]')).toContainText("7");
});
