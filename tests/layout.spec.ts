import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { READY, settle, spills } from "./spills.ts";

const DEMOS = ["speed-to-lead", "cold-outreach", "intake-to-booking"];
const SIZES = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  // A phone, held upright: one monitor at a time.
  { width: 390, height: 844 },
];

for (const demo of DEMOS) {
  for (const size of SIZES) {
    test(`${demo}: nothing spills or gets cut off at ${size.width}x${size.height}`, async ({ page }) => {
      await page.setViewportSize(size);
      for (const at of ["0", "3", "end"]) {
        await page.goto(`/${demo}/?at=${at}`);
        await page.locator(READY).waitFor();
        expect(await spills(page), `at=${at}`).toEqual([]);
      }
    });
  }

  test(`${demo}: every panel still fits when it is enlarged`, async ({ page }) => {
    await page.goto(`/${demo}/?at=end`);
    await page.locator(READY).waitFor();
    const panels = page.locator("[data-panel]");
    for (let n = 1; n <= (await panels.count()); n++) {
      await page.keyboard.press(String(n));
      await expect(panels.nth(n - 1)).toHaveAttribute("data-zoom", "true");
      expect(await spills(page), `panel ${n}`).toEqual([]);
    }
  });

  test(`${demo}: no serious accessibility problems, waiting or finished`, async ({ page }) => {
    for (const query of ["", "?at=end"]) {
      await page.goto(`/${demo}/${query}`);
      await page.locator(READY).waitFor();
      await settle(page);
      const { violations } = await new AxeBuilder({ page }).analyze();
      const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`), query || "start").toEqual([]);
    }
  });
}

test("every control is reachable and named from the keyboard", async ({ page }) => {
  await page.goto("/speed-to-lead/");
  await page.locator(READY).waitFor();
  const names: string[] = [];
  // Four panel labels, the phone's send button and the three transport buttons.
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    names.push(await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent ?? ""));
  }
  expect(names).toEqual(expect.arrayContaining(["Send", "Play", "Step forward", "Patient pipeline: enlarge"]));
});

test("a click on a label enlarges that panel, and the same click or Escape brings the wall back", async ({ page }) => {
  await page.goto("/speed-to-lead/?at=end");
  await page.locator(READY).waitFor();
  const crm = page.locator('[data-panel="crm"]');
  const phone = page.locator('[data-panel="phone"]');
  const wall = await page.locator(".wall").boundingBox();

  await crm.getByRole("button", { name: /enlarge$/ }).click();
  await expect(crm).toHaveAttribute("data-zoom", "true");
  expect((await crm.boundingBox())?.width).toBeCloseTo(wall?.width ?? 0, 0);
  // The others stay where they were, out of sight and out of reach.
  await expect(phone).toBeHidden();
  await expect(phone).toHaveAttribute("inert", "");

  await crm.getByRole("button", { name: /show all panels$/ }).click();
  await expect(crm).not.toHaveAttribute("data-zoom");
  await expect(phone).toBeVisible();

  await page.keyboard.press("2");
  await expect(page.locator("[data-zoom]")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.locator("[data-zoom]")).toHaveCount(0);
});

test("on a phone one panel shows at a time, and the tabs follow the action", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/speed-to-lead/");
  await page.locator(READY).waitFor();
  const tabs = page.getByRole("tab");
  const shown = page.locator("[data-zoom]");
  await expect(tabs).toHaveCount(4);
  await expect(shown).toHaveCount(1);
  // It opens on the phone, where the viewer sends the first message.
  await expect(shown).toHaveAttribute("data-panel", "phone");
  await expect(page.getByRole("tab", { selected: true })).toContainText("Patient's phone");

  // Stepping on moves the action, and the wall goes with it.
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
  await expect(shown).not.toHaveAttribute("data-panel", "phone");

  // The viewer can look at any other panel.
  await page.getByRole("tab", { name: "Patient's phone" }).click();
  await expect(shown).toHaveAttribute("data-panel", "phone");
});
