import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("builds the lp-new-all-light page while retaining the production mesh", async () => {
  const [
    html,
    app,
    heroSection,
    heroCopy,
    banner,
    brandMark,
    parallax,
    fogTransition,
    product,
    installSection,
    installCommand,
    nav,
    footer,
    netPositive,
    spaceGrid,
    gridDefaults,
    styles,
  ] = await Promise.all([
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
    readFile(new URL("../src/components/SpaceGridCanvas.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/spaceGridDefaults.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/styles.css", import.meta.url), "utf8"),
  ]);

  assert.match(html, /<title>Melonite \| Private Beta<\/title>/i);
  assert.match(html, /href="\/favicon\.png"/);

  assert.match(app, /<FloatingNav \/>/);
  assert.match(app, /<HeroSection \/>/);
  assert.match(app, /<ProductShowcase \/>/);
  assert.match(app, /<NetPositiveSection \/>/);
  assert.match(app, /<Footer \/>/);
  assert.doesNotMatch(app, /DownloadSection/);
  assert.doesNotMatch(app, /FogTransition/);

  assert.match(heroSection, /<SpaceGridCanvas/);
  assert.match(heroSection, /key="hero-blue-star-composite"/);
  assert.match(heroSection, /shaderRevision=\{15\}/);
  assert.match(heroSection, /holeMotionTargetRef=\{sectionRef\}/);
  assert.match(heroSection, /\{\.\.\.HERO_SPACE_GRID_SETTINGS\}/);
  assert.match(heroSection, /hero-grid-overlay\.png/);
  assert.match(heroSection, /<ClosedBetaBanner \/>/);
  assert.match(heroSection, /<FogTransition \/>/);
  assert.doesNotMatch(heroSection, /HeroTextGridHalo|HeroMorph|hero-animation/);
  assert.match(
    heroCopy,
    /A tool for the new CTO Superbuilder\. Move extremely fast without[\s\S]*compromising quality/,
  );
  assert.match(heroCopy, /hero-emphasis-bad/);
  assert.match(heroCopy, /hero-emphasis-build/);
  assert.match(heroCopy, /Request Invite/);
  assert.match(banner, /Closed beta, taking invite requests!/);
  assert.match(brandMark, /lp-new-light\/header-logo\.svg/);
  assert.match(parallax, /pointermove/);
  assert.match(parallax, /requestAnimationFrame/);
  assert.match(parallax, /prefers-reduced-motion/);

  assert.match(product, /lp-new-light\/pixel-field\.png/);
  assert.doesNotMatch(product, /lp-new-light\/showcase-slab\.svg/);
  assert.match(product, /lp-new-light\/product-preview\.png/);
  assert.match(product, /feature-slider/);
  assert.match(product, /role="progressbar"/);
  assert.match(product, /Prompt Weave/);
  assert.match(product, /Melonite Agent/);
  assert.match(product, /Watchers/);
  assert.match(product, /id="install"/);
  assert.match(product, /<InstallSection \/>/);
  assert.doesNotMatch(product, /pixel-strip|mid-pixel-strip|feature-toc/);
  assert.match(installSection, /Download for MacOS, Windows or Linux/);
  assert.match(installSection, /className="install-os-icons"/);
  assert.match(installSection, /lp-new-light\/windows\.svg/);
  assert.match(installSection, /lp-new-light\/apple\.svg/);
  assert.match(installSection, /lp-new-light\/ubuntu\.svg/);
  assert.match(installSection, /USE YOUR EXISTING SUBSCRIPTIONS/);
  assert.match(installSection, /OPEN SOURCE \(MIT\)/);
  assert.match(
    installCommand,
    /curl -fsSL https:\/\/github\.com\/meloniteai\/melonite-desktop\/releases\/latest\/download\/install\.sh \| sh/,
  );
  assert.match(
    styles,
    /\.install-command-frame code\s*\{[\s\S]*?overflow:\s*hidden;[\s\S]*?font-weight:\s*400;/,
  );
  assert.doesNotMatch(
    styles,
    /\.install-command-frame code\s*\{[\s\S]*?overflow-x:\s*auto/,
  );

  assert.match(netPositive, /Turn net-negative into net-positive/);
  assert.match(netPositive, /Move fast with Coding Agents/);
  assert.match(netPositive, /Durable ACP and Session Lifecycle SDKs/);
  assert.match(netPositive, /lp-new-light\/github\.svg/);
  assert.match(netPositive, /lp-new-light\/discord\.svg/);
  assert.match(nav, /label:\s*"Join"/);
  assert.match(nav, /label:\s*"Melonite"/);
  assert.match(nav, /label:\s*"Discord"/);
  assert.match(nav, /label:\s*"GitHub"/);
  assert.match(nav, /MORPH_DISTANCE\s*=\s*112/);
  assert.match(nav, /dataset\.navState\s*=/);
  assert.match(nav, /window\.addEventListener\("scroll"/);
  assert.match(nav, /--nav-shell-x/);
  assert.match(nav, /<DiscordIcon className="nav-social-icon" \/>/);
  assert.match(nav, /<GitHubIcon className="nav-social-icon" \/>/);
  assert.match(nav, /target=\{item\.external \? "_blank" : undefined\}/);
  assert.match(footer, /lp-new-light\/footer-logo\.svg/);
  assert.match(footer, /<span>Melonite<\/span>/);
  assert.match(footer, /href:\s*"https:\/\/x\.com\/meloniteai"/);
  assert.match(footer, /href:\s*"https:\/\/github\.com\/meloniteai"/);
  assert.match(footer, /<DiscordIcon className="footer-link-icon" \/>/);
  assert.match(footer, /<GitHubIcon className="footer-link-icon" \/>/);
  assert.match(styles, /mask-image:\s*url\("\/figma\/lp-new-light\/discord\.svg"\)/);
  assert.match(styles, /mask-image:\s*url\("\/figma\/lp-new-light\/github\.svg"\)/);

  assert.match(spaceGrid, /webglcontextlost/);
  assert.match(spaceGrid, /webglcontextrestored/);
  assert.match(spaceGrid, /dataset\.webglUnavailable = "true"/);
  assert.match(spaceGrid, /pow\(max\(stars\.a,\s*0\.0\),\s*0\.65\)/);
  assert.match(spaceGrid, /vec3 starContrastColor = mix/);
  assert.match(spaceGrid, /vec3\(0\.18,\s*0\.55,\s*0\.76\)/);
  assert.match(spaceGrid, /roundedBoxDistance/);
  assert.match(spaceGrid, /bool hitsSideWall = xRatio > yRatio/);
  assert.match(
    spaceGrid,
    /vec2 tunnelHalfSize = vec2\([\s\S]*?min\(aspect \* 0\.4425,\s*0\.5175\),[\s\S]*?0\.315/,
  );
  assert.match(spaceGrid, /float wallSeam = 1\.0 - smoothstep/);
  assert.match(spaceGrid, /float oneSidedGridTrail/);
  assert.match(spaceGrid, /const publishHoleMotion = \(\) =>/);
  assert.match(spaceGrid, /--hero-hole-x/);
  assert.match(spaceGrid, /--hero-hole-y/);
  assert.match(spaceGrid, /CONTENT_GRAVITY_FOLLOW = 0\.015/);
  assert.match(spaceGrid, /--hero-content-gravity-x/);
  assert.match(
    spaceGrid,
    /float outwardProgress = 1\.0 - smoothstep\(0\.18,\s*1\.02,\s*depth\)/,
  );
  assert.match(spaceGrid, /mix\(0\.035,\s*0\.92,\s*smearStrength\)/);
  assert.match(spaceGrid, /float terminalSmear = pow/);
  assert.match(spaceGrid, /terminalSmear \* 0\.55/);
  assert.match(spaceGrid, /terminalSmear \* 5\.0/);
  assert.match(spaceGrid, /float outwardIntensity = mix/);
  assert.match(spaceGrid, /uniform float uGridDensity/);
  assert.match(spaceGrid, /float gridDensity = clamp\(uGridDensity/);
  assert.match(spaceGrid, /\* 10\.0 \* gridDensity/);
  assert.match(spaceGrid, /depthTrail \* 0\.78/);
  assert.match(spaceGrid, /pow\(outwardIntensity,\s*0\.72\)/);
  assert.match(
    spaceGrid,
    /roundedBoxDistance\([\s\S]*?tunnelHalfSize,[\s\S]*?0\.05/,
  );
  assert.doesNotMatch(spaceGrid, /tunnelRadii|wallAngle|clearanceRadii/);
  assert.doesNotMatch(spaceGrid, /backgroundLuminance/);
  assert.match(gridDefaults, /speed:\s*0\.544/);
  assert.match(gridDefaults, /centerFollow:\s*0\.08/);
  assert.match(gridDefaults, /gridGlow:\s*0\.62/);
  assert.match(gridDefaults, /gridDensity:\s*1\.25/);
  assert.match(gridDefaults, /gridIntensity:\s*0\.28/);
  assert.match(gridDefaults, /gridScale:\s*1\.46/);
  assert.match(gridDefaults, /lineThickness:\s*0\.6/);
  assert.match(gridDefaults, /starDensity:\s*0\.507/);
  assert.match(gridDefaults, /starIntensity:\s*1\.12/);
  assert.match(gridDefaults, /starRadius:\s*0\.7/);
  assert.match(gridDefaults, /starSmear:\s*0\.553/);
  assert.match(gridDefaults, /starCoolColor:\s*"#e2f3fa"/i);
  assert.match(gridDefaults, /starWarmColor:\s*"#e2f3fa"/i);

  // The fog shader is integrated into the hero as an organic atmospheric layer.
  assert.match(fogTransition, /ShaderMaterial/);
  assert.match(fogTransition, /fragmentShader/);
  assert.match(fogTransition, /transparent:\s*true/);
  assert.match(fogTransition, /alpha:\s*true/);
  assert.match(fogTransition, /renderer\.setClearColor\(0x000000,\s*0\)/);
  assert.match(fogTransition, /vec3 sky = vec3\(0\.886,\s*0\.953,\s*0\.980\)/);
  assert.match(fogTransition, /requestAnimationFrame/);
  assert.match(fogTransition, /prefers-reduced-motion/);
  assert.match(fogTransition, /IntersectionObserver/);

  assert.match(styles, /--offwhite:\s*#f0ede5/);
  assert.match(styles, /--purple:\s*#6b59c7/i);
  assert.match(styles, /\.hero-section\s*\{[\s\S]*?height:\s*743\.594px/);
  assert.match(
    styles,
    /\.hero-section::after\s*\{[\s\S]*?rgba\(240,\s*237,\s*229,\s*0\.34\)\s*0%/,
  );
  assert.match(styles, /\.product-showcase\s*\{[\s\S]*?height:\s*360svh/);
  assert.match(
    styles,
    /\.product-stage\s*\{[\s\S]*?linear-gradient\([\s\S]*?var\(--offwhite\)[\s\S]*?var\(--pink\)[\s\S]*?var\(--offwhite\)/,
  );
  assert.match(
    styles,
    /\.product-stage\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*0;[\s\S]*?height:\s*100svh;[\s\S]*?overflow:\s*clip visible/,
  );
  assert.match(
    styles,
    /\.product-stage\s*\{[\s\S]*?gap:\s*36px;[\s\S]*?padding:\s*64px 36px;/,
  );
  assert.match(styles, /\.mid-pixel-field\s*\{[\s\S]*?height:\s*819px/);
  assert.match(
    styles,
    /\.install-os-icons\s*\{[\s\S]*?gap:\s*12px;[\s\S]*?margin-bottom:\s*36px/,
  );
  assert.match(
    styles,
    /\.install-os-icons img\s*\{[\s\S]*?width:\s*24px;[\s\S]*?height:\s*24px/,
  );
  assert.match(
    styles,
    /\.product-canvas\s*\{[\s\S]*?width:\s*min\([\s\S]*?1225px,[\s\S]*?max\(760px,\s*63\.8021vw\),[\s\S]*?max\(760px,\s*calc\(205\.1926svh - 888\.48px\)\),[\s\S]*?calc\(100% - 48px\)[\s\S]*?\);[\s\S]*?aspect-ratio:\s*1225\s*\/\s*597/,
  );
  assert.doesNotMatch(styles, /\.showcase-slab\s*\{/);
  assert.match(
    styles,
    /\.feature-copy\s*\{[\s\S]*?height:\s*330px;[\s\S]*?color:\s*var\(--charcoal\)/,
  );
  assert.match(
    styles,
    /\.feature-copy h2\s*\{[\s\S]*?color:\s*var\(--charcoal\);[\s\S]*?font-family:\s*var\(--font-jost\);[\s\S]*?font-weight:\s*500/,
  );
  assert.match(
    styles,
    /\.feature-copy-panel\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-direction:\s*column;[\s\S]*?row-gap:\s*20px;[\s\S]*?opacity:\s*0;[\s\S]*?transition:[\s\S]*?opacity 220ms ease-out/,
  );
  assert.match(
    styles,
    /\.feature-copy-panel\.is-active\s*\{[\s\S]*?opacity:\s*1;[\s\S]*?visibility:\s*visible/,
  );
  assert.match(
    styles,
    /\.product-preview-image\s*\{[\s\S]*?width:\s*100%;[\s\S]*?height:\s*auto;[\s\S]*?object-fit:\s*contain/,
  );
  assert.match(
    styles,
    /\.feature-slider\s*\{[\s\S]*?grid-column:\s*1;[\s\S]*?align-self:\s*center;[\s\S]*?height:\s*125px;[\s\S]*?transform:\s*translateY\(-102\.5px\)/,
  );
  assert.match(
    styles,
    /\.product-canvas\s*\{[\s\S]*?grid-template-columns:\s*4px 28px calc\(35\.5102% - 32px\) 1\.3061% 63\.1837%/,
  );
  assert.match(
    styles,
    /\.feature-copy-stack\s*\{[\s\S]*?width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?overflow:\s*hidden/,
  );
  assert.match(styles, /\.net-positive-section\s*\{[\s\S]*?height:\s*405px/);
  assert.match(
    styles,
    /\.community-links\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*245px\)/,
  );
  assert.match(
    styles,
    /\.community-links a\s*\{[\s\S]*?width:\s*245px;[\s\S]*?height:\s*50px/,
  );
  assert.doesNotMatch(styles, /\.download-section\s*\{/);
  assert.doesNotMatch(styles, /\.download-content\s*\{/);
  assert.match(styles, /\.site-footer\s*\{[\s\S]*?height:\s*231px/);
  assert.match(
    styles,
    /\.site-footer\s*\{[\s\S]*?background:\s*var\(--footer-charcoal\)/,
  );
  assert.match(styles, /@media \(max-width:\s*800px\)/);
  assert.match(
    styles,
    /@media \(max-width:\s*800px\)\s*\{[\s\S]*?\.product-showcase\s*\{[\s\S]*?height:\s*320svh/,
  );
  assert.match(styles, /\.fog-transition\s*\{/);
  assert.match(styles, /\.fog-transition-canvas\s*\{/);
  assert.match(
    styles,
    /\.fog-transition\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?top:\s*-92px;[\s\S]*?right:\s*-12%;/,
  );
  assert.match(styles, /jost-latin\.woff2/);
  assert.doesNotMatch(styles, /42dot-sans-latin\.woff2/);
  assert.doesNotMatch(styles, /Asta Sans|42dot Sans|SFMono-Regular/);
  assert.match(styles, /--hero-parallax-x/);
  assert.match(styles, /--hero-hole-x:\s*0px/);
  assert.match(styles, /var\(--hero-hole-x\)/);
  assert.match(styles, /--hero-content-gravity-x:\s*0px/);
  assert.match(styles, /--feature-fill-scale/);
  assert.match(
    styles,
    /\.feature-slider-fill\s*\{[\s\S]*?height:\s*100%;[\s\S]*?transform:\s*scaleY\(var\(--feature-fill-scale\)\)/,
  );
});

test("keeps the exact lp-new-all-light exports local and durable", async () => {
  const [
    preview,
    pixelField,
    slab,
    headerLogo,
    footerLogo,
    github,
    discord,
    windows,
    apple,
    ubuntu,
    favicon,
    font,
  ] = await Promise.all([
    readFile(new URL("../public/figma/lp-new-light/product-preview.png", import.meta.url)),
    readFile(new URL("../public/figma/lp-new-light/pixel-field.png", import.meta.url)),
    readFile(new URL("../public/figma/lp-new-light/showcase-slab.svg", import.meta.url)),
    readFile(new URL("../public/figma/lp-new-light/header-logo.svg", import.meta.url)),
    readFile(new URL("../public/figma/lp-new-light/footer-logo.svg", import.meta.url)),
    readFile(new URL("../public/figma/lp-new-light/github.svg", import.meta.url)),
    readFile(new URL("../public/figma/lp-new-light/discord.svg", import.meta.url)),
    readFile(new URL("../public/figma/lp-new-light/windows.svg", import.meta.url)),
    readFile(new URL("../public/figma/lp-new-light/apple.svg", import.meta.url)),
    readFile(new URL("../public/figma/lp-new-light/ubuntu.svg", import.meta.url)),
    readFile(new URL("../public/favicon.png", import.meta.url)),
    readFile(new URL("../src/fonts/jost-latin.woff2", import.meta.url)),
  ]);

  assert.ok(preview.byteLength > 500_000);
  assert.ok(pixelField.byteLength > 1_000_000);
  assert.equal(preview.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(pixelField.subarray(1, 4).toString("ascii"), "PNG");

  for (const asset of [
    slab,
    headerLogo,
    footerLogo,
    github,
    discord,
    windows,
    apple,
    ubuntu,
  ]) {
    assert.match(asset.toString("utf8", 0, 256), /<svg/);
  }

  assert.ok(headerLogo.byteLength > 2_000);
  assert.ok(footerLogo.byteLength > 2_000);
  assert.ok(github.byteLength > 1_000);
  assert.ok(discord.byteLength > 1_000);
  assert.ok(favicon.byteLength > 2_000);
  assert.ok(font.byteLength > 20_000);
});
