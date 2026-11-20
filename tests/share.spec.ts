import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { HEADERS, type Ledger } from "../scripts/lib/publish.ts";
import { BUILD_DIR, serveDir } from "../scripts/lib/site.ts";
import { ROOT } from "../scripts/lib/workspace.ts";
import { READY } from "../scripts/lib/spills.ts";

// One workspace and one build folder for the whole file: these run one after the other.
test.describe.configure({ mode: "serial", timeout: 180_000 });

const SITE = join(BUILD_DIR, "share", "site");
let ws: string;
let config: string;

/** Runs a script the way `npm run` does, against the workspace of this test. */
function run(script: string, args: string[], settings = config): string {
  return execFileSync(process.execPath, [join("scripts", script), ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, SPLITDEMO_CONFIG: settings, SPLITDEMO_WORKSPACE: ws },
  });
}

const ledger = () => JSON.parse(readFileSync(join(ws, "shares.json"), "utf8")) as Ledger;

/** Every word in a folder's text files, as one string. */
function words(dir: string): string {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.(html|json|js|css|txt)$/.test(entry.name))
    .map((entry) => readFileSync(join(entry.parentPath, entry.name), "utf8"))
    .join("\n");
}

test.beforeAll(() => {
  ws = mkdtempSync(join(tmpdir(), "splitdemo-share-"));
  config = join(ws, "config.json");
  writeFileSync(config, JSON.stringify({ workspace: ws, hosting: { provider: "cloudflare", project: "splitdemo-test" }, share: "ask" }));
  const copy = (slug: string, from: string, title: string) => {
    const demo = JSON.parse(readFileSync(join(ROOT, "examples", from, "demo.json"), "utf8"));
    mkdirSync(join(ws, "demos", slug), { recursive: true });
    writeFileSync(join(ws, "demos", slug, "demo.json"), JSON.stringify({ ...demo, title }));
  };
  copy("acme-dental", "speed-to-lead", "Acme Dental answers a text after closing time");
  copy("birch-roofing", "intake-to-booking", "Birch Roofing books an inspection from a form");
  copy("old-one", "cold-outreach", "Cedar Cleaning reaches new offices");
  const seeded: Ledger = {
    demos: {
      "birch-roofing": { id: "birch-roofing-abcd", created: "2026-01-01", expires: "2999-01-01" },
      "old-one": { id: "old-one-wxyz", created: "2020-01-01", expires: "2020-01-31" },
    },
  };
  writeFileSync(join(ws, "shares.json"), JSON.stringify(seeded));
});

test.afterAll(() => rmSync(ws, { recursive: true, force: true }));

test("a dry run builds what would go online, has the host check it, and publishes and saves nothing", () => {
  const before = readFileSync(join(ws, "shares.json"), "utf8");
  const out = run("share.ts", ["acme-dental", "--dry-run"]);

  expect(out).toContain('Cloudflare Worker "splitdemo-test"');
  expect(out).toMatch(/acme-dental {2}\/acme-dental-[a-hjkmnp-z2-9]{8}\/ {2}until \d{4}-\d{2}-\d{2}/);
  expect(out).toContain("birch-roofing  /birch-roofing-abcd/  until 2999-01-01");
  expect(out).toContain("old-one: no longer shared, it ended on 2020-01-31");
  expect(out).toContain("Dry run: the host takes this build. Nothing was published and nothing was saved");
  expect(readFileSync(join(ws, "shares.json"), "utf8")).toBe(before);

  // Exactly the demos still shared, each in its own folder, and no page that lists them.
  const top = readdirSync(SITE).sort();
  expect(top.filter((name) => !name.includes("-"))).toEqual(["404.html", "_headers", "robots.txt"]);
  expect(top.filter((name) => name.includes("-")).map((name) => name.replace(/-[a-z2-9]+$/, ""))).toEqual(["acme-dental", "birch-roofing"]);
  expect(readFileSync(join(SITE, "_headers"), "utf8")).toContain("X-Robots-Tag: noindex, nofollow");
});

