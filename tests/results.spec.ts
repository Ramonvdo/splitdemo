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

/** The end of the story as a viewer gets there, stepping on from the last step: somebody is watching, so there is somebody to ask. */
async function watched(page: Page, mode = "explainer", more = "") {
  await page.goto(`/speed-to-lead/?at=7&mode=${mode}${more}`);
  const stage = page.locator("main.stage");
  for (let press = 0; press < 4 && (await stage.getAttribute("data-status")) !== "done"; press++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(120);
  }
  await expect(stage).toHaveAttribute("data-status", "done");
  return page.locator("[data-results]");
}

test("the story ends on what came of it and offers to work it out; the questions come one a screen and end on the report", async ({ page }) => {
  const slide = await watched(page);
  // The card first: what came of the story, no figures of ours yet, and one way on.
  await expect(slide.locator("[data-outcome]")).toContainText("38 sec");
  await expect(slide.locator("[data-monthly]")).toHaveCount(0);
  await slide.getByRole("button", { name: "Work it out for your business" }).click();
  // One question, with our estimate already in the field and the field ready to type in.
  await expect(slide.getByText("1 of 3")).toBeVisible();
  const texts = slide.getByLabel("How many texts come in after closing, in a month?");
  await expect(texts).toHaveValue("40");
  await expect(texts).toBeFocused();
  await expect(slide.getByText("Not sure? Leave our estimate.")).toBeVisible();
  await expect(slide.getByRole("textbox")).toHaveCount(1);
  // Typing takes the estimate's place, and Enter moves on.
  await page.keyboard.type("60");
  await page.keyboard.press("Enter");
  await expect(slide.getByText("2 of 3")).toBeVisible();
  await expect(slide.getByLabel("Of every 100 of those texts, how many book a visit today?")).toHaveValue("10");
  await slide.getByRole("button", { name: "Next" }).click();
  await expect(slide.getByText("3 of 3")).toBeVisible();
  await expect(slide.getByLabel("What is a first visit worth to you?")).toHaveValue("180");
  await slide.getByRole("button", { name: "See your ROI" }).click();
  // 60 texts x 20 points x $180.
  await expect(slide.locator("[data-monthly]")).toHaveText("$2,160");
  await expect(slide.getByText("Your numbers")).toBeVisible();
});

test("going back keeps what was answered, and the report leads back to the questions", async ({ page }) => {
  const slide = await watched(page);
  await slide.getByRole("button", { name: "Work it out for your business" }).click();
  await page.keyboard.type("60");
  await slide.getByRole("button", { name: "Next" }).click();
  await page.keyboard.type("25");
  await slide.getByRole("button", { name: "Back" }).click();
  await expect(slide.getByLabel("How many texts come in after closing, in a month?")).toHaveValue("60");
  // Back from the first question is the card again, and the answers are still there after it.
  await slide.getByRole("button", { name: "Back" }).click();
  await expect(slide.locator("[data-outcome]")).toContainText("38 sec");
  await slide.getByRole("button", { name: "Work it out for your business" }).click();
  await page.keyboard.press("Enter");
  await expect(slide.getByLabel("Of every 100 of those texts, how many book a visit today?")).toHaveValue("25");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  // 60 texts, 25 in 100 book today and 45 with the system: still 20 points, 60 x 0.20 x 180.
  await expect(slide.locator("[data-monthly]")).toHaveText("$2,160");
  await expect(slide.getByLabel("Share of those that book a visit, with the system")).toHaveValue("45");
  await slide.getByRole("button", { name: "Change my answers" }).click();
  await expect(slide.getByText("1 of 3")).toBeVisible();
  await expect(slide.getByLabel("How many texts come in after closing, in a month?")).toHaveValue("60");
});

test("an answer that leaves the system nothing to win gets told so, not a figure", async ({ page }) => {
  const slide = await watched(page);
  await slide.getByRole("button", { name: "Work it out for your business" }).click();
  await page.keyboard.press("Enter");
  // Every text already books: there are no points left to add.
  await page.keyboard.type("100");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(slide.locator("[data-monthly]")).toHaveText("$0");
  await expect(slide.getByText("With these numbers the system has nothing left to win. Change one to see where it does.")).toBeVisible();
});

