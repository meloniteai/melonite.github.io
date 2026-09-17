import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

test("presents the lab introduction and a direct contact without the retired product sections", async () => {
  const server = await createServer({
    cacheDir: new URL("../node_modules/.vite-site-tests", import.meta.url).pathname,
    optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
  });

  try {
    const { default: App } = await server.ssrLoadModule("/App.tsx");
    const markup = renderToStaticMarkup(createElement(App));
    const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");

    assert.match(markup, /<h1[^>]*>Melonite<\/h1>/);
    assert.match(markup, /We build RL environments, evaluations, and benchmarks for AI labs\./);
    assert.match(markup, /software architecture and developer infrastructure/);
    assert.match(markup, /environments that challenge models and evaluations that make their progress measurable/);
    assert.match(markup, /href="mailto:contact@melonite\.ai"/);
    assert.equal((markup.match(/<section\b/g) ?? []).length, 1);
    assert.doesNotMatch(markup, /<nav\b|<footer\b|Request Invite|Closed beta|Download|Superbuilder|GitHub|Discord|x\.com|app\.melonite\.ai/i);

    assert.match(html, /<title>Melonite \| RL environments, evaluations, and benchmarks<\/title>/);
    assert.match(html, /content="We build RL environments, evaluations, and benchmarks for AI labs\."/);
    assert.match(html, /href="\/favicon\.png"/);
    assert.doesNotMatch(html, /private beta/i);
  } finally {
    await server.close();
  }
});
