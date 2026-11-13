import { expect, test } from "@playwright/test";
import { spills } from "./spills.ts";

const PANELS = ["calendar", "campaign", "crm", "form", "inbox", "kpi", "phone", "sheet", "workflow"];

test("the gallery draws every panel with its example, and nothing in them spills", async ({ page }) => {
  await page.goto("/__panels");
  await page.locator("main.gallery").waitFor();
  for (const name of PANELS) await expect(page.locator(`[data-example="${name}"]`)).toBeVisible();
  expect(await spills(page, "main.gallery [data-example]")).toEqual([]);
});

test("replay runs an example's actions again, one at a time", async ({ page }) => {
  await page.goto("/__panels");
  const crm = page.locator('[data-example="crm"]');
  const card = '[data-card="lindqvist"]';
  await expect(crm.locator(`[data-column="quoted"] ${card}`)).toContainText("Quote sent");

  await crm.getByRole("button", { name: "Replay" }).click();
  await expect(crm.locator(card)).toHaveCount(0);
  await expect(crm.locator(`[data-column="new"] ${card}`)).toBeVisible();
  await expect(crm.locator(`[data-column="quoted"] ${card}`)).toContainText("Quote sent", { timeout: 8_000 });
});
