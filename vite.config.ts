import { readFileSync } from "node:fs";
import { join } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { ROOT, findDemo, listDemos } from "./scripts/lib/workspace.ts";

/**
 * Dev only. Serves every demo (the examples, and the ones in your workspace) at /<slug>/,
 * checks it on the way out, and reloads the page when its demo.json changes.
 */
function demos(): Plugin {
  return {
    name: "splitdemo:demos",
    apply: "serve",
    configureServer(server) {
      if (process.env.VITEST) return;
      server.watcher.on("change", (file) => {
        if (file.endsWith("demo.json")) server.ws.send({ type: "full-reload" });
      });
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? "").split("?")[0];
        const send = (code: number, body: unknown) => {
          res.statusCode = code;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify(body));
        };
        if (path === "/__demos.json") {
          const list = listDemos().map((ref) => {
            let title = ref.slug;
            try {
              title = JSON.parse(readFileSync(ref.file, "utf8")).title ?? ref.slug;
            } catch {
              // A broken demo.json still shows in the list; opening it says what is wrong.
            }
            return { slug: ref.slug, source: ref.source, title };
          });
          return send(200, list);
        }
        const match = /^\/([a-z0-9][a-z0-9-]*)(\/demo\.json|\/)?$/.exec(path);
        if (!match) return next();
        const ref = findDemo(match[1]);
        if (match[2] !== "/demo.json") {
          if (ref && !match[2]) {
            res.statusCode = 302;
            res.setHeader("Location", `/${ref.slug}/`);
            return res.end();
          }
          return next();
        }
        if (!ref) return send(404, { problems: [`There is no demo "${match[1]}".`] });
        server.watcher.add(ref.file);
        let raw: unknown;
        try {
          raw = JSON.parse(readFileSync(ref.file, "utf8"));
        } catch (e) {
          return send(422, { problems: [`demo.json is not valid JSON: ${e instanceof Error ? e.message : String(e)}`] });
        }
        const { checkDemo } = (await server.ssrLoadModule("/scripts/lib/load.ts")) as typeof import("./scripts/lib/load.ts");
        const { problems } = await checkDemo(raw);
        return problems.length ? send(422, { problems }) : send(200, raw);
      });
    },
  };
}

export default defineConfig({
  // Relative, so one build runs from any folder: a share copies it into a folder per demo.
  base: "./",
  plugins: [react(), tailwindcss(), demos()],
  resolve: { alias: { "@": join(ROOT, "src") } },
  server: { port: 4310, strictPort: true },
  preview: { port: 4311, strictPort: true },
  test: { include: ["src/**/*.test.ts"] },
});
