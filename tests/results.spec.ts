import { expect, test, type Page } from "@playwright/test";

// The slide after the story. speed-to-lead's calculator: 40 texts a month after closing, 10 in 100 book a visit today and the system adds 20 points,
// $180 a visit, against $300 a month and $1,500 once. Opened as a picture of the end there is nobody to ask, so the slide is the report.
const END = "/speed-to-lead/?at=end&mode=";

/** The same demo as its author would have left it without a `results` block. */
async function withoutResults(page: Page) {
  await page.route("**/speed-to-lead/demo.json", async (route) => {
    const demo = await (await route.fetch()).json();
    delete demo.results;
    await route.fulfill({ json: demo });
  });
}

test("the report says what came of the story and what the system adds", async ({ page }) => {
  await page.goto(`${END}explainer`);
  const slide = page.locator("[data-results]");
  await expect(slide.getByRole("heading")).toHaveText("What a missed evening text costs");
  await expect(slide.locator("[data-outcome]")).toContainText("38 sec");
  await expect(page.locator("[data-panel]:visible")).toHaveCount(0);
  // 40 x 0.10 x 180 today and 40 x 0.30 x 180 with the system: 1,440 more a month; less 300; twelve of those less 1,500.
  await expect(slide.locator("[data-monthly]")).toHaveText("$1,440");
  await expect(slide.locator("[data-net]")).toHaveText("$1,140");
  await expect(slide.locator("[data-year]")).toHaveText("$12,180");
  // -1,500, then +1,140 a month: above zero in the second month.
  await expect(slide.locator("[data-payback]")).toHaveText("Pays for itself in month 2");
  // One point more is 40 x 0.01 x 180 a month.
  await expect(slide.locator("[data-point]")).toHaveText('Each extra point on "Share of those that book a visit" is worth $864 a year.');
  // The bar leaves what came of it to the slide.
  await expect(page.locator("footer [data-outcome]")).toHaveCount(0);
});

test("the report lists every number it used, today and with the system, and marks the ones that are ours", async ({ page }) => {
  await page.goto(`${END}explainer`);
  const table = page.locator("[data-numbers]");
  await expect(table.locator("caption")).toContainText("Example numbers");
  await expect(table.getByRole("columnheader")).toHaveText(["Today", "With the system"]);
  await expect(table.getByRole("rowheader")).toHaveText(["After-hours texts a month", "Share of those that book a visit", "Worth of a first visit"]);
  await expect(table.getByLabel("After-hours texts a month", { exact: true })).toHaveValue("40");
  await expect(table.getByLabel("Share of those that book a visit", { exact: true })).toHaveValue("10");
  // The system's own number is the one nobody but us filled in.
  const system = table.getByLabel("Share of those that book a visit, with the system");
  await expect(system).toHaveValue("30");
  await expect(table.getByText("estimate")).toHaveCount(1);
  await system.fill("35");
  await expect(table.getByText("estimate")).toHaveCount(0);
  await expect(table.locator("caption")).toContainText("Your numbers");
});

