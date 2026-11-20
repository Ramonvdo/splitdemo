import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname, join, normalize, sep } from "node:path";
import { build } from "vite";
import { ROOT } from "./workspace.ts";

/** Everything the scripts generate lives here. It is ignored by git. */
export const BUILD_DIR = join(ROOT, ".build");

/**
 * Builds the app once: the same files play any demo.json placed next to them.
 * Each run builds into a folder of its own and removes it when it ends, so two scripts at once never share one.
 */
export async function buildApp(): Promise<string> {
  const dir = join(BUILD_DIR, `app-${process.pid}`);
  process.once("exit", () => rmSync(dir, { recursive: true, force: true }));
  await build({ root: ROOT, logLevel: "warn", build: { outDir: dir, emptyOutDir: true } });
  return dir;
}

/**
 * Writes one self-contained folder per demo: the built app with that demo's demo.json beside it.
 * A folder holds one demo and nothing about any other, so it can be sent to a prospect as it is.
 */
export function writeSite(app: string, demos: { folder: string; file: string }[], out: string): void {
  rmSync(out, { recursive: true, force: true });
  for (const demo of demos) {
    const dir = join(out, demo.folder);
    mkdirSync(dir, { recursive: true });
    cpSync(app, dir, { recursive: true });
    cpSync(demo.file, join(dir, "demo.json"));
  }
}

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
};

/**
 * Serves a folder on this machine only, on a free port, the way the host serves a share:
 * `headers` go out with every file, and an unknown path is a real 404 that shows the folder's 404.html when it has one.
 */
export function serveDir(dir: string, headers: Record<string, string> = {}): Promise<{ url: string; close(): Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const path = decodeURIComponent((req.url ?? "/").split("?")[0]);
    let file = normalize(join(dir, path));
    if (file !== dir && !file.startsWith(dir + sep)) file = dir;
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file)) {
      const page = join(dir, "404.html");
      res.writeHead(404, { ...headers, "Content-Type": existsSync(page) ? TYPES[".html"] : TYPES[".txt"] });
      return res.end(existsSync(page) ? readFileSync(page) : "Not found");
    }
    res.writeHead(200, { ...headers, "Content-Type": TYPES[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    res.end(readFileSync(file));
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") return reject(new Error("the local server did not get a port"));
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        // A browser keeps spare connections it may never use, and on Node 22 close() waits for those too.
        close: () =>
          new Promise((done) => {
            server.close(() => done());
            server.closeAllConnections();
          }),
      });
    });
  });
}
