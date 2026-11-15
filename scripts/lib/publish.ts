import { randomInt } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";
import type { Demo } from "../../src/engine/types.ts";
import { buildApp, serveDir, writeSite } from "./site.ts";
import { READY } from "./spills.ts";

/** One shared demo: where it is served, and until when. */
export interface Share {
  /** The folder it is served from: the slug and four characters nobody can guess. */
  id: string;
  created: string;
  /** The last day it is shared, as YYYY-MM-DD. */
  expires: string;
}

/** What is shared from a workspace. It lives in <workspace>/shares.json. */
export interface Ledger {
  /** Where the last publish went, so the next one can print full links. */
  url?: string;
  demos: Record<string, Share>;
}

const LEDGER = "shares.json";

export function readLedger(workspace: string): Ledger {
  const file = join(workspace, LEDGER);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Ledger) : { demos: {} };
}

export function writeLedger(workspace: string, ledger: Ledger): void {
  writeFileSync(join(workspace, LEDGER), `${JSON.stringify(ledger, null, 2)}\n`);
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const at = new Date(`${date}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
}

// No 0, 1, i, l or o: a link gets read out loud and typed over.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function suffix(): string {
  return Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

/**
 * Puts a demo on the ledger, or moves its end date when it is there already.
 * `until` is a number of days from `day`, or the last day itself. A demo keeps its link for good:
 * a prospect who got it once can open it again after a new share.
 */
export function enlist(ledger: Ledger, slug: string, day: string, until: number | string, fresh: string): Ledger {
  const was = ledger.demos[slug];
  const expires = typeof until === "number" ? addDays(day, until) : until;
  return { ...ledger, demos: { ...ledger.demos, [slug]: { id: was?.id ?? `${slug}-${fresh}`, created: was?.created ?? day, expires } } };
}

/** The demos still shared on `day`, by name. */
export function live(ledger: Ledger, day: string): [string, Share][] {
  return Object.entries(ledger.demos)
    .filter(([, share]) => share.expires >= day)
    .sort(([a], [b]) => a.localeCompare(b));
}

/** What the business gained, in one line: the outcome as a link preview reads it. */
export function describe(demo: Pick<Demo, "outcome">): string {
  return demo.outcome.map((o) => `${o.value} ${o.label}${o.was ? ` (was ${o.was})` : ""}.`).join(" ");
}

function text(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * The built page, made this demo's own: its title and gain where a link preview reads them,
 * and its title in the page itself for the moment before the app has loaded.
 */
export function stamp(html: string, meta: { title: string; description: string; image?: string }): string {
  const title = text(meta.title);
  const description = text(meta.description);
  const head = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    ...(meta.image ? [`<meta property="og:image" content="${text(meta.image)}" />`, `<meta name="twitter:card" content="summary_large_image" />`] : []),
  ];
  const boot = `<main style="display:grid;place-items:center;height:100dvh;padding:2rem;text-align:center;font:500 1.1rem system-ui,sans-serif;color:#9aa0ac"><h1 style="margin:0;font:inherit">${title}</h1></main>`;
  // A function as the replacement: a title may hold "$1", which a string replacement would read as a group.
  return html
    .replace(/<title>[^<]*<\/title>/, () => `<title>${title}</title>`)
    .replace(/<meta name="description"[^>]*>/, () => `<meta name="description" content="${description}" />`)
    .replace("</head>", () => `  ${head.join("\n    ")}\n  </head>`)
    .replace('<div id="root"></div>', () => `<div id="root">${boot}</div>`);
}

/** Sent with every file: keep it out of search engines, and let the page load only what sits next to it. */
export const HEADERS: Record<string, string> = {
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'",
};

const ROBOTS = "User-agent: *\nDisallow: /\n";

const NOT_FOUND = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="color-scheme" content="dark" />
    <title>This demo is not here</title>
    <style>
      body { margin: 0; min-height: 100dvh; display: grid; place-items: center; background: #0f1012; color: #f1f2f4; font: 1.05rem/1.5 system-ui, sans-serif; }
      main { max-width: 30rem; padding: 2rem; }
      i { display: block; width: 0.6rem; height: 0.6rem; border-radius: 50%; background: #ff5c35; margin-bottom: 1.4rem; }
      h1 { margin: 0 0 0.6rem; font-size: 1.7rem; line-height: 1.2; }
      p { margin: 0; color: #9aa0ac; }
    </style>
  </head>
  <body>
    <main>
      <i></i>
      <h1>This demo is not here</h1>
      <p>The link has run out, or a character went missing on the way. Ask the person who sent it for a new one.</p>
    </main>
  </body>
</html>
`;

export interface Entry {
  /** The folder the demo is served from. */
  folder: string;
  file: string;
  demo: Demo;
}

/**
 * Writes the folder a host serves: one folder per demo, each with its own stamped page.
 * With `site`, also the parts of a whole shared site: a page for a link that leads nowhere,
 * the files that keep it out of search engines, and no list of what else is there.
 * With `base` (where the site will be served), each demo gets a picture for its link preview.
 */
export async function buildSite(entries: Entry[], out: string, options: { site?: boolean; base?: string } = {}): Promise<void> {
  writeSite(await buildApp(), entries.map(({ folder, file }) => ({ folder, file })), out);
  if (options.base && entries.length) await posters(entries, out);
  for (const { folder, demo } of entries) {
    const page = join(out, folder, "index.html");
    const image = options.base ? `${options.base}/${folder}/poster.png` : undefined;
    writeFileSync(page, stamp(readFileSync(page, "utf8"), { title: demo.title, description: describe(demo), image }));
  }
  if (!options.site) return;
  writeFileSync(join(out, "404.html"), NOT_FOUND);
  writeFileSync(join(out, "robots.txt"), ROBOTS);
  writeFileSync(join(out, "_headers"), `/*\n${Object.entries(HEADERS).map(([name, value]) => `  ${name}: ${value}\n`).join("")}`);
}

/** The end of each demo as a picture, at the size a link preview shows. */
async function posters(entries: Entry[], out: string): Promise<void> {
  const server = await serveDir(out);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    for (const { folder } of entries) {
      await page.goto(`${server.url}/${folder}/?record=1&at=end`);
      await page.locator(READY).waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: join(out, folder, "poster.png") });
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

/** How many files a folder holds, and their size together. */
export function weigh(dir: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue;
    files += 1;
    bytes += statSync(join(entry.parentPath, entry.name)).size;
  }
  return { files, bytes };
}
