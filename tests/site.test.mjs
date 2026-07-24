import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("builds the updated standalone Melonite website", async () => {
  const [html, source, heroSection, heroCopy, banner, brandMark, parallax, product, installCommand, nav, footer, discordIcon, styles] = await Promise.all([
    readFile(new URL("../dist/index.html", import.meta.url), "utf8"),
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/HeroSection.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/HeroCopy.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/ClosedBetaBanner.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/BrandMark.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/useHeroParallax.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/components/ProductShowcase.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/InstallCommand.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/FloatingNav.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/Footer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/DiscordIcon.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(html, /<title>Melonite \| Private Beta<\/title>/i);
  assert.match(source, /<FloatingNav \/>/);
  assert.match(source, /<HeroSection \/>/);
  assert.match(source, /<AboutSection \/>/);
  assert.match(source, /<ProductShowcase \/>/);
  assert.doesNotMatch(heroSection, /HeroMorph/);
  assert.doesNotMatch(heroSection, /hero-animation\.(mp4|webm)/);
  assert.match(heroSection, /useHeroParallax\(sectionRef\)/);
  assert.match(heroSection, /hero-grid-overlay\.png/);
  assert.match(heroSection, /pixel-grid-base-clean\.png/);
  assert.match(
    styles,
    /\.hero-transition-art\s*\{[\s\S]*?rotate\(180deg\)/,
  );
  assert.match(
    styles,
    /\.hero-section::after\s*\{[\s\S]*?background:\s*var\(--section-paper\)/,
  );
  assert.match(heroSection, /<HeroTextGridHalo \/>/);
  assert.match(heroSection, /<ClosedBetaBanner \/>/);
  assert.doesNotMatch(heroSection, /<InviteGridHalo \/>/);
  assert.match(heroCopy, /<InviteGridHalo \/>/);
  assert.match(heroCopy, /className="invite-cta"/);
  assert.match(heroCopy, /Melonite fixes the B4D behavioral patterns/);
  assert.match(banner, /Closed beta, taking invite requests!/);
  assert.match(banner, /Dismiss closed beta announcement/);
  assert.match(brandMark, /logo-shape\.svg/);
  assert.match(brandMark, /logo-m\.svg/);
  assert.match(parallax, /pointermove/);
  assert.match(parallax, /requestAnimationFrame/);
  assert.match(parallax, /prefers-reduced-motion/);
  assert.match(product, /sparse-strip-top-purple\.png/);
  assert.match(product, /sparse-strip-bottom-purple\.png/);
  assert.match(product, /product-preview-raw-1\.png/);
  assert.match(product, /<Footer \/>/);
  assert.match(product, /<\/div>\s*<Footer \/>/);
  assert.match(nav, /<DiscordIcon className="discord-icon-nav"/);
  assert.match(footer, /<DiscordIcon className="discord-icon-footer"/);
  assert.match(discordIcon, /discord\.png/);
  assert.match(styles, /position:\s*fixed;/);
  assert.match(styles, /\.floating-nav\s*\{[\s\S]*?top:\s*25px;[\s\S]*?left:\s*50%;/);
  assert.match(styles, /\.floating-nav\s*\{[\s\S]*?background:\s*#515151;/);
  assert.match(styles, /\.floating-nav\s*\{[\s\S]*?border-radius:\s*5px;/);
  assert.doesNotMatch(
    styles,
    /\.floating-nav a\s*\{[^}]*text-transform:\s*uppercase/,
  );
  assert.match(styles, /\.discord-icon-nav\s*\{[\s\S]*?filter:\s*invert\(1\);/);
  assert.match(styles, /\.brand-mark\s*\{[\s\S]*?top:\s*var\(--nav-center-y\);[\s\S]*?translateY\(-50%\)/);
  assert.match(styles, /\.brand-mark\s*\{[\s\S]*?left:\s*6\.3306%;/);
  assert.match(
    styles,
    /\.hero-grid-art\s*\{[\s\S]*?top:\s*min\(27\.91px,\s*2\.2472vw\);[\s\S]*?left:\s*5%;[\s\S]*?width:\s*90%;/,
  );
  assert.match(styles, /scale3d\(1\.15,\s*1\.035,\s*1\)/);
  assert.match(styles, /\.closed-beta-banner\s*\{/);
  assert.match(styles, /\.hero-copy\s*\{[\s\S]*?left:\s*50%;[\s\S]*?text-align:\s*center;/);
  assert.match(styles, /--hero-paper:\s*#f0ede5/);
  assert.match(styles, /--section-paper:\s*#afa8e3/);
  assert.match(styles, /\.pixel-strip-a\s*\{/);
  assert.match(styles, /\.pixel-strip-b\s*\{/);
  assert.match(styles, /\.grid-halo-hero-text\s*\{/);
  assert.match(styles, /\.grid-halo-invite\s*\{/);
  assert.match(styles, /\.invite-cta\s*\{[\s\S]*?margin:[\s\S]*?auto/);
  assert.match(styles, /\.product-preview-image\s*\{[\s\S]*?left:\s*50%;[\s\S]*?translateX\(-50%\)/);
  assert.match(styles, /\.install-command-frame\s*\{[\s\S]*?background:\s*#494949;[\s\S]*?border-radius:\s*4px;/);
  assert.match(installCommand, /curl -fsSL https:\/\/github\.com\/meloniteai\/melonite-desktop\/releases\/latest\/download\/install\.sh \| sh/);
  assert.match(styles, /--hero-parallax-x/);
  assert.match(styles, /calc\(var\(--hero-parallax-x\) \* -14px\)/);
  assert.match(styles, /calc\(var\(--hero-parallax-x\) \* 3px\)/);
  assert.match(styles, /\.site-footer\s*\{[\s\S]*?right:\s*clamp\([\s\S]*?bottom:\s*clamp\(/);
});

test("keeps Figma assets local and durable", async () => {
  const [preview, regularStrip, rotatedStrip, pixelGridBase, logoShape, logoLetter, discord] = await Promise.all([
    readFile(new URL("../public/figma/updated/product-preview-raw-1.png", import.meta.url)),
    readFile(new URL("../public/figma/updated/sparse-strip-top-purple.png", import.meta.url)),
    readFile(new URL("../public/figma/updated/sparse-strip-bottom-purple.png", import.meta.url)),
    readFile(new URL("../public/figma/updated/pixel-grid-base-clean.png", import.meta.url)),
    readFile(new URL("../public/figma/updated/logo-shape.svg", import.meta.url)),
    readFile(new URL("../public/figma/updated/logo-m.svg", import.meta.url)),
    readFile(new URL("../public/figma/updated/discord.png", import.meta.url)),
  ]);

  assert.ok(preview.byteLength > 100_000);
  assert.ok(regularStrip.byteLength > 1_000_000);
  assert.ok(rotatedStrip.byteLength > 500_000);
  assert.ok(pixelGridBase.byteLength > 8_000);
  assert.equal(pixelGridBase.subarray(1, 4).toString("ascii"), "PNG");
  assert.ok(logoShape.byteLength > 10_000);
  assert.ok(logoLetter.byteLength > 10_000);
  assert.ok(discord.byteLength > 10_000);
});