test("a picture or a film has nobody to ask: it is the report, and a question opens only when asked for by its number", async ({ page }) => {
  await page.goto(`${END}explainer`);
  const slide = page.locator("[data-results]");
  await expect(slide.locator("[data-monthly]")).toHaveText("$1,440");
  await expect(slide.getByText("Example numbers")).toBeVisible();
  await expect(slide.getByRole("button", { name: "Change my answers" })).toHaveCount(0);
  // The pictures of the flow: the card, a question by its number, the report.
  await page.goto(`${END}explainer&q=0`);
  await expect(slide.getByRole("button", { name: "Work it out for your business" })).toBeVisible();
  await page.goto(`${END}explainer&q=2`);
  await expect(slide.getByText("2 of 3")).toBeVisible();
  await page.goto(`${END}explainer&q=report`);
  await expect(slide.locator("[data-monthly]")).toHaveText("$1,440");
  // A film runs to the end by itself and lands on the report.
  await watched(page, "explainer", "&record=1");
  await expect(slide.locator("[data-monthly]")).toHaveText("$1,440");
});

test("a link can end on the report straight away, and still offers the questions", async ({ page }) => {
  const slide = await watched(page, "explainer", "&q=report");
  await expect(slide.locator("[data-monthly]")).toHaveText("$1,440");
  await expect(slide.getByText("Example numbers")).toBeVisible();
  await slide.getByRole("button", { name: "Change my answers" }).click();
  await expect(slide.getByText("1 of 3")).toBeVisible();
});

test("on the wall the Results button opens the same questions", async ({ page }) => {
  await watched(page, "fast");
  await expect(page.locator("[data-results]")).toHaveCount(0);
  await page.getByRole("button", { name: "Results" }).click();
  const slide = page.locator("[data-results]");
  await slide.getByRole("button", { name: "Work it out for your business" }).click();
  // A number typed in a question is a number: on the wall the keys 1 to 4 would enlarge a monitor.
  await page.keyboard.type("12");
  await expect(slide.getByLabel("How many texts come in after closing, in a month?")).toHaveValue("12");
  await expect(page.locator("[data-zoom]")).toHaveCount(0);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  // 12 x 0.20 x 180.
  await expect(slide.locator("[data-monthly]")).toHaveText("$432");
});

test("a Dutch demo asks in Dutch", async ({ page }) => {
  await page.route("**/speed-to-lead/demo.json", async (route) => {
    const demo = await (await route.fetch()).json();
    demo.lang = "nl";
    demo.results.roi.currency = "EUR";
    demo.results.roi.inputs[0].ask = "Hoeveel berichten komen er per maand na sluitingstijd binnen?";
    demo.results.roi.inputs[0].note = "Tel een gemiddelde maand";
    await route.fulfill({ json: demo });
  });
  const slide = await watched(page);
  await slide.getByRole("button", { name: "Reken het uit voor je eigen bedrijf" }).click();
  await expect(slide.getByText("1 van 3")).toBeVisible();
  await expect(slide.getByLabel("Hoeveel berichten komen er per maand na sluitingstijd binnen?")).toHaveValue("40");
  // Where an estimate comes from stands under the field.
  await expect(slide.getByText("Tel een gemiddelde maand")).toBeVisible();
  await expect(slide.getByText("Weet je het niet precies? Laat onze schatting staan.")).toBeVisible();
  await expect(slide.getByRole("button", { name: "Terug" })).toBeVisible();
  await slide.getByRole("button", { name: "Volgende" }).click();
  await slide.getByRole("button", { name: "Volgende" }).click();
  await slide.getByRole("button", { name: "Bekijk wat het oplevert" }).click();
  await expect(slide.getByText("Jouw cijfers")).toBeVisible();
  await expect(slide.getByRole("button", { name: "Antwoorden aanpassen" })).toBeVisible();
});

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
  await expect(slide.locator("[data-payback]")).toHaveText("After $1,500 to set up and $300 a month, it pays for itself in month 2.");
  // One point more is 40 x 0.01 x 180 a month. The system changes that share, so the sentence needs no name for it.
  await expect(slide.locator("[data-point]")).toHaveText("Each extra point the system adds is worth $864 a year.");
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

test("the first chart is the year the system adds, against carrying on as today and against half the effect", async ({ page }) => {
  await page.goto(`${END}explainer`);
  const slide = page.locator("[data-results]");
  const chart = slide.locator("figure").first();
  await expect(chart.locator("figcaption")).toHaveText("What the system adds over 12 months, after costs");
  // -1,500, then +1,140 a month. At half the effect 720 comes in a month: -1,500, then +420 a month. Carrying on adds nothing.
  await expect(chart.locator("[data-legend] li")).toHaveText(["With the system $12,180", "Half the effect $3,540", "Carry on as today $0"]);
  await expect(chart.getByRole("img")).toHaveAttribute("aria-label", "What the system adds over 12 months, after costs: With the system $12,180, Half the effect $3,540, Carry on as today $0");
  // A typed number moves the lines' ends with it: 50 texts are 1,800 a month, 900 at half.
  await slide.getByLabel("After-hours texts a month", { exact: true }).fill("50");
  await expect(chart.locator("[data-legend] li")).toHaveText(["With the system $16,500", "Half the effect $5,700", "Carry on as today $0"]);
});

