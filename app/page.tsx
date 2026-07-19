"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 30;
const FINAL_FRAME_RADIUS = 12;
const INSTALL_COMMAND =
  "curl -fsSL https://github.com/meloniteai/melonite-desktop/releases/latest/download/install.sh | sh";
const frameSource = (index: number) =>
  `/frames-poppy/hero-${String(index).padStart(3, "0")}.webp`;

export default function Home() {
  const stageRef = useRef<HTMLElement>(null);
  const frameBoxRef = useRef<HTMLDivElement>(null);
  const heroMessageRef = useRef<HTMLDivElement>(null);
  const navInnerRef = useRef<HTMLDivElement>(null);
  const navPrimaryRef = useRef<HTMLDivElement>(null);
  const navDiscordRef = useRef<HTMLAnchorElement>(null);
  const navPanelRef = useRef<HTMLSpanElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [frame, setFrame] = useState(FRAME_COUNT - 1);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    for (let index = 0; index < FRAME_COUNT; index += 1) {
      const image = new Image();
      image.src = frameSource(index);
    }

    const updateFrame = () => {
      animationFrameRef.current = null;
      const stage = stageRef.current;
      if (!stage) return;

      const rect = stage.getBoundingClientRect();
      const scrollableDistance = stage.offsetHeight - window.innerHeight;
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const scrollProgress = Math.min(
        1,
        Math.max(0, -rect.top / Math.max(scrollableDistance, 1)),
      );
      const progress = prefersReducedMotion ? 1 : scrollProgress;
      const nextFrame =
        FRAME_COUNT - 1 - Math.round(progress * (FRAME_COUNT - 1));
      setFrame((current) => (current === nextFrame ? current : nextFrame));

      const closingProgress = Math.min(
        1,
        Math.max(0, (progress - 0.06) / 0.86),
      );
      const easedClosingProgress = 1 - Math.pow(1 - closingProgress, 4);
      const targetWidth = Math.min(window.innerWidth - 32, 980);
      const targetHeight = Math.min(window.innerHeight * 0.82, 780);
      const frameWidth =
        window.innerWidth -
        (window.innerWidth - targetWidth) * easedClosingProgress;
      const frameHeight =
        window.innerHeight -
        (window.innerHeight - targetHeight) * easedClosingProgress;

      if (frameBoxRef.current) {
        frameBoxRef.current.style.width = `${frameWidth}px`;
        frameBoxRef.current.style.height = `${frameHeight}px`;
        frameBoxRef.current.style.borderRadius = `${FINAL_FRAME_RADIUS * easedClosingProgress}px`;
      }

      const isAtRevealSize = closingProgress >= 0.35;
      const postRevealProgress = Math.min(
        1,
        Math.max(0, (closingProgress - 0.35) / 0.65),
      );
      const heroMessageDrift =
        Math.min(64, window.innerHeight * 0.075) * postRevealProgress;

      if (heroMessageRef.current) {
        heroMessageRef.current.style.opacity = isAtRevealSize ? "1" : "0";
        heroMessageRef.current.style.transform = isAtRevealSize
          ? `translateY(${heroMessageDrift}px)`
          : "translateY(8px)";
      }

      const navProgress = Math.min(1, scrollProgress / 0.55);
      const easedNavProgress = 1 - Math.pow(1 - navProgress, 4);
      const navInner = navInnerRef.current;
      const navPrimary = navPrimaryRef.current;
      const navDiscord = navDiscordRef.current;
      const navPanel = navPanelRef.current;

      if (navInner && navPrimary && navDiscord && navPanel) {
        const navWidth = navInner.offsetWidth;
        const edgeInset = window.innerWidth <= 640 ? 14 : 24;
        const finalLeft = (window.innerWidth - navWidth) / 2;
        const finalRight = (window.innerWidth + navWidth) / 2;
        const spreadProgress = 1 - easedNavProgress;
        const panelWidth = window.innerWidth - edgeInset * 2;
        const finalPanelWidth = Math.min(panelWidth, navWidth + 36);
        const visiblePanelWidth =
          finalPanelWidth + (panelWidth - finalPanelWidth) * spreadProgress;
        const panelInset = Math.max(0, (panelWidth - visiblePanelWidth) / 2);

        navPrimary.style.transform = `translateX(${(edgeInset - finalLeft) * spreadProgress}px)`;
        navDiscord.style.transform = `translateX(${(window.innerWidth - edgeInset - finalRight) * spreadProgress}px)`;
        navPanel.style.clipPath = `inset(0 ${panelInset}px round 4px)`;
        navPanel.style.opacity = closingProgress >= 1 ? "1" : "0";
      }
    };

    const onScroll = () => {
      if (animationFrameRef.current === null) {
        animationFrameRef.current = window.requestAnimationFrame(updateFrame);
      }
    };

    updateFrame();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      if (copyResetRef.current !== null) {
        clearTimeout(copyResetRef.current);
      }
    };
  }, []);

  const copyInstallCommand = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setCopied(true);
      if (copyResetRef.current !== null) clearTimeout(copyResetRef.current);
      copyResetRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <nav className="site-nav" aria-label="Primary navigation">
        <span ref={navPanelRef} className="site-nav-panel" aria-hidden="true" />
        <div ref={navInnerRef} className="site-nav-inner">
          <div ref={navPrimaryRef} className="site-nav-primary">
            <a href="#product">Product</a>
            <a href="#contact">Request invite</a>
          </div>
          <a ref={navDiscordRef} className="discord-link" href="#discord">
            <span className="discord-mark" aria-hidden="true" />
            <span>Join Discord</span>
          </a>
        </div>
      </nav>
      <main>
      <section id="invite" ref={stageRef} className="scroll-stage" aria-label="Melonite private beta">
        <div className="sticky-scene">
          <div ref={frameBoxRef} className="closing-frame" aria-hidden="true" />
          <div className="hero-lockup">
            <div className="hero-wordmark" role="img" aria-label="Melonite">
              <span aria-hidden="true">Melon</span>
              <img
                className="flower-letter"
                src={frameSource(frame)}
                width="1024"
                height="1536"
                alt=""
                aria-hidden="true"
                draggable="false"
              />
              <span aria-hidden="true">te</span>
            </div>
            <div ref={heroMessageRef} className="hero-message">
              <p className="hero-slogan">Iteration makes perfect.</p>
              <div className="hero-access">
                <a className="invite-link" href="#contact">Request an invite</a>
                <p>Free to join by invitation.</p>
              </div>
            </div>
          </div>
          <p className="sr-only" aria-live="polite">
            Flower clarity frame {FRAME_COUNT - frame} of {FRAME_COUNT}
          </p>
        </div>
      </section>
      <section id="product" className="product-preview" aria-labelledby="product-preview-title">
        <div className="product-preview-copy">
          <h2 id="product-preview-title">It’s time you brought a third member into the discussion</h2>
          <p>
            Melonite curates the verification criteria of your tasks, and iteratively makes sure the coding agent follows them to perfection. Let Melonite talk with your coding agent for you.
          </p>
        </div>
        <div id="contact" className="install-command-frame">
          <pre className="install-command" tabIndex={0}>
            <code>{INSTALL_COMMAND}</code>
          </pre>
          <button
            className="copy-command"
            type="button"
            onClick={copyInstallCommand}
            aria-label={copied ? "Install command copied" : "Copy install command"}
            title={copied ? "Copied" : "Copy install command"}
          >
            <span className="copy-icon" aria-hidden="true" />
          </button>
          <span className="sr-only" aria-live="polite">
            {copied ? "Install command copied to clipboard." : ""}
          </span>
        </div>
        <div className="product-preview-frame">
          <img
            src="/melonite-app-preview.png"
            width="2784"
            height="1888"
            alt="Melonite desktop app showing an agent iteration session"
          />
        </div>
        <span id="discord" className="page-end-anchor" aria-hidden="true" />
      </section>
      </main>
    </>
  );
}
