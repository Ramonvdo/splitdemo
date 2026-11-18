import { expect, test, type Page } from "@playwright/test";

// The slide after the story. speed-to-lead's calculator starts at 40 texts a month, 30% booked, $180 a visit, against $300 a month and $1,500 once.
const END = "/speed-to-lead/?at=end&mode=";

/** The same demo as its author would have left it without a `results` block. */
async function withoutResults(page: Page) {
  await page.route("**/speed-to-lead/demo.json", async (route) => {
    const demo = await (await route.fetch()).json();
    delete demo.results;
    await route.fulfill({ json: demo });
  });
}

test("the story ends on a slide that says what came of it and what that is worth", async ({ page }) => {
  await page.goto(`${END}explainer`);
  const slide = page.locator("[data-results]");
  await expect(slide.getByRole("heading")).toHaveText("What a missed evening text costs");
  await expect(slide.locator("[data-outcome]")).toContainText("38 sec");
  await expect(page.locator("[data-panel]:visible")).toHaveCount(0);
  // 40 x 0.30 x 180 a month; less 300; twelve of those less 1,500; and 1,500 is earned back inside the first month.
  await expect(slide.locator("[data-monthly]")).toHaveText("$2,160");
  await expect(slide.locator("[data-net]")).toHaveText("$1,860");
  await expect(slide.locator("[data-year]")).toHaveText("$20,820");
  await expect(slide.locator("[data-payback]")).toHaveText("Pays for itself in month 1");
  // Both charts drew: one bar per gain and one for the cost, then twelve months.
  await expect(slide.getByRole("img", { name: /^Each month: New patients booked \$2,160, Cost \$300$/ })).toBeVisible();
  await expect(slide.getByRole("img", { name: /Month 1 \$360, .*Month 12 \$20,820$/ })).toBeVisible();
  // The bar leaves what came of it to the slide.
  await expect(page.locator("footer [data-outcome]")).toHaveCount(0);
});

test("the viewer fills in their own numbers and the slide works them out", async ({ page }) => {
  await page.goto(`${END}explainer`);
  const slide = page.locator("[data-results]");
  const texts = slide.getByLabel("After-hours texts a month");
  await texts.fill("50");
  // 50 x 0.30 x 180 = 2,700; less 300; twelve of those less 1,500.
  await expect(slide.locator("[data-monthly]")).toHaveText("$2,700");
  await expect(slide.locator("[data-net]")).toHaveText("$2,400");
  await expect(slide.locator("[data-year]")).toHaveText("$27,300");
  // 2 texts a month bring in 108 against 300: it never pays for itself, and the slide does not say it does.
  await texts.fill("2");
  await expect(slide.locator("[data-net]")).toHaveText("-$192");
  await expect(slide.locator("[data-payback]")).toHaveText("");
  // More than the field takes: the sums use its limit, ten times the starting number, and the field shows that on the way out.
  await texts.fill("999");
  await expect(slide.locator("[data-monthly]")).toHaveText("$21,600");
  await texts.blur();
  await expect(texts).toHaveValue("400");
});

test("on the wall the slide comes when asked for, and a number typed in it moves no monitor", async ({ page }) => {
  await page.goto(`${END}fast`);
  await expect(page.locator("[data-results]")).toHaveCount(0);
  await expect(page.locator("footer [data-outcome]")).toContainText("38 sec");
  await expect(page.locator("[data-panel]:visible")).toHaveCount(4);
  const toggle = page.getByRole("button", { name: "Results" });
  await toggle.click();
  const slide = page.locator("[data-results]");
  await expect(slide.locator("[data-monthly]")).toHaveText("$2,160");
  // On the wall the keys 1 to 4 enlarge a monitor, a space plays and an arrow steps. Typed in a field they are a number.
  const texts = slide.getByLabel("After-hours texts a month");
  await texts.click();
  await texts.press("Control+a");
  await page.keyboard.type("12 ");
  await page.keyboard.press("ArrowLeft");
  await expect(slide.locator("[data-monthly]")).toHaveText("$648");
  await expect(page.locator("main.stage")).toHaveAttribute("data-status", "done");
  await toggle.click();
  await expect(slide).toHaveCount(0);
  await expect(page.locator("[data-panel]:visible")).toHaveCount(4);
  await expect(page.locator("[data-zoom]")).toHaveCount(0);
});

test("a demo that gives no calculator still ends on what came of it", async ({ page }) => {
  await withoutResults(page);
  await page.goto(`${END}explainer`);
  const slide = page.locator("[data-results]");
  await expect(slide.locator("[data-outcome]")).toContainText("booked while you were closed");
  await expect(slide.locator("[data-monthly]")).toHaveCount(0);
  await expect(slide.getByRole("textbox")).toHaveCount(0);
  // On the wall the bar already says all of that, so there is no slide to ask for.
  await page.goto(`${END}fast`);
  await expect(page.locator("footer [data-outcome]")).toContainText("38 sec");
  await expect(page.getByRole("button", { name: "Results" })).toHaveCount(0);
});

test("a Dutch demo gets a Dutch slide, with money written the Dutch way", async ({ page }) => {
  await page.route("**/speed-to-lead/demo.json", async (route) => {
    const demo = await (await route.fetch()).json();
    demo.lang = "nl";
    demo.results.roi.currency = "EUR";
    await route.fulfill({ json: demo });
  });
  await page.goto(`${END}explainer`);
  const slide = page.locator("[data-results]");
  await expect(slide.getByText("Reken het na met eigen cijfers")).toBeVisible();
  await expect(slide.locator("[data-monthly]")).toHaveText(/^€\s2\.160$/);
  await expect(slide.locator("[data-payback]")).toHaveText("Terugverdiend in maand 1");
});
