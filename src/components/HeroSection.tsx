import { useRef } from "react";
import { BrandMark } from "./BrandMark";
import { ClosedBetaBanner } from "./ClosedBetaBanner";
import { HeroTextGridHalo } from "./GridHalos";
import { HeroCopy } from "./HeroCopy";
import { useHeroParallax } from "./useHeroParallax";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  useHeroParallax(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="hero-section"
      aria-labelledby="hero-title"
    >
      <img
        className="hero-transition-art"
        src="/figma/updated/pixel-grid-base-clean.png"
        alt=""
        aria-hidden="true"
      />
      <div className="hero-canvas">
        <img
          className="hero-grid-art"
          src="/figma/updated/hero-grid-overlay.png"
          alt=""
          aria-hidden="true"
        />
        <BrandMark />
        <ClosedBetaBanner />
        <HeroTextGridHalo />
        <HeroCopy />
      </div>
    </section>
  );
}
