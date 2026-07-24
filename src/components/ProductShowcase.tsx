import { useEffect, useRef, useState } from "react";
import { Footer } from "./Footer";

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
        "--toc-parallax-y",
        (progress - 0.5).toFixed(4),
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
      showcaseSection?.style.removeProperty("--toc-parallax-y");
    };
  }, []);

  const selectFeature = (index: number) => {
    const section = sectionRef.current;
    if (!section) return;

    const sectionTop = window.scrollY + section.getBoundingClientRect().top;
    const scrollable = Math.max(section.offsetHeight - window.innerHeight, 1);
    const target = sectionTop + (index / (FEATURES.length - 1)) * scrollable;
    window.scrollTo({
      top: target,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  const feature = FEATURES[activeFeature];

  return (
    <section
      ref={sectionRef}
      id="about"
      className="product-showcase"
      aria-label="How Melonite works"
    >
      <div className="product-stage">
        <img
          className="pixel-strip pixel-strip-a"
          src="/figma/updated/sparse-strip-top-purple.png"
          alt=""
          aria-hidden="true"
        />
        <img
          className="pixel-strip pixel-strip-b"
          src="/figma/updated/sparse-strip-bottom-purple.png"
          alt=""
          aria-hidden="true"
        />
        <div className="product-canvas">
          <img
            className="toc-background"
            src="/figma/updated/toc-bg.png"
            alt=""
            aria-hidden="true"
          />
          <nav className="feature-toc" aria-label="Melonite capabilities">
            {FEATURES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={index === activeFeature ? "is-active" : undefined}
                aria-current={index === activeFeature ? "step" : undefined}
                onClick={() => selectFeature(index)}
              >
                <span className="feature-dot" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <article
            key={feature.id}
            className="feature-copy"
            aria-live="polite"
          >
            <p>{feature.copy}</p>
          </article>
          <img
            className="product-preview-image"
            src="/figma/updated/product-preview-raw-1.png"
            width="2784"
            height="1888"
            alt="Melonite desktop app showing an agent iteration session"
          />
        </div>
        <Footer />
        <span id="discord" className="discord-anchor" aria-hidden="true" />
      </div>
    </section>
  );
}
