import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("builds the standalone Melonite website", async () => {
  const [html, source, styles] = await Promise.all([
    readFile(new URL("../dist/index.html", import.meta.url), "utf8"),
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(html, /<title>Melonite \| Private Beta<\/title>/i);
  assert.match(source, /Iteration makes perfect\./);
  assert.match(source, /Request an invite/);
  assert.match(source, /It’s time you brought a third member into the discussion/);
  assert.match(source, /curl -fsSL https:\/\/github\.com\/meloniteai\/melonite-desktop/);
  assert.match(styles, /--outer:\s*#FAF0CA;/);
  assert.match(styles, /--ink-blue:\s*#0D3B66;/);
});

test("keeps the deployed palette aligned with source", async () => {
  const deployedCss = await readFile(
    new URL("../assets/index-D65XSmpi.css", import.meta.url),
    "utf8",
  );

  assert.match(deployedCss, /--outer:#faf0ca;/);
  assert.match(deployedCss, /--ink-blue:#0d3b66;/);
});
