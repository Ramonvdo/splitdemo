import { describe, expect, it } from "vitest";
import { describe as summary, enlist, live, stamp, type Ledger } from "./publish.ts";

const PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta name="description" content="A scripted example." />
    <title>Demo</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

describe("the ledger of shared demos", () => {
  it("gives a demo a link nobody can guess from its name, and an end date", () => {
    const ledger = enlist({ demos: {} }, "acme-dental", "2026-11-13", 30, "k3x9");
    expect(ledger.demos).toEqual({ "acme-dental": { id: "acme-dental-k3x9", created: "2026-11-13", expires: "2026-12-13" } });
  });

  it("keeps the link when a demo is shared again, and moves the end date", () => {
    const first = enlist({ demos: {} }, "acme-dental", "2026-11-13", 30, "k3x9");
    const again = enlist(first, "acme-dental", "2026-11-20", 30, "zzzz");
    expect(again.demos["acme-dental"]).toEqual({ id: "acme-dental-k3x9", created: "2026-11-13", expires: "2026-12-20" });
  });

  it("takes an end date as given, across a year's end", () => {
    expect(enlist({ demos: {} }, "a", "2026-12-20", 30, "aaaa").demos.a.expires).toBe("2027-01-19");
    expect(enlist({ demos: {} }, "a", "2026-12-20", "2027-03-01", "aaaa").demos.a.expires).toBe("2027-03-01");
  });

  it("shares a demo through its last day, and not after", () => {
    const ledger: Ledger = {
      demos: {
        old: { id: "old-aaaa", created: "2026-10-01", expires: "2026-10-31" },
        last: { id: "last-bbbb", created: "2026-10-14", expires: "2026-11-13" },
        fresh: { id: "fresh-cccc", created: "2026-11-13", expires: "2026-12-13" },
      },
    };
    expect(live(ledger, "2026-11-13").map(([slug]) => slug)).toEqual(["fresh", "last"]);
    expect(live(ledger, "2026-11-14").map(([slug]) => slug)).toEqual(["fresh"]);
  });
});

describe("a shared page", () => {
  const demo = {
    title: "A new patient texts after closing time",
    outcome: [
      { value: "38 sec", label: "to first reply", was: "14 h" },
      { value: "+1", label: "patient booked overnight" },
    ],
  };

  it("says in one line what the business gained", () => {
    expect(summary(demo)).toBe("38 sec to first reply (was 14 h). +1 patient booked overnight.");
  });

  it("carries the demo's title and gain where a link preview and a reader without scripts find them", () => {
    const html = stamp(PAGE, { title: demo.title, description: summary(demo) });
    expect(html).toContain("<title>A new patient texts after closing time</title>");
    expect(html).toContain('<meta name="description" content="38 sec to first reply (was 14 h). +1 patient booked overnight." />');
    expect(html).toContain('<meta property="og:title" content="A new patient texts after closing time" />');
    expect(html).toContain('<meta property="og:description" content="38 sec to first reply (was 14 h). +1 patient booked overnight." />');
    expect(html).toMatch(/<div id="root"><main[^>]*><h1[^>]*>A new patient texts after closing time<\/h1>/);
    expect(html).not.toContain("og:image");
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
  });

  it("names its picture only when it knows its own address", () => {
    const html = stamp(PAGE, { title: "T", description: "D", image: "https://demo.example.com/t-aaaa/poster.png" });
    expect(html).toContain('<meta property="og:image" content="https://demo.example.com/t-aaaa/poster.png" />');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />');
  });

  it("writes a title as text, whatever is in it", () => {
    const html = stamp(PAGE, { title: `</title><script>alert(1)</script> "R&D"`, description: `a "b" <c>` });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("<title>&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt; &quot;R&amp;D&quot;</title>");
    expect(html).toContain('content="a &quot;b&quot; &lt;c&gt;"');
  });
});
