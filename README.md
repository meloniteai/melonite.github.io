# Melonite — static Markdown blog + typographic New York skyline

A TypeScript site using Vite, Three.js, GLSL, and build-time Markdown articles,
prepared for static hosting on GitHub Pages. There is no server or database to run:
the repository's Markdown files are the content source.
The Melonite page uses black text on white, with a soft blue sunset sky inside the
skyline artwork. It includes the supplied SVG
logo beside the name, Contact / Partners navigation, the mission statement,
two article headlines with arrow links, and an interactive skyline on the lower right.
All typography uses Cormorant Garamond, bundled locally through
`@fontsource/cormorant-garamond`: Regular (400) for body copy, Medium (500) for
navigation and article links, SemiBold (600) for the hero and wordmark, and
Bold (700) for the dense building paragraphs. The font faces load before canvas textures are
typeset, preventing fallback lettering from being baked into the skyline.

## Run and check

```sh
npm install
npm run dev
npm run typecheck
npm test
npm run build
npm run check:build
```

Use Node 22.18 or later (`nvm use`) for native TypeScript support. The production
build generates article HTML, runs strict TypeScript checking, and bundles the
complete site into `dist/`. `npm run check:build` verifies the compiled Markdown,
page links, and asset/font paths. `npm run preview` serves that production build.

## Page content

Edit `src/site.ts` for the site name, introduction, and copyright. The header
and footer are shared by the home page and articles through `src/site-layout.ts`.
The logo uses `assets/inspo/header-logo.svg` with its original proportions.

- Contact opens an email to `contact@melonite.ai`.
- Partners is an inactive page-link placeholder. Set its `href` and remove
  `aria-disabled` in `src/site-layout.ts` when its page is ready.
- Published article headlines and arrows are ordinary links to separate pages.
- CRE Bench remains an inactive headline until `content/posts/cre-bench.md`
  is added. Its placeholder is in `src/content.ts` and is automatically replaced
  by the matching published article.

`src/landing.ts` renders the page, `src/main.ts` mounts the page and skyline, and
`src/styles.css` owns the responsive layout. Editable content is
escaped before it is rendered as HTML. The Three.js/GLSL bundle is only loaded on
the home page and artwork previews; articles have a small independent entry point.

## Editing and adding Markdown posts

Edit **`content/posts/angel-round-data-partner.md`** to update the announcement.
Its local URL is `http://127.0.0.1:5173/posts/angel-round-data-partner/`.
The article includes the partnership, underwriting evaluations, and angel
investment announcement. Edit the Markdown directly to revise its copy.

Add a lowercase, hyphenated `.md` file in `content/posts/` for another post:

```markdown
---
title: Your article title
description: A short description for search results and link previews.
order: 3
draft: true
---

Write the article here. Markdown headings, links, lists, emphasis, images,
quotes, and tables are supported.
```

Only `title` is required. Remove `draft: true` or set it to `false` to publish.
Optional `date: "2026-11-13"` displays a publication date; no date is invented
when it is absent. `order` sorts the home-page list ascending; ties use newest
date first, then filename. The filename determines the permanent URL:
`content/posts/my-post.md` becomes `/posts/my-post/`.

Markdown saves automatically regenerate pages and refresh the dev preview.
`npm run build` packages the current Markdown on every build. It emits a real
`dist/posts/<filename>/index.html`, so direct URLs and refreshes work without
client-side routing or a Pages 404 workaround. The body is readable without
JavaScript. Raw HTML in Markdown is escaped.

Use site-root links such as `[Another post](/posts/another-post/)`; the build
adds the configured repository prefix. Put images in `public/images/` and use
`![Description](/images/photo.jpg)` to include them. Vite copies `public/` to
the deployed site. Do not edit `posts/`, `.generated/`, or `dist/`: these are
generated, ignored directories, recreated from Markdown.

## GitHub Actions and GitHub Pages

The workflow at `.github/workflows/pages.yml` runs tests, checks a repository-path
build, and builds the site on pushes and pull requests. Only pushes/manual runs
on the repository's default branch deploy to the `github-pages` environment.
PR builds do not deploy. The workflow uses `npm ci` and the committed lockfile.

This repository is `meloniteai/melonite.github.io`, with GitHub Pages configured
for the custom domain `melonite.ai`. Pushes to `main` build and deploy the site.
`CNAME` and `public/CNAME` preserve that domain in source and build output.

To configure deployment in another repository:

1. In the repository, open **Settings → Pages → Build and deployment**.
2. Set **Source** to **GitHub Actions**.
3. Push to the default branch or run **Build and deploy GitHub Pages** manually.

The workflow obtains `base_path` from GitHub's Pages configuration, handling
both `/<repository>/` project sites and root/custom-domain sites automatically.
It uploads only `dist/`, not source PDFs, reference photos, or Markdown files.
Configure any custom domain in the repository's Pages settings.

For a local project-path production check:

