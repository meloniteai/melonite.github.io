import { BrandMark } from "./BrandMark";
import { FogTransition } from "./FogTransition";
import { HeroCopy } from "./HeroCopy";
import { SpaceGridCanvas } from "./SpaceGridCanvas";
import { HERO_SPACE_GRID_SETTINGS } from "./spaceGridDefaults";

export function HeroSection() {
  return (
    <section
      className="hero-section"
      aria-labelledby="hero-title"
    >
      <SpaceGridCanvas
        key="hero-blue-star-composite"
        {...HERO_SPACE_GRID_SETTINGS}
        className="hero-space-grid"
        shaderRevision={15}
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
        <HeroCopy />
      </div>
    </section>
  );
}
