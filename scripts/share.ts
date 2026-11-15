/**
 * npm run share -- <slug> [--days <n>]     shares this demo too, then publishes everything still shared
 * npm run share                            publishes again: a demo past its end date drops out
 * npm run share -- --stop <slug>           stops sharing this demo, then publishes the rest
 *   --dry-run                              builds it and has the host check it; publishes and saves nothing
 *   --yes                                  publishes without waiting (your settings ask by default)
 *
 * Every shared demo gets a folder of its own under a name nobody can guess. There is no list of them,
 * and a wrong link gets a real 404. A publish replaces the whole site, so what is not listed is gone.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { checkFile } from "./lib/load.ts";
import { buildSite, enlist, live, readLedger, suffix, today, weigh, writeLedger, type Entry } from "./lib/publish.ts";
import { BUILD_DIR } from "./lib/site.ts";
import { SETTINGS_FILE, findDemo, listDemos, settings, workspace } from "./lib/workspace.ts";

/** Pinned: a publish must not change because a new wrangler came out overnight. */
const WRANGLER = "wrangler@4.142.0";
const DEFAULT_DAYS = 30;

function stop(message: string): never {
  console.log(message);
  process.exit(1);
}

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const value = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const taken = new Set([value("--days"), value("--stop")]);
const slug = args.find((arg) => !arg.startsWith("--") && !taken.has(arg));
const dryRun = flag("--dry-run");

const config = settings();
const ws = workspace();
if (!ws) stop(`There is no workspace yet, so nowhere to keep track of what is shared. Run /splitdemo-onboarding (it writes ${SETTINGS_FILE}).`);
const hosting = config.hosting;
if (hosting?.provider !== "cloudflare" || !hosting.project) {
  stop(`Hosting is not set up in ${SETTINGS_FILE}. Run /splitdemo-onboarding, or use "npm run export -- <slug>" for a folder any host takes.`);
}

const day = today();
let ledger = readLedger(ws);

const stopped = value("--stop");
if (stopped) {
  if (!ledger.demos[stopped]) stop(`"${stopped}" is not shared. Shared now: ${Object.keys(ledger.demos).join(", ") || "nothing"}.`);
  const { [stopped]: _gone, ...rest } = ledger.demos;
  ledger = { ...ledger, demos: rest };
}

if (slug) {
  const ref = findDemo(slug);
  if (!ref) stop(`There is no demo "${slug}". Demos: ${listDemos().map((d) => d.slug).join(", ") || "none"}`);
  const { demo, problems } = await checkFile(ref.file);
  if (!demo) stop(`${slug} cannot play, so it is not shared.\n${problems.map((p) => `  problem  ${p}`).join("\n")}`);
  const days = Number(value("--days") ?? config.expiryDays ?? DEFAULT_DAYS);
  if (!Number.isInteger(days) || days < 1) stop("--days takes a whole number of days, 1 or more.");
  // An end date written in the demo wins over the usual number of days: it was put there for this prospect.
  ledger = enlist(ledger, slug, day, value("--days") ? days : (demo.expires ?? days), suffix());
}

const entries: Entry[] = [];
const shown: string[] = [];
const notes: string[] = [];
for (const [name, share] of Object.entries(ledger.demos).sort(([a], [b]) => a.localeCompare(b))) {
  if (!live(ledger, day).some(([slug]) => slug === name)) {
    notes.push(`${name}: no longer shared, it ended on ${share.expires}`);
    continue;
  }
  const ref = findDemo(name);
  if (!ref) {
    notes.push(`${name}: no longer shared, its demo.json is gone`);
    continue;
  }
  const { demo, problems } = await checkFile(ref.file);
  if (!demo) stop(`${name} is shared but cannot play any more. Fix it, or stop sharing it with --stop ${name}.\n${problems.map((p) => `  problem  ${p}`).join("\n")}`);
  entries.push({ folder: share.id, file: ref.file, demo });
  shown.push(`${name}  {link:${share.id}}  until ${share.expires}`);
}
if (stopped) notes.push(`${stopped}: no longer shared, you stopped it`);

const base = hosting.domain ? `https://${hosting.domain}` : ledger.url;
const dir = join(BUILD_DIR, "share");
const site = join(dir, "site");
mkdirSync(dir, { recursive: true });
await buildSite(entries, site, { site: true, base });

writeFileSync(
  join(dir, "wrangler.json"),
  `${JSON.stringify(
    {
      name: hosting.project,
      compatibility_date: "2026-11-01",
      assets: { directory: "./site", not_found_handling: "404-page" },
      ...(hosting.domain ? { workers_dev: false, routes: [{ pattern: hosting.domain, custom_domain: true }] } : { workers_dev: true }),
    },
    null,
    2,
  )}\n`,
);

const { files, bytes } = weigh(site);
console.log(`Cloudflare Worker "${hosting.project}"${hosting.domain ? ` on ${hosting.domain}` : base ? ` at ${base}` : " on its workers.dev address"}`);
if (!ledger.url && !dryRun) console.log(`  First publish from this workspace. If a Worker called "${hosting.project}" exists already, this replaces what it serves.`);
for (const line of shown) console.log(`  ${line.replace(/\{link:([^}]+)\}/, (_, folder: string) => `${base ?? ""}/${folder}/`)}`);
for (const note of notes) console.log(`  ${note}`);
console.log(`  ${entries.length} ${entries.length === 1 ? "demo" : "demos"}, ${files} files, ${(bytes / 1e6).toFixed(1)} MB. This replaces the whole site.`);

const wrangler = (extra: string[]) =>
  // Through the shell, because npx is a script on Windows. Run from the folder, so no path with spaces is passed.
  spawnSync(["npx", "--yes", WRANGLER, "deploy", ...extra].join(" "), { cwd: dir, shell: true, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });

if (dryRun) {
  const run = wrangler(["--dry-run"]);
  if (run.status !== 0) stop(`${run.stdout}\nThe host did not take this build. Nothing was published.`);
  console.log(`Dry run: the host takes this build. Nothing was published and nothing was saved${slug ? `, so ${slug} gets its real link when you share it` : ""}.`);
  process.exit(0);
}

// From here on the ledger is saved: the link shown above is the link the demo keeps.
writeLedger(ws, ledger);

if ((config.share ?? "ask") === "ask" && !flag("--yes")) {
  console.log("Nothing is published yet. Run this again with --yes to publish it.");
  process.exit(0);
}

const run = wrangler([]);
process.stdout.write(run.stdout);
if (run.status !== 0) stop("The publish failed. Nothing changed online.");

const address = hosting.domain ? `https://${hosting.domain}` : /https:\/\/[a-z0-9.-]+\.workers\.dev/.exec(run.stdout)?.[0];
if (address && address !== ledger.url) writeLedger(ws, { ...ledger, url: address });
console.log("Published:");
for (const entry of entries) console.log(`  ${address ?? ""}/${entry.folder}/`);
if (address && !base) console.log("Share once more to give each link a preview picture: the address was not known until now.");
