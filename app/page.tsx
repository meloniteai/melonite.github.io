"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 30;
const frameSource = (index: number) =>
  `/frames-poppy/hero-${String(index).padStart(3, "0")}.webp`;

export default function Home() {
  const stageRef = useRef<HTMLElement>(null);
  const frameBoxRef = useRef<HTMLDivElement>(null);
  const sloganRef = useRef<HTMLParagraphElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [frame, setFrame] = useState(FRAME_COUNT - 1);

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
        window.innerWidth - 2 -
        (window.innerWidth - 2 - targetWidth) * easedClosingProgress;
      const frameHeight =
        window.innerHeight - 2 -
        (window.innerHeight - 2 - targetHeight) * easedClosingProgress;

      if (frameBoxRef.current) {
        frameBoxRef.current.style.width = `${frameWidth}px`;
        frameBoxRef.current.style.height = `${frameHeight}px`;
      }

      if (sloganRef.current) {
        const isAtRevealSize = closingProgress >= 0.35;
        sloganRef.current.style.opacity = isAtRevealSize ? "1" : "0";
        sloganRef.current.style.transform = isAtRevealSize
          ? "translateY(0)"
          : "translateY(8px)";
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
    };
  }, []);

  return (
    <>
      <nav className="site-nav" aria-label="Primary navigation">
        <a href="#join">Join</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
      <main>
      <section id="join" ref={stageRef} className="scroll-stage" aria-label="Melonite flower transformation">
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
            <p ref={sloganRef} className="hero-slogan">
              Iteration makes perfect.
            </p>
          </div>
          <p className="sr-only" aria-live="polite">
            Flower clarity frame {FRAME_COUNT - frame} of {FRAME_COUNT}
          </p>
        </div>
      </section>
      <section id="about" className="install-section" aria-label="Install Melonite">
        <pre className="install-command" tabIndex={0}>
          <code>curl -fsSL https://github.com/meloniteai/melonite-desktop/releases/latest/download/install.sh | sh</code>
        </pre>
        <span id="contact" className="page-end-anchor" aria-hidden="true" />
      </section>
      </main>
    </>
  );
}
