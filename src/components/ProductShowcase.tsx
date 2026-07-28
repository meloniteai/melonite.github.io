import { useEffect, useRef, useState } from "react";
import { InstallSection } from "./InstallSection";

const FEATURES = [
  {
    id: "verify",
    label: "Verify",
    copy:
      "Melonite helps you come up with the right validation Rules for your tasks, and then generalize those to project level Rules. The Verifier engine runs the rules against the coding agent’s work automatically, and puts their feedback on your screen at the end of the coding turn.",
  },
  {
    id: "prompt-weave",
    label: "Prompt Weave",
    copy:
      "Let Melonite weave in the next prompt to your coding agent, it factors in your rules and verifier criteria automatically.",
  },
  {
    id: "melonite-agent",
    label: "Melonite Agent",
    copy:
      "Use the Melonite agent to brainstorm about new Rules, choose the right Rules for the task, or operate your coding agent in a loop until all criteria is met. The agent will gradually take more parts in operating your own little Software Factory.",
  },
  {
    id: "watchers",
    label: "Watchers",
    copy:
      "Spin up a session scoped Watcher that keeps your agent honest about what you care about (or let the Melonite agent do that for you).",
  },
] as const;

export function ProductShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const animationFrame = useRef<number | null>(null);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const showcaseSection = sectionRef.current;

    const updateActiveFeature = () => {
      animationFrame.current = null;
      const section = sectionRef.current;
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
      section.style.setProperty(
        "--feature-progress",
        progress.toFixed(4),
      );
      section.style.setProperty(
        "--feature-slider-height",
        `${24 + progress * 101}px`,
      );
      const nextFeature = Math.min(
        FEATURES.length - 1,
        Math.round(progress * (FEATURES.length - 1)),
      );
      setActiveFeature((current) =>
        current === nextFeature ? current : nextFeature,
      );
    };

    const requestUpdate = () => {
      if (animationFrame.current === null) {
        animationFrame.current = window.requestAnimationFrame(
          updateActiveFeature,
        );
      }
    };

    updateActiveFeature();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (animationFrame.current !== null) {
        window.cancelAnimationFrame(animationFrame.current);
      }
      showcaseSection?.style.removeProperty("--feature-progress");
      showcaseSection?.style.removeProperty("--feature-slider-height");
    };
  }, []);

  const feature = FEATURES[activeFeature];

  return (
    <>
      <section
        ref={sectionRef}
        id="install"
        className="product-showcase"
        aria-labelledby="install-title"
      >
        <div className="product-stage">
          <InstallSection />
          <div className="product-canvas">
            <div
              className="feature-slider"
              role="progressbar"
              aria-label="Melonite capability"
              aria-valuemin={1}
              aria-valuemax={FEATURES.length}
              aria-valuenow={activeFeature + 1}
              aria-valuetext={feature.label}
            >
              <span className="feature-slider-fill" aria-hidden="true" />
            </div>
            <article
              key={feature.id}
              className="feature-copy"
              aria-live="polite"
            >
              <h2>{feature.label}</h2>
              <p>{feature.copy}</p>
            </article>
            <img
              className="product-preview-image"
              src="/figma/lp-new/product-preview.png"
              width="2784"
              height="1888"
              alt="Melonite desktop app showing an agent iteration session"
            />
          </div>
        </div>
      </section>
      <img
        className="mid-pixel-strip"
        src="/figma/lp-new/pixel-strip.png"
        width="1920"
        height="122"
        alt=""
        aria-hidden="true"
      />
    </>
  );
}
