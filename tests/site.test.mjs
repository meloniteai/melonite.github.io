import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("builds the updated standalone Melonite website", async () => {
  const [html, source, heroSection, heroCopy, banner, brandMark, parallax, fogTransition, product, installSection, installCommand, nav, footer, netPositive, discordIcon, spaceGrid, gridDefaults, styles] = await Promise.all([
    readFile(new URL("../dist/index.html", import.meta.url), "utf8"),
    readFile(new URL("../src/App.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/HeroSection.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/HeroCopy.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/ClosedBetaBanner.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/BrandMark.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/useHeroParallax.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/components/FogTransition.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/ProductShowcase.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/InstallSection.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/InstallCommand.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/FloatingNav.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/Footer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/NetPositiveSection.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/DiscordIcon.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/SpaceGridCanvas.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/spaceGridDefaults.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(html, /<title>Melonite \| Private Beta<\/title>/i);
  assert.match(html, /<link rel="icon" type="image\/png" href="\/favicon\.png" \/>/);
  assert.match(source, /<FloatingNav \/>/);
  assert.match(source, /<HeroSection \/>/);
  assert.match(source, /<FogTransition \/>/);
  assert.match(source, /<ProductShowcase \/>/);
  assert.match(source, /<NetPositiveSection \/>/);
  assert.match(source, /<Footer \/>/);
  assert.doesNotMatch(heroSection, /HeroMorph/);
  assert.doesNotMatch(heroSection, /hero-animation\.(mp4|webm)/);
  assert.match(heroSection, /useHeroParallax\(sectionRef\)/);
  assert.match(heroSection, /<SpaceGridCanvas/);
  assert.match(heroSection, /\{\.\.\.HERO_SPACE_GRID_SETTINGS\}/);
  assert.match(heroSection, /hero-grid-overlay\.png/);
  assert.doesNotMatch(heroSection, /pixel-grid-base-clean\.png/);
  assert.doesNotMatch(styles, /\.hero-transition-art\s*\{/);
  assert.match(
    styles,
    /\.hero-section::after\s*\{[\s\S]*?background:\s*var\(--hero-paper\)/,
  );
  assert.match(heroSection, /<HeroTextGridHalo \/>/);
  assert.match(heroSection, /<ClosedBetaBanner \/>/);
  assert.doesNotMatch(heroSection, /<InviteGridHalo \/>/);
  assert.match(heroCopy, /<InviteGridHalo \/>/);
  assert.match(heroCopy, /className="invite-cta"/);
  assert.match(heroCopy, /hero-emphasis-bad/);
  assert.match(heroCopy, /hero-emphasis-build/);
  assert.match(heroCopy, />bad</);
  assert.match(heroCopy, />build</);
  assert.match(banner, /Closed beta, taking invite requests!/);
  assert.match(banner, /Dismiss closed beta announcement/);
  assert.match(brandMark, /footer-logo\.svg/);
  assert.doesNotMatch(brandMark, /logo-(shape|m)\.svg/);
  assert.match(parallax, /pointermove/);
  assert.match(parallax, /requestAnimationFrame/);
  assert.match(parallax, /prefers-reduced-motion/);
  assert.match(fogTransition, /ShaderMaterial/);
  assert.match(fogTransition, /fragmentShader/);
  assert.match(fogTransition, /uTime\s*\*\s*0\.18/);
  assert.match(fogTransition, /uv\s*\*\s*vec2\(2\.55,\s*1\.42\)/);
  assert.match(fogTransition, /requestAnimationFrame/);
  assert.match(fogTransition, /prefers-reduced-motion/);
  assert.match(fogTransition, /IntersectionObserver/);
  assert.match(fogTransition, /webglcontextlost/);
  assert.match(product, /pixel-strip\.png/);
  assert.match(product, /product-preview\.png/);
  assert.match(product, /Prompt Weave/);
  assert.match(product, /Melonite Agent/);
  assert.match(product, /Watchers/);
  assert.match(product, /feature-slider/);
  assert.match(product, /role="progressbar"/);
  assert.doesNotMatch(product, /feature-toc/);
  assert.doesNotMatch(product, /toc-background/);
  assert.match(product, /id="install"/);
  assert.match(product, /<InstallSection \/>/);
  assert.match(installSection, /Download for MacOS, Windows or Linux/);
  assert.match(installSection, /USE YOUR EXISTING SUBSCRIPTIONS/);
  assert.match(installSection, /OPEN SOURCE \(MIT\)/);
  assert.match(heroCopy, /href="https:\/\/app\.melonite\.ai\/login"/);
  assert.match(banner, /href="https:\/\/app\.melonite\.ai\/login"/);
  assert.match(nav, /href:\s*"https:\/\/app\.melonite\.ai\/login"/);
  assert.match(nav, /href:\s*"https:\/\/discord\.gg\/88PSuaRNk"/);
  assert.match(footer, /href:\s*"https:\/\/discord\.gg\/88PSuaRNk"/);
  assert.match(nav, /target=\{item\.icon \? "_blank" : undefined\}/);
  assert.match(nav, /rel=\{item\.icon \? "noopener noreferrer" : undefined\}/);
  assert.match(footer, /target=\{link\.external \? "_blank" : undefined\}/);
  assert.match(footer, /rel=\{link\.external \? "noopener noreferrer" : undefined\}/);
  assert.match(footer, /href:\s*"https:\/\/x\.com\/meloniteai"/);
  assert.match(nav, /<DiscordIcon className="discord-icon-nav"/);
  assert.match(footer, /footer-logo\.svg/);
  assert.match(netPositive, /Turn net-negative into net-positive/);
  assert.match(netPositive, /durable ACP and Session Lifecycle OSS work/);
  assert.match(netPositive, /github\.svg/);
  assert.match(netPositive, /discord\.svg/);
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
  assert.match(
    styles,
    /\.hero-space-grid\[data-webgl-unavailable="true"\][\s\S]*?~\s*\.hero-canvas[\s\S]*?\.hero-grid-art\s*\{[\s\S]*?display:\s*block/,
  );
  assert.match(spaceGrid, /webglcontextlost/);
  assert.match(spaceGrid, /webglcontextrestored/);
  assert.match(spaceGrid, /dataset\.webglUnavailable = "true"/);
  assert.match(gridDefaults, /speed:\s*0\.68/);
  assert.match(gridDefaults, /gravityRadius:\s*0\.1/);
  assert.match(gridDefaults, /gridGlow:\s*0\.5/);
  assert.match(gridDefaults, /gridIntensity:\s*0\.28/);
  assert.match(gridDefaults, /gridScale:\s*1\.46/);
  assert.match(gridDefaults, /lineThickness:\s*0\.92/);
  assert.match(gridDefaults, /starDensity:\s*0\.37/);
  assert.match(gridDefaults, /starIntensity:\s*0\.42/);
  assert.match(gridDefaults, /starSmear:\s*0\.79/);
  assert.match(styles, /\.closed-beta-banner\s*\{/);
  assert.match(styles, /\.hero-copy\s*\{[\s\S]*?left:\s*50%;[\s\S]*?text-align:\s*center;/);
  assert.match(styles, /--hero-paper:\s*#f0ede5/);
  assert.match(styles, /--section-paper:\s*#afa8e3/);
  assert.match(styles, /\.mid-pixel-strip\s*\{/);
  assert.match(styles, /\.fog-transition\s*\{/);
  assert.match(styles, /\.fog-transition-canvas\s*\{/);
  assert.match(styles, /\.grid-halo-hero-text\s*\{/);
  assert.match(styles, /\.grid-halo-invite\s*\{/);
  assert.match(styles, /42dot-sans-latin\.woff2/);
  assert.match(styles, /\.hero-emphasis-bad\s*\{[\s\S]*?#ff3700/);
  assert.match(styles, /\.hero-emphasis-build\s*\{[\s\S]*?#7fffd0/);
  assert.match(styles, /\.hero-emphasis::before\s*\{[\s\S]*?background:\s*#323232/);
  assert.doesNotMatch(styles, /secondary-bg\.png/);
  assert.match(
    styles,
    /\.product-stage\s*\{[\s\S]*?rgba\(227,\s*168,\s*207,\s*0\)\s*4\.8022%[\s\S]*?rgb\(175,\s*168,\s*227\)\s*50\.57%[\s\S]*?rgb\(175,\s*168,\s*227\)\s*52\.401%[\s\S]*?rgb\(254,\s*224,\s*229\)\s*100%/,
  );
  assert.match(
    styles,
    /\.product-stage\s*>\s*\.install-canvas,[\s\S]*?\.product-stage\s*>\s*\.product-canvas\s*\{[\s\S]*?transform:\s*translateY\(40px\)/,
  );
  assert.match(styles, /\.product-canvas\s*\{[\s\S]*?width:\s*min\(1326px,/);
  assert.match(
    styles,
    /\.product-canvas::before\s*\{[\s\S]*?clip-path:\s*polygon\(0 6%,\s*100% 0,\s*100% 94%,\s*0 100%\)/,
  );
  assert.doesNotMatch(
    styles,
    /\.mid-pixel-strip\s*\{[^}]*position:\s*absolute/,
  );
  assert.match(styles, /\.mid-pixel-strip\s*\{[^}]*transform:\s*none/);
  assert.match(styles, /\.feature-slider\s*\{[\s\S]*?height:\s*125px/);
  assert.match(styles, /\.feature-slider-fill\s*\{[\s\S]*?height:\s*var\(--feature-slider-height\)/);
  assert.doesNotMatch(styles, /\.feature-toc\s*\{/);
  assert.match(styles, /\.net-positive-section\s*\{/);
  assert.match(styles, /\.community-links\s*\{[\s\S]*?width:\s*min\(435px,\s*100%\)[\s\S]*?gap:\s*14px/);
  assert.match(styles, /\.community-links a\s*\{[\s\S]*?height:\s*44px[\s\S]*?font-size:\s*15px/);
  assert.match(styles, /\.site-footer\s*\{[\s\S]*?background:\s*#1f1e1e/);
  assert.match(styles, /@media \(max-width:\s*800px\)\s*\{[\s\S]*?\.product-showcase\s*\{[\s\S]*?height:\s*320svh;[\s\S]*?overflow:\s*clip/);
  assert.match(styles, /@media \(max-width:\s*800px\)\s*\{[\s\S]*?\.product-canvas\s*\{[\s\S]*?grid-template-columns:\s*4px minmax\(0,\s*1fr\)/);
  assert.match(styles, /@media \(max-width:\s*800px\)\s*\{[\s\S]*?\.product-preview-image\s*\{[\s\S]*?grid-column:\s*1\s*\/\s*3/);
  assert.match(styles, /\.invite-cta\s*\{[\s\S]*?margin:[\s\S]*?auto/);
  assert.match(styles, /\.install-command-frame\s*\{[\s\S]*?background:\s*#494949;[\s\S]*?border-radius:\s*4px;/);
  assert.match(installCommand, /curl -fsSL https:\/\/github\.com\/meloniteai\/melonite-desktop\/releases\/latest\/download\/install\.sh \| sh/);
  assert.match(styles, /--hero-parallax-x/);
  assert.match(styles, /--feature-slider-height/);
  assert.match(styles, /calc\(var\(--hero-parallax-x\) \* -14px\)/);
  assert.match(styles, /calc\(var\(--hero-parallax-x\) \* 3px\)/);
});

test("keeps Figma assets local and durable", async () => {
  const [preview, pixelStrip, github, socialDiscord, footerLogo, pixelGridBase, logoShape, logoLetter, discord, favicon, font42dot] = await Promise.all([
    readFile(new URL("../public/figma/updated/product-preview-raw-1.png", import.meta.url)),
    readFile(new URL("../public/figma/lp-new/pixel-strip.png", import.meta.url)),
    readFile(new URL("../public/figma/lp-new/github.svg", import.meta.url)),
    readFile(new URL("../public/figma/lp-new/discord.svg", import.meta.url)),
    readFile(new URL("../public/figma/lp-new/footer-logo.svg", import.meta.url)),
    readFile(new URL("../public/figma/updated/pixel-grid-base-clean.png", import.meta.url)),
    readFile(new URL("../public/figma/updated/logo-shape.svg", import.meta.url)),
    readFile(new URL("../public/figma/updated/logo-m.svg", import.meta.url)),
    readFile(new URL("../public/figma/updated/discord.png", import.meta.url)),
    readFile(new URL("../public/favicon.png", import.meta.url)),
    readFile(new URL("../src/fonts/42dot-sans-latin.woff2", import.meta.url)),
  ]);

  assert.ok(preview.byteLength > 100_000);
  assert.ok(pixelStrip.byteLength > 100_000);
  assert.ok(github.byteLength > 1_000);
  assert.ok(socialDiscord.byteLength > 1_000);
  assert.ok(footerLogo.byteLength > 2_000);
  assert.equal(pixelStrip.subarray(1, 4).toString("ascii"), "PNG");
  assert.match(github.toString("utf8", 0, 64), /<svg/);
  assert.match(socialDiscord.toString("utf8", 0, 64), /<svg/);
  assert.match(footerLogo.toString("utf8", 0, 64), /<svg/);
  assert.ok(pixelGridBase.byteLength > 8_000);
  assert.equal(pixelGridBase.subarray(1, 4).toString("ascii"), "PNG");
  assert.ok(logoShape.byteLength > 10_000);
  assert.ok(logoLetter.byteLength > 10_000);
  assert.ok(discord.byteLength > 10_000);
  assert.ok(favicon.byteLength > 2_000);
  assert.equal(favicon.subarray(1, 4).toString("ascii"), "PNG");
  assert.ok(font42dot.byteLength > 20_000);
});
