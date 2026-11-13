import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:4310", viewport: { width: 1280, height: 720 } },
  webServer: { command: "npm run dev", url: "http://localhost:4310/__demos.json", reuseExistingServer: !process.env.CI },
});
