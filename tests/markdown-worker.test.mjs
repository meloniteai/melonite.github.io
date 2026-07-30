import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createHandler } from "../worker/handler.js";
import { prefersMarkdown } from "../worker/negotiation.js";

test("negotiates Markdown only when a textual representation is preferred", () => {
  const cases = [
    [null, false],
    ["*/*", false],
    ["text/html,application/xhtml+xml,*/*;q=0.8", false],
    ["text/markdown", true],
    ["text/markdown, text/html;q=0.9", true],
    ["text/html, text/markdown;q=0.9", false],
    ["text/*", true],
    ["text/*, text/html", false],
    ["text/markdown;q=0, text/*", false],
    ["text/markdown;q=0.5, */*;q=1", false],
  ];

  for (const [accept, expected] of cases) {
    assert.equal(prefersMarkdown(accept), expected, accept ?? "missing Accept");
  }
});

test("serves only the authored Markdown for an agent request", async () => {
  const markdown = "# Melonite\n\nText only.\n";
  let originCalls = 0;
  let passThroughEnabled = false;
  const handler = createHandler(markdown, async () => {
    originCalls += 1;
    return new Response("origin");
  });
  const response = await handler.fetch(
    new Request("https://melonite.ai/", {
      headers: { Accept: "text/markdown, text/html;q=0.9" },
    }),
    {},
    { passThroughOnException: () => { passThroughEnabled = true; } },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.equal(response.headers.get("Vary"), "Accept");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(await response.text(), markdown);
  assert.equal(originCalls, 0);
  assert.equal(passThroughEnabled, true);
});

test("passes browser content through with negotiation and discovery headers", async () => {
  const originResponse = new Response(
    "<!doctype html><title>Melonite</title>",
    { headers: { "Content-Type": "text/html", Vary: "Accept-Encoding" } },
  );
  const handler = createHandler("# Melonite\n", async () => originResponse);
  const response = await handler.fetch(
    new Request("https://melonite.ai/", { headers: { Accept: "*/*" } }),
    {},
    { passThroughOnException() {} },
  );

  assert.equal(response.headers.get("Content-Type"), "text/html");
  assert.equal(response.headers.get("Vary"), "Accept-Encoding, Accept");
  assert.match(response.headers.get("Link"), /<\/index\.md>/);
  assert.match(await response.text(), /<!doctype html>/);
});

test("serves the authored document directly from /index.md", async () => {
  const markdown = "# Melonite\n";
  const handler = createHandler(markdown, async () => {
    throw new Error("the origin must not be called");
  });
  const response = await handler.fetch(
    new Request("https://melonite.ai/index.md"),
    {},
    { passThroughOnException() {} },
  );

  assert.equal(response.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.equal(await response.text(), markdown);
});

test("publishes and discovers the same text-only Markdown document", async () => {
  const [source, built, html] = await Promise.all([
    readFile(new URL("../public/index.md", import.meta.url), "utf8"),
    readFile(new URL("../dist/index.md", import.meta.url), "utf8"),
    readFile(new URL("../dist/index.html", import.meta.url), "utf8"),
  ]);

  assert.equal(built, source);
  assert.match(html, /rel="alternate" type="text\/markdown" href="\/index\.md"/);
  assert.match(html, /<main>[\s\S]*?<h1>Melonite<\/h1>/);
  assert.doesNotMatch(source, /<(?:img|script|style|video|picture)\b/i);
});