test("one prospect's folder holds nothing of another's", () => {
  const acme = readdirSync(SITE).find((name) => name.startsWith("acme-dental-"))!;
  expect(words(join(SITE, acme))).toContain("Acme Dental");
  expect(words(join(SITE, acme))).not.toMatch(/Birch|Cedar/);
  expect(words(join(SITE, "birch-roofing-abcd"))).toContain("Birch Roofing");
  expect(words(join(SITE, "birch-roofing-abcd"))).not.toMatch(/Acme|Cedar/);
});

test("a shared demo plays under the headers it is served with, and a wrong link is a real 404", async ({ page }) => {
  const server = await serveDir(SITE, HEADERS);
  const errors: string[] = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(String(error)));
  try {
    const acme = readdirSync(SITE).find((name) => name.startsWith("acme-dental-"))!;
    const html = await (await page.request.get(`${server.url}/${acme}/`)).text();
    expect(html).toContain("<title>Acme Dental answers a text after closing time</title>");
    expect(html).toContain('<meta property="og:description" content="38 sec to first reply (was 14 h).');

    await page.goto(`${server.url}/${acme}/?mode=fast&autoplay=1`);
    await page.locator(READY).waitFor();
    await expect(page.locator("main.stage[data-done]")).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveTitle("Acme Dental answers a text after closing time");

    for (const wrong of ["/", "/acme-dental/", "/old-one-wxyz/", `/${acme}x/`]) {
      const response = await page.goto(`${server.url}${wrong}`);
      expect(response?.status(), wrong).toBe(404);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("This demo is not here");
    }
    // The 404 itself is a failed load in the console; anything else is a real fault.
    expect(errors.filter((error) => !error.includes("404"))).toEqual([]);
  } finally {
    await server.close();
  }
});

test("asked to share, it saves the link and waits for a yes before anything goes online", () => {
  const out = run("share.ts", ["acme-dental", "--days", "7"]);
  expect(out).toContain("Nothing is published yet. Run this again with --yes to publish it.");
  expect(out).not.toContain("Published:");
  const id = ledger().demos["acme-dental"].id;
  expect(id).toMatch(/^acme-dental-[a-hjkmnp-z2-9]{8}$/);
  expect(out).toContain(`/${id}/`);

  // Asked again, the demo keeps its link.
  expect(run("share.ts", ["acme-dental"])).toContain(`/${id}/`);
  expect(ledger().demos["acme-dental"].id).toBe(id);
});

test("a demo you stop sharing is left out of the next publish", () => {
  const out = run("share.ts", ["--stop", "birch-roofing"]);
  expect(out).toContain("birch-roofing: no longer shared, you stopped it");
  expect(ledger().demos["birch-roofing"]).toBeUndefined();
  expect(readdirSync(SITE).some((name) => name.startsWith("birch-roofing"))).toBe(false);
});

test("on a domain of its own, a link preview gets a picture of the outcome", () => {
  const own = join(ws, "config-domain.json");
  writeFileSync(own, JSON.stringify({ workspace: ws, hosting: { provider: "cloudflare", project: "splitdemo-test", domain: "demos.example.com" }, share: "ask" }));
  const out = run("share.ts", ["--dry-run"], own);
  const id = ledger().demos["acme-dental"].id;
  expect(out).toContain(`https://demos.example.com/${id}/`);
  expect(readFileSync(join(SITE, id, "index.html"), "utf8")).toContain(`<meta property="og:image" content="https://demos.example.com/${id}/poster.png" />`);
  expect(existsSync(join(SITE, id, "poster.png"))).toBe(true);
  const wrangler = JSON.parse(readFileSync(join(BUILD_DIR, "share", "wrangler.json"), "utf8"));
  expect(wrangler.routes).toEqual([{ pattern: "demos.example.com", custom_domain: true }]);
  expect(wrangler.assets).toEqual({ directory: "./site", not_found_handling: "404-page" });
});

test("an export is one folder that plays on its own", async ({ page }) => {
  const out = run("export.ts", ["acme-dental"]);
  const folder = join(ws, "demos", "acme-dental", "export", "acme-dental");
  expect(out).toContain(folder);
  expect(readFileSync(join(folder, "index.html"), "utf8")).toContain("<title>Acme Dental answers a text after closing time</title>");
  const server = await serveDir(join(folder, ".."));
  try {
    await page.goto(`${server.url}/acme-dental/?at=end`);
    await expect(page.locator("main.stage[data-done]")).toBeVisible();
  } finally {
    await server.close();
  }
});