test("a chain of two levels gets bars beside it: a year today, a year with the system, and what the system costs", async ({ page }) => {
  await page.goto(`${END}explainer`);
  const chart = page.locator("[data-results] figure").nth(1);
  await expect(chart.locator("figcaption")).toHaveText("A year as you work today, and a year with the system");
  // 720 and 2,160 a month, twelve times; 12 x 300 and 1,500 once.
  await expect(chart.locator("[data-bars] li")).toHaveText(["$8,640 Today", "$25,920 With the system", "$5,100 What it costs"]);
  await expect(chart.getByRole("img")).toHaveAttribute("aria-label", "A year as you work today, and a year with the system: Today $8,640, With the system $25,920, What it costs $5,100");
  await expect(chart.locator("[data-funnel]")).toHaveCount(0);
});

test("a chain of three levels is drawn as two funnels, today over the system", async ({ page }) => {
  await page.goto("/intake-to-booking/?at=end&mode=explainer");
  const chart = page.locator("[data-results] figure").nth(1);
  await expect(chart.locator("figcaption")).toHaveText("From requests to jobs, over a year");
  // 25 x 12 requests; 50 in 100 visit today and 70 in 100 with the system; 30 in 100 visits become a job.
  await expect(chart.getByRole("img")).toHaveAttribute("aria-label", "From requests to jobs, over a year. Today: Requests 300, Visits 150, Jobs 45. With the system: Requests 300, Visits 210, Jobs 63.");
  await expect(chart.locator("[data-funnel]")).toHaveCount(2);
  await expect(chart.locator("[data-lead]")).toHaveCount(0);
  // The sentence about one more point is about the row the system changes: 25 x 0.01 x 0.30 x 1,800, twelve months.
  await expect(page.locator("[data-results] [data-point]")).toHaveText("Each extra point the system adds is worth $1,620 a year.");
  // More requests widen both funnels alike: 40 x 12, of which 240 and 336 visit.
  await page.locator("[data-results]").getByLabel("Quote requests a month", { exact: true }).fill("40");
  await expect(chart.getByRole("img")).toHaveAttribute("aria-label", /Today: Requests 480, Visits 240, Jobs 72\. With the system: Requests 480, Visits 336, Jobs 101\.$/);
});

test("a system that changes how much goes in gets one funnel, with today's count under each level", async ({ page }) => {
  await page.goto("/cold-outreach/?at=end&mode=explainer");
  const chart = page.locator("[data-results] figure").nth(1);
  await expect(chart.locator("figcaption")).toHaveText("From replies to clients, over a year");
  await expect(chart.locator("[data-funnel]")).toHaveCount(1);
  // 160 x 12 emails against 20 x 12: too many beside 96 replies to draw, so they are said.
  await expect(chart.locator("[data-lead]")).toHaveText("Emails a year: 1,920 (today 240)");
  // 5 in 100 reply, half of those take a visit, 1 visit in 5 signs: 96, 48 and 9.6 a year; today 12, 6 and 1.2.
  await expect(chart.getByRole("img")).toHaveAttribute("aria-label", "From replies to clients, over a year. With the system: Replies 96, Visits 48, Clients 10. Today: Replies 12, Visits 6, Clients 1.");
  await expect(chart.locator("[data-before] li")).toHaveText(["today 12", "today 6", "today 1"]);
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
  await expect(slide.locator("[data-payback]")).toHaveText("After $1,500 to set up and $300 a month, it pays for itself in month 3.");
  // 5 texts are 5 x 0.10 x 180 = 90 a month, less than the 300 it costs: the year never gets above zero, and the slide says so.
  await texts.fill("5");
  await expect(slide.locator("[data-payback]")).toHaveText("After $1,500 to set up and $300 a month, it does not pay for itself in the first year.");
  await texts.fill("50");
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
  await expect(slide.locator("[data-payback]")).toHaveText("After $1,500 to set up and $450 a month, it pays for itself in month 5.");
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
  await expect(slide.locator("[data-payback]")).toHaveText(/^Na €\s1\.500 eenmalig en €\s300 per maand terugverdiend in maand 2\.$/);
});
