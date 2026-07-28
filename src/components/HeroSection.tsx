import { useRef } from "react";
import { BrandMark } from "./BrandMark";
import { ClosedBetaBanner } from "./ClosedBetaBanner";
import { FogTransition } from "./FogTransition";
import { HeroCopy } from "./HeroCopy";
import { SpaceGridCanvas } from "./SpaceGridCanvas";
import { HERO_SPACE_GRID_SETTINGS } from "./spaceGridDefaults";
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
      <SpaceGridCanvas
        {...HERO_SPACE_GRID_SETTINGS}
        className="hero-space-grid"
      />
      <FogTransition />
      <div className="hero-canvas">
        <img
          className="hero-grid-art"
          src="/figma/updated/hero-grid-overlay.png"
          alt=""
          aria-hidden="true"
        />
        <BrandMark />
        <ClosedBetaBanner />
        <HeroCopy />
      </div>
    </section>
  );
}
