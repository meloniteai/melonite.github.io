import { useEffect, useState } from "react";
import { BrandMark } from "../components/BrandMark";
import { ClosedBetaBanner } from "../components/ClosedBetaBanner";
import { FloatingNav } from "../components/FloatingNav";
import { HeroCopy } from "../components/HeroCopy";
import { HeroTextGridHalo } from "../components/GridHalos";
import { SpaceGridCanvas } from "../components/SpaceGridCanvas";
import { HERO_SPACE_GRID_SETTINGS } from "../components/spaceGridDefaults";

interface DemoSettings {
  centerFollow: number;
  edgeFade: number;
  gravityRadius: number;
  gravityStrength: number;
  gridGlow: number;
  gridIntensity: number;
  gridScale: number;
  lineThickness: number;
  speed: number;
  starDensity: number;
  starIntensity: number;
  starSmear: number;
}

const INITIAL_SETTINGS: DemoSettings = {
  centerFollow: HERO_SPACE_GRID_SETTINGS.centerFollow,
  edgeFade: HERO_SPACE_GRID_SETTINGS.edgeFade,
  gravityRadius: HERO_SPACE_GRID_SETTINGS.gravityRadius,
  gravityStrength: HERO_SPACE_GRID_SETTINGS.gravityStrength,
  gridGlow: HERO_SPACE_GRID_SETTINGS.gridGlow,
  gridIntensity: HERO_SPACE_GRID_SETTINGS.gridIntensity,
  gridScale: HERO_SPACE_GRID_SETTINGS.gridScale,
  lineThickness: HERO_SPACE_GRID_SETTINGS.lineThickness,
  speed: HERO_SPACE_GRID_SETTINGS.speed,
  starDensity: HERO_SPACE_GRID_SETTINGS.starDensity,
  starIntensity: HERO_SPACE_GRID_SETTINGS.starIntensity,
  starSmear: HERO_SPACE_GRID_SETTINGS.starSmear,
};

interface RangeControlProps {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}

function RangeControl({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: RangeControlProps) {
  return (
    <label className="space-grid-demo__control">
      <span>{label}</span>
      <output>{value.toFixed(2)}</output>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

export function SpaceGridDemo() {
  const [settings, setSettings] =
    useState<DemoSettings>(INITIAL_SETTINGS);
  const [paused, setPaused] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLButtonElement
      ) {
        return;
      }

      if (event.key.toLowerCase() === "h") {
        setControlsVisible((visible) => !visible);
      }

      if (event.code === "Space") {
        event.preventDefault();
        setPaused((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const updateSetting =
    (key: keyof DemoSettings) => (value: number) => {
      setSettings((current) => ({ ...current, [key]: value }));
    };

  const reset = () => {
    setSettings(INITIAL_SETTINGS);
    setPaused(false);
  };

  return (
    <div className="space-grid-demo">
      <main
        className="space-grid-demo__hero"
        aria-labelledby="hero-title"
      >
        <SpaceGridCanvas
          backgroundColor={HERO_SPACE_GRID_SETTINGS.backgroundColor}
          className="space-grid-demo__canvas"
          centerFollow={settings.centerFollow}
          edgeFade={settings.edgeFade}
          gravityRadius={settings.gravityRadius}
          gravityStrength={settings.gravityStrength}
          gridColor={HERO_SPACE_GRID_SETTINGS.gridColor}
          gridGlow={settings.gridGlow}
          gridIntensity={settings.gridIntensity}
          gridScale={settings.gridScale}
          lineThickness={settings.lineThickness}
          paused={paused}
          speed={settings.speed}
          starCoolColor={HERO_SPACE_GRID_SETTINGS.starCoolColor}
          starDensity={settings.starDensity}
          starIntensity={settings.starIntensity}
          starSmear={settings.starSmear}
          starWarmColor={HERO_SPACE_GRID_SETTINGS.starWarmColor}
        />

        <div className="space-grid-demo__hero-content">
          <FloatingNav morphOnScroll={false} />
          <BrandMark />
          <ClosedBetaBanner />
          <HeroTextGridHalo />
          <HeroCopy />
        </div>
      </main>

      {controlsVisible ? (
        <>
          <aside
            className="space-grid-demo__controls"
            aria-label="Space grid controls"
          >
            <div className="space-grid-demo__controls-heading">
              <div>
                <p>Live parameters</p>
                <span>{paused ? "Travel paused" : "Rendering live"}</span>
              </div>
              <button type="button" onClick={() => setControlsVisible(false)}>
                Hide
              </button>
            </div>

            <RangeControl
              label="Travel speed"
              min={0.15}
              max={2.4}
              step={0.01}
              value={settings.speed}
              onChange={updateSetting("speed")}
            />
            <RangeControl
              label="Gravity pull"
              min={0}
              max={1.8}
              step={0.01}
              value={settings.gravityStrength}
              onChange={updateSetting("gravityStrength")}
            />
            <RangeControl
              label="Gravity radius"
              min={0.08}
              max={0.9}
              step={0.01}
              value={settings.gravityRadius}
              onChange={updateSetting("gravityRadius")}
            />
            <RangeControl
              label="Center follow"
              min={0}
              max={0.65}
              step={0.01}
              value={settings.centerFollow}
              onChange={updateSetting("centerFollow")}
            />
            <RangeControl
              label="Line weight"
              min={0.3}
              max={1.8}
              step={0.01}
              value={settings.lineThickness}
              onChange={updateSetting("lineThickness")}
            />
            <RangeControl
              label="Grid intensity"
              min={0.25}
              max={1.35}
              step={0.01}
              value={settings.gridIntensity}
              onChange={updateSetting("gridIntensity")}
            />
            <RangeControl
              label="Mesh glow"
              min={0}
              max={1.5}
              step={0.01}
              value={settings.gridGlow}
              onChange={updateSetting("gridGlow")}
            />
            <RangeControl
              label="Grid footprint"
              min={0.65}
              max={1.65}
              step={0.01}
              value={settings.gridScale}
              onChange={updateSetting("gridScale")}
            />
            <RangeControl
              label="Edge fade"
              min={0}
              max={0.35}
              step={0.01}
              value={settings.edgeFade}
              onChange={updateSetting("edgeFade")}
            />
            <RangeControl
              label="Star density"
              min={0}
              max={1}
              step={0.01}
              value={settings.starDensity}
              onChange={updateSetting("starDensity")}
            />
            <RangeControl
              label="Star brightness"
              min={0}
              max={1.4}
              step={0.01}
              value={settings.starIntensity}
              onChange={updateSetting("starIntensity")}
            />
            <RangeControl
              label="Star smear"
              min={0.15}
              max={1.6}
              step={0.01}
              value={settings.starSmear}
              onChange={updateSetting("starSmear")}
            />

            <div className="space-grid-demo__actions">
              <button type="button" onClick={() => setPaused((value) => !value)}>
                {paused ? "Resume" : "Pause"}
              </button>
              <button type="button" onClick={reset}>
                Reset
              </button>
            </div>
          </aside>

          <p className="space-grid-demo__hint">
            H hides controls · Space pauses travel
          </p>
        </>
      ) : (
        <button
          className="space-grid-demo__show-controls"
          type="button"
          onClick={() => setControlsVisible(true)}
        >
          Tune motion
        </button>
      )}
    </div>
  );
}
