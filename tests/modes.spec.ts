import { expect, test } from "@playwright/test";
import { READY } from "../scripts/lib/spills.ts";

// The strip over the wall: the switch between the story and the wall, and the demo's title.
const DEMO = "/speed-to-lead/";

test("the switch goes from the story to the wall and back, and keeps the step", async ({ page }) => {
  // The end of step 5, in the story: one screen, the phone with the reply on it.
  await page.goto(`${DEMO}?at=4`);
  const stage = page.locator("main.stage");
  const top = page.locator("[data-top]");
  const story = top.getByRole("button", { name: "Explainer" });
  const wall = top.getByRole("button", { name: "Fast" });
  await expect(story).toHaveAttribute("aria-pressed", "true");
  await expect(wall).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("[data-panel]:visible")).toHaveCount(1);

  await wall.click();
  await expect(stage).toHaveAttribute("data-mode", "fast");
  await expect(stage).toHaveAttribute("data-beat", "4");
  await expect(page.locator("[data-panel]:visible")).toHaveCount(4);
  await expect(wall).toHaveAttribute("aria-pressed", "true");
  // What happened stays: the reply is on the phone in both.
  await expect(page.locator('[data-panel="phone"]').getByRole("listitem").filter({ hasText: "Which works best?" })).toBeVisible();

  await story.click();
  await expect(stage).toHaveAttribute("data-mode", "explainer");
  await expect(stage).toHaveAttribute("data-beat", "4");
  await expect(page.locator("[data-panel]:visible")).toHaveCount(1);
  await expect(page.locator('[data-panel="phone"]')).toBeVisible();
});

test("the switch takes a press that lands just over or under its low segments", async ({ page }) => {
  await page.goto(`${DEMO}?at=4`);
  const stage = page.locator("main.stage");
  const top = page.locator("[data-top]");
  const wall = (await top.getByRole("button", { name: "Fast" }).boundingBox())!;
  await page.mouse.click(wall.x + wall.width / 2, wall.y - 4);
  await expect(stage).toHaveAttribute("data-mode", "fast");
  const story = (await top.getByRole("button", { name: "Explainer" }).boundingBox())!;
  await page.mouse.click(story.x + story.width / 2, story.y + story.height + 4);
  await expect(stage).toHaveAttribute("data-mode", "explainer");
});

test("the strip names the demo once the story runs, and leaves that to the opening before", async ({ page }) => {
  await page.goto(`${DEMO}?at=1`);
  await expect(page.locator("[data-top]")).toContainText("A new patient texts after closing time");
  await page.goto(DEMO);
  await expect(page.locator("[data-slate]")).toContainText("A new patient texts after closing time");
  await expect(page.locator("[data-top]")).not.toContainText("A new patient texts after closing time");
});

test("a film has no switch, and its wall is the size the viewer's wall is", async ({ page }) => {
  await page.goto(`${DEMO}?mode=fast&at=1`);
  await page.locator(READY).waitFor();
  const seen = await page.locator(".wall").boundingBox();
  await page.goto(`${DEMO}?mode=fast&at=1&record=1`);
  await page.locator(READY).waitFor();
  await expect(page.locator("[data-top]").getByRole("button")).toHaveCount(0);
  await expect(page.locator("[data-top]")).toContainText("A new patient texts after closing time");
  const filmed = await page.locator(".wall").boundingBox();
  expect(filmed?.y).toBe(seen?.y);
  expect(filmed?.height).toBe(seen?.height);
});

test("shown bare, the strip goes with the bar", async ({ page }) => {
  await page.goto(`${DEMO}?mode=fast&at=1&bare=1`);
  await page.locator(READY).waitFor();
  await expect(page.locator("[data-top]")).toHaveCount(0);
  await page.keyboard.press("h");
  await expect(page.locator("[data-top]")).toHaveCount(1);
  await expect(page.locator("footer")).toHaveCount(1);
});

test("a Dutch demo has Dutch words around it", async ({ page }) => {
  await page.route("**/speed-to-lead/demo.json", async (route) => {
    const demo = await (await route.fetch()).json();
    demo.lang = "nl";
    await route.fulfill({ json: demo });
  });
  await page.goto(DEMO);
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await expect(page.locator("[data-slate]").getByRole("button", { name: "Demo afspelen" })).toBeVisible();
  const top = page.locator("[data-top]");
  await expect(top.getByRole("button", { name: "Uitleg" })).toHaveAttribute("aria-pressed", "true");
  await top.getByRole("button", { name: "Snel" }).click();
  const bar = page.locator("footer");
  await expect(bar.getByRole("button", { name: "Afspelen" })).toBeVisible();
  await expect(bar.getByRole("button", { name: "Stap vooruit" })).toBeVisible();
  await expect(bar).toContainText("Nagespeeld voorbeeld");
  await page.goto(`${DEMO}?at=1&n=0`);
  await expect(page.locator("[data-slate]")).toContainText("Stap 2 van 8");
});
