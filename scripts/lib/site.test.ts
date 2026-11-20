import { connect } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { serveDir } from "./site.ts";

const dir = mkdtempSync(join(tmpdir(), "splitdemo-serve-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("the local file server", () => {
  it("closes at once while a browser still holds a connection it never used", async () => {
    const server = await serveDir(dir);
    const { port } = new URL(server.url);
    // Chromium opens spare connections ahead of time and may never send a byte on them.
    const spare = connect(Number(port), "127.0.0.1");
    await new Promise((open) => spare.once("connect", open));
    // The server takes connections in order, so once a later page is answered it holds the spare one too.
    expect((await fetch(`${server.url}/`)).status).toBe(404);
    try {
      const closed = await Promise.race([server.close().then(() => true), new Promise((wait) => setTimeout(() => wait(false), 1000))]);
      expect(closed).toBe(true);
    } finally {
      spare.destroy();
    }
  });
});