test("the viewer changes a number and the report works it out again", async ({ page }) => {
  await page.goto(`${END}explainer`);
  const slide = page.locator("[data-results]");
  const texts = slide.getByLabel("After-hours texts a month", { exact: true });
  const booked = slide.getByLabel("Share of those that book a visit", { exact: true });
  const system = slide.getByLabel("Share of those that book a visit, with the system");
  await texts.fill("50");
  // 50 x 0.20 x 180 = 1,800; less 300; twelve of those less 1,500.
  await expect(slide.locator("[data-monthly]")).toHaveText("$1,800");
  await expect(slide.locator("[data-net]")).toHaveText("$1,500");
  await expect(slide.locator("[data-year]")).toHaveText("$16,500");
  // What the system adds goes on top of what they say they do today.
  await booked.fill("25");
  await expect(system).toHaveValue("45");
  await expect(slide.locator("[data-monthly]")).toHaveText("$1,800");
  // Their own idea of what the system reaches: 50 x 0.10 x 180 = 900; -1,500 then +600 a month is above zero in month 3.
  await system.fill("35");
  await expect(slide.locator("[data-monthly]")).toHaveText("$900");
  await expect(slide.locator("[data-year]")).toHaveText("$5,700");
  await expect(slide.locator("[data-payback]")).toHaveText("Pays for itself in month 3");
  // They already do better than that: nothing to win, and the slide says so instead of a loss.
  await booked.fill("40");
  await expect(slide.locator("[data-monthly]")).toHaveText("$0");
  await expect(slide.locator("[data-nothing]")).toHaveText("With these numbers the system has nothing left to win. Change one to see where it does.");
  await expect(slide.locator("[data-payback]")).toHaveCount(0);
  // More than the field takes: the sums use its limit, ten times the starting number, and the field shows that on the way out.
  await texts.fill("999");
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
  await expect(slide.locator("[data-monthly]")).toHaveText("$1,440");
  // On the wall the keys 1 to 4 enlarge a monitor, a space plays and an arrow steps. Typed in a field they are a number.
  const texts = slide.getByLabel("After-hours texts a month", { exact: true });
  await texts.click();
  await texts.press("Control+a");
  await page.keyboard.type("12 ");
  await page.keyboard.press("ArrowLeft");
  // 12 x 0.20 x 180.
  await expect(slide.locator("[data-monthly]")).toHaveText("$432");
  await expect(page.locator("main.stage")).toHaveAttribute("data-status", "done");
  await toggle.click();
  await expect(slide).toHaveCount(0);
  await expect(page.locator("[data-panel]:visible")).toHaveCount(4);
  await expect(page.locator("[data-zoom]")).toHaveCount(0);
  // The slide comes back with the number they typed.
  await toggle.click();
  await expect(slide.locator("[data-monthly]")).toHaveText("$432");
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

test("on a phone the monthly figure is in view when the slide opens, above the numbers that change it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${END}explainer`);
  const slide = page.locator("[data-results]");
  const monthly = slide.locator("[data-monthly]");
  await expect(monthly).toHaveText("$1,440");
  await expect(monthly).toBeInViewport({ ratio: 1 });
  const figure = await monthly.boundingBox();
  const field = await slide.getByLabel("After-hours texts a month", { exact: true }).boundingBox();
  const chart = await slide.getByRole("img").first().boundingBox();
  expect(figure!.y).toBeLessThan(field!.y);
  expect(field!.y).toBeLessThan(chart!.y);
});

test("a phone has no strip title, so a slide without a title of its own takes the demo's", async ({ page }) => {
  await page.route("**/speed-to-lead/demo.json", async (route) => {
    const demo = await (await route.fetch()).json();
    delete demo.results.title;
    await route.fulfill({ json: demo });
  });
  await page.goto(`${END}explainer`);
  const heading = page.locator("[data-results]").getByRole("heading");
  await expect(heading).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(heading).toHaveText("A new patient texts after closing time");
});

test("the monthly figure says what it counts: extra, saved, or the demo's own words", async ({ page }) => {
  let change = (roi: Record<string, unknown>) => void (roi.label = "booked back a month");
  await page.route("**/speed-to-lead/demo.json", async (route) => {
    const demo = await (await route.fetch()).json();
    change(demo.results.roi);
    await route.fulfill({ json: demo });
  });
  await page.goto(`${END}explainer`);
  const slide = page.locator("[data-results]");
  await expect(slide.getByText("booked back a month")).toBeVisible();
  await expect(slide.getByText("extra a month")).toHaveCount(0);
  // A cost that goes down: 40 texts at 12 minutes each become 2, at 30 an hour. 40 x 10 x 30 / 60 = 200 saved.
  change = (roi) =>
    void Object.assign(roi, {
      inputs: [
        { id: "texts", label: "After-hours texts a month", ask: "How many texts come in after closing?", value: 40 },
        { id: "minutes", label: "Minutes spent on each", ask: "How many minutes does one take?", value: 12 },
        { id: "hour", label: "Cost of an hour", value: 30, kind: "money" },
      ],
      lever: { input: "minutes", to: 2 },
      times: 1 / 60,
      saving: true,
      cost: undefined,
    });
  await page.reload();
  await expect(slide.locator("[data-monthly]")).toHaveText("$200");
  await expect(slide.getByText("saved a month")).toBeVisible();
  await expect(slide.locator("[data-year]")).toHaveText("$2,400");
  // No cost was given, so there is nothing to pay back, and a saving has no share to win a point on.
  await expect(slide.locator("[data-payback]")).toHaveCount(0);
  await expect(slide.locator("[data-point]")).toHaveCount(0);
  await expect(slide.locator("[data-numbers]").getByText("estimate")).toHaveCount(2);
});

test("clients who keep paying count every month again", async ({ page }) => {
  // cold-outreach: 20 emails a month by hand, 160 with the system; 5% reply, half of those take a visit, 1 visit in 5 signs, $400 a month each.
  await page.goto("/cold-outreach/?at=end&mode=explainer");
  const slide = page.locator("[data-results]");
  // 20 x 0.05 x 0.5 x 0.2 x 400 = 40 of new fees a month today, 320 with the system.
  await expect(slide.locator("[data-monthly]")).toHaveText("$280");
  await expect(slide.getByText("more a month, every month again")).toBeVisible();
  // Month 12 carries twelve months of new clients.
  await expect(slide.locator("[data-by12]")).toHaveText("$3,360");
  // 280 x (1 + 2 + ... + 12), less 12 x 450 and 1,500.
  await expect(slide.locator("[data-year]")).toHaveText("$14,940");
  await expect(slide.locator("[data-payback]")).toHaveText("Pays for itself in month 5");
  await expect(slide.locator("[data-point]")).toHaveText('Each extra point on "Visits that become a client" is worth $1,248 a year.');
  // The system's number is its own: 160 emails, whatever they send today.
  await slide.getByLabel("Offices emailed a month", { exact: true }).fill("60");
  await expect(slide.getByLabel("Offices emailed a month, with the system")).toHaveValue("160");
  await expect(slide.locator("[data-monthly]")).toHaveText("$200");
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
  await expect(slide.getByText("Voorbeeldcijfers")).toBeVisible();
  await expect(slide.getByRole("columnheader")).toHaveText(["Nu", "Met het systeem"]);
  await expect(slide.locator("[data-monthly]")).toHaveText(/^€\s1\.440$/);
  await expect(slide.locator("[data-payback]")).toHaveText("Terugverdiend in maand 2");
});
