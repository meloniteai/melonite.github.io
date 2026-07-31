import { mkdir, readFile, writeFile } from "node:fs/promises";
import { marked } from "marked";

const manual = await readFile(new URL("../public/manual.md", import.meta.url), "utf8");
const output = new URL("../dist/manual/", import.meta.url);
await mkdir(output, { recursive: true });

const body = await marked.parse(manual);
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Concise instructions for using Melonite Work sessions, rule sets, watchers, proof, and Prompt Weave." />
    <link rel="canonical" href="https://melonite.ai/manual/" />
    <title>Melonite product manual</title>
    <style>
      :root { color: #25242a; background: #f0ede5; font-family: ui-sans-serif, system-ui, sans-serif; }
      body { margin: 0; }
      header, main { width: min(720px, calc(100% - 40px)); margin: 0 auto; }
      header { padding: 28px 0 12px; }
      header a { color: inherit; font-weight: 700; text-decoration: none; }
      main { padding: 32px 0 80px; font-size: 17px; line-height: 1.65; }
      h1 { margin: 0 0 24px; font-size: clamp(2rem, 6vw, 3.5rem); line-height: 1.05; }
      h2 { margin-top: 40px; font-size: 1.35rem; }
      p { margin: 14px 0; }
      a { color: #5745b5; }
      code { padding: 0.16em 0.35em; border: 1px solid #cbc5b8; border-radius: 4px; background: #e7e2d8; font-size: 0.92em; overflow-wrap: anywhere; }
    </style>
  </head>
  <body>
    <header><a href="/">Melonite</a></header>
    <main>${body}</main>
  </body>
</html>
`;

await writeFile(new URL("index.html", output), html);
await writeFile(new URL("../dist/llms-full.txt", import.meta.url), manual);