```sh
BASE_PATH=/my-repository/ npm run build
BASE_PATH=/my-repository/ npm run check:build
BASE_PATH=/my-repository/ npm run preview
```

Then open `http://127.0.0.1:4173/my-repository/`. Run `npm run build` again
without `BASE_PATH` to return to the root-path build.
See the [Vite Pages guide](https://vite.dev/guide/static-deploy#github-pages)
and [GitHub's workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Skyline size and previews

On desktop the canvas spans the full article section, with a layered neighborhood
tapering down toward the left beneath the links. Eight varied foreground,
middle-distance, and distant volumes use different footprints, heights, ink
strengths, and text scales. Overlapping facades conceal the bases of buildings
behind them. The original tower group keeps
its previous scale: about 480px wide at a 1102px viewport and 550px on larger
screens. The renderer expands the camera to the left, revealing the tall tower's
narrow return wall and joining its base with a continuous foreground facade.

Below 940px, the compact tower composition takes a separate row at 80% of the
available width. On phones, a taller 4:5 composition preserves the silhouettes.

Standalone, label-free previews are still available:

- `/?view=artwork` — larger landscape artwork.
- `/?view=slot` — legacy compact 360 × 240 placement for comparison.
- `/?view=portrait` — original portrait composition.

## Renderer

`createSkyline(element, options)` in `src/skyline.ts` returns a typed `Skyline`
instance. Give the container an explicit size or aspect ratio. A ResizeObserver
recomposes the walls for the actual dimensions without stretching the letters.
Call `dispose()` when unmounting. `src/skyline-slot.css` is also available for
embedding the component elsewhere.

The wall meshes use an architectural oblique projection in GLSL. Distance scales
the western buildings and their typography together; draw layers and atmospheric
ink attenuation provide depth. The
Empire State Building has a stepped crown and slender antenna derived from the
additional reference in `assets/inspo/`. The reference images are not textures.
Canvas typesetting generates dense paragraph textures; GLSL handles ink, haze,
face shading, and scrolling rows.

The sky palette is sampled from `assets/inspo/97e829ce06133233f550935cd7b4652e.jpg`:
upper blue `#6780bc`, middle blue `#849cd0`, pale blue `#adbcdc`, and blue haze
`#caccd4`. Warm accents are resampled from the supplied crop, saved as
`assets/inspo/sunset-warm-detail.png`: cream `#ffe8c5`, buttery gold `#ffe2a2`,
apricot `#fab081`, and muted coral `#c69683`.
`src/shaders/sunset.glsl` fills the open sky at up to 42% strength, emphasizing
the empty wedge above the low buildings. Blue remains dominant, with warmth
beginning softly around the lower third. The expanded transition leaves room
for cream, gold, apricot, and coral before the bottom fade. A gentle feather preserves color toward
the perimeter before all four borders reach white; the top has a broader fade
to avoid a visible horizontal band. Facades receive one tenth of that
tint, keeping the building paper white and the ink black.
The open sky has fine white grain in two layers that drift slowly at different
speeds and fade with its edges; building faces and black lettering remain clean.
Grain is sized in CSS pixels so its scale is consistent across pixel ratios and
PNG exports. The gradient stays fixed, while the grain moves independently of
cursor input. Exports freeze the grain for a consistent snapshot.

Cursor movement anywhere on the page gives the rows momentum at slightly
different speeds. Stopping or leaving the page lets them settle without resetting
their positions. The architecture
stays fixed. The ambient sky clock runs at 30 fps while visible, even when the
cursor and text are idle. Both animations pause offscreen or in a background
tab and honor reduced-motion preferences. Touch input preserves scrolling.
Concurrent sky and text updates share one scheduled WebGL draw per frame.
Pass `{ motion: false }` for a static instance, or `{ motionTarget: document }`
for page-wide input (as used on this page). By default an embedded instance
listens within its own element. `{ extendLeft: true }` enables the western
neighborhood in panoramic slots, as used on the landing page. `exportPng(2400)`
returns a PNG Blob at the full canvas's current aspect ratio.

`npm test` covers Markdown edits, article generation, drafts, deletion, metadata
validation, literal text, repository-path links, independent ambient motion,
motion settling, background/offscreen behavior, reduced motion,
touch input, static mode, document-level input and element transitions, and
cleanup. The real WebGL output and pointer input are also checked in the browser.

## Text provenance

The four long paragraphs in `src/excerpts.ts` are original adaptations, not
verbatim excerpts or text authored by E. B. White. They draw on the supplied
*Here is New York* PDF's themes of newcomers (book pp. 26–27), urban poetry
(p. 29), and vertical Manhattan (pp. 30–31). A reproduction limit prevented
including longer verbatim passages. Attribution lives in this file and the
source so the artwork itself remains free of labels.

## Design references

The source design references (photos and the E. B. White PDF mentioned above)
remain in the local design workspace. This repository includes the logo needed
by the website; the skyline and sky are generated from TypeScript and GLSL.
