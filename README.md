# Melonite website

The public Melonite landing page, built with Vite and React.

## Development

```bash
npm install
npm run dev
```

The local site runs at `http://localhost:3000/`.

## Verification

```bash
npm test
npm run lint
```

## Markdown for agents

The homepage supports RFC 7763 content negotiation at the Cloudflare edge.
Clients that explicitly prefer Markdown receive an authored, text-only
representation from the canonical URL:

```bash
curl https://melonite.ai/ -H 'Accept: text/markdown'
```

Browsers and clients that send only `*/*` continue to receive the GitHub Pages
HTML. The same Markdown document is also published at `/index.md` and advertised
with `rel="alternate"` metadata. Deploy edge changes with `npm run worker:deploy`.

Source lives in `src/`. The repository root also contains the static deployment
artifact served by GitHub Pages.
