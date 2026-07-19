import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Melonite landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Melonite \| Private Beta<\/title>/i);
  assert.match(html, /Iteration makes perfect\./);
  assert.match(html, /Request an invite/);
  assert.match(html, /It’s time you brought a third member into the discussion/);
  assert.match(html, /curl -fsSL https:\/\/github\.com\/meloniteai\/melonite-desktop/);
});

test("keeps source and deployed palettes aligned", async () => {
  const [sourceCss, deployedCss] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../assets/index-D65XSmpi.css", import.meta.url), "utf8"),
  ]);

  assert.match(sourceCss, /--outer:\s*#FAF0CA;/);
  assert.match(sourceCss, /--ink-blue:\s*#0D3B66;/);
  assert.match(deployedCss, /--outer:#faf0ca;/);
  assert.match(deployedCss, /--ink-blue:#0d3b66;/);
});
