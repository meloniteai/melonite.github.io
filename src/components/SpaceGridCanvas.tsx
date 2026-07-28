import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./SpaceGridCanvas.css";
import {
  SPACE_GRID_DEFAULTS,
  type SpaceGridMotionMode,
} from "./spaceGridDefaults";

const VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 vUv;

  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uPointerActivity;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uGravityStrength;
  uniform float uGravityRadius;
  uniform float uCenterFollow;
  uniform float uEdgeFade;
  uniform float uLineThickness;
  uniform float uGridGlow;
  uniform float uGridIntensity;
  uniform float uGridScale;
  uniform float uStarDensity;
  uniform float uStarIntensity;
  uniform float uStarRadius;
  uniform float uStarSmear;
  uniform vec3 uGridColor;
  uniform vec3 uBackgroundColor;
  uniform vec3 uStarCoolColor;
  uniform vec3 uStarWarmColor;

  const float PI = 3.14159265359;
  const float TWO_PI = 6.28318530718;

  float gridLine(float coordinate, float thickness) {
    float derivative = max(fwidth(coordinate), 0.0001);
    float distanceToLine = abs(fract(coordinate) - 0.5);
    return 1.0 - smoothstep(
      derivative * thickness,
      derivative * (thickness + 1.15),
      distanceToLine
    );
  }

  float roundedBoxDistance(vec2 point, vec2 halfSize, float radius) {
    vec2 distance = abs(point) - halfSize + radius;
    return min(max(distance.x, distance.y), 0.0)
      + length(max(distance, 0.0))
      - radius;
  }

  float hash21(vec2 point) {
    vec3 point3 = fract(
      vec3(point.xyx) * vec3(0.1031, 0.1030, 0.0973)
    );
    point3 += dot(point3, point3.yzx + 33.33);
    return fract((point3.x + point3.y) * point3.z);
  }

  vec4 radialStarLayer(
    vec2 point,
    float layer,
    float spokes,
    float travelRate
  ) {
    float radius = length(point);
    if (
      radius < 0.035 ||
      radius > 1.62 ||
      uStarDensity <= 0.0
    ) {
      return vec4(0.0);
    }

    float angle = (atan(point.y, point.x) + PI) / TWO_PI;
    float angularCoordinate = angle * spokes;
    float spokeId = floor(angularCoordinate);
    float travel = log2(radius + 0.028) * 5.35
      - uTime * uSpeed * travelRate
      + layer * 17.17;
    float radialId = floor(travel);
    vec2 starId = vec2(
      spokeId + layer * 431.0,
      radialId - layer * 197.0
    );

    float seed = hash21(starId);
    float densityThreshold = 0.995
      - clamp(uStarDensity, 0.0, 1.0) * 0.115;
    float exists = step(densityThreshold, seed)
      * step(0.001, uStarDensity);
    if (exists < 0.5) {
      return vec4(0.0);
    }

    float angleJitter = (
      hash21(starId + vec2(7.1, 23.7)) - 0.5
    ) * 0.78;
    float starAngle = (
      spokeId + 0.5 + angleJitter
    ) / spokes * TWO_PI - PI;
    vec2 ray = vec2(cos(starAngle), sin(starAngle));
    float crossDistance = abs(point.x * ray.y - point.y * ray.x);

    float phase = fract(travel);
    float anchor = 0.15
      + hash21(starId + vec2(41.3, 11.9)) * 0.7;
    float axialDistance = phase - anchor;
    float normalizedSpeed = clamp(uSpeed / 2.4, 0.0, 1.0);
    float lengthVariation = mix(
      0.72,
      1.28,
      hash21(starId + vec2(19.1, 71.7))
    );
    float streakLength = clamp(
      (0.12 + 0.82 * pow(normalizedSpeed, 0.72))
        * uStarSmear
        * lengthVariation,
      0.035,
      0.92
    );
    float headLength = 0.016 + normalizedSpeed * 0.022;
    float axialEdge = max(fwidth(travel) * 0.85, 0.006);
    float trailShape = smoothstep(
      -streakLength - axialEdge,
      -streakLength,
      axialDistance
    ) * (
      1.0 - smoothstep(
        headLength,
        headLength + axialEdge,
        axialDistance
      )
    );
    float tailBrightness = mix(
      0.16,
      1.0,
      smoothstep(-streakLength, 0.0, axialDistance)
    );

    float pixelWidth = max(fwidth(crossDistance), 0.0002);
    float starWidth = (
      0.00042
      + hash21(starId + vec2(53.2, 5.4)) * 0.00072
    ) * (1.0 + normalizedSpeed * 0.28)
      * uStarRadius;
    float core = 1.0 - smoothstep(
      starWidth + pixelWidth,
      starWidth * 2.4 + pixelWidth,
      crossDistance
    );
    float glow = 1.0 - smoothstep(
      starWidth * 1.8 + pixelWidth,
      starWidth * 6.2 + pixelWidth * 2.0,
      crossDistance
    );

    float horizonFade = smoothstep(0.042, 0.15, radius);
    float edgeFade = 1.0 - smoothstep(1.14, 1.58, radius);
    float brightnessVariation = mix(
      0.3,
      1.12,
      pow(hash21(starId + vec2(83.1, 29.4)), 1.8)
    );

    vec3 pearl = vec3(0.79, 0.81, 0.9);
    float colorSeed = hash21(starId + vec2(13.7, 97.3));
    vec3 starColor = mix(
      pearl,
      uStarCoolColor,
      0.78 + colorSeed * 0.18
    );
    float warmMix = smoothstep(0.82, 1.0, colorSeed) * 0.42;
    starColor = mix(starColor, uStarWarmColor, warmMix);

    float star = exists
      * trailShape
      * tailBrightness
      * (core + glow * 0.24)
      * horizonFade
      * edgeFade
      * brightnessVariation;
    return vec4(starColor * star, star);
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 screenPoint = (vUv - 0.5) * vec2(aspect, 1.0);
    float viewportEdgeDistance = min(
      min(vUv.x, 1.0 - vUv.x),
      min(vUv.y, 1.0 - vUv.y)
    );
    float edgeFadeWidth = max(uEdgeFade, 0.0001);
    float gridViewportFade = mix(
      1.0,
      smoothstep(0.0, edgeFadeWidth, viewportEdgeDistance),
      step(0.0001, uEdgeFade)
    );
    float starViewportFade = mix(
      1.0,
      smoothstep(
        0.0,
        edgeFadeWidth * 1.18,
        viewportEdgeDistance
      ),
      step(0.0001, uEdgeFade)
    );

    vec2 baseCenter = vec2(0.0, -0.088);
    vec2 pointerRange = vec2(min(aspect * 0.46, 0.88), 0.36);
    vec2 pointerOffset = uPointer * pointerRange;
    vec2 gravityCenter = baseCenter + pointerOffset;
    vec2 followedCenter = baseCenter + pointerOffset * uCenterFollow;

    vec2 gravityVector = screenPoint - gravityCenter;
    float gravityDistanceSquared = dot(gravityVector, gravityVector);
    float gravityDistance = sqrt(gravityDistanceSquared);
    float gravityRadius = max(uGravityRadius, 0.06);
    float gravityField = exp(
      -gravityDistanceSquared / (2.0 * gravityRadius * gravityRadius)
    );
    float gravityPull = uGravityStrength * uPointerActivity * gravityField;
    vec2 gravityDirection = gravityVector
      * inversesqrt(gravityDistanceSquared + 0.012);

    vec2 warpedPoint = screenPoint
      + gravityDirection
      * gravityPull
      * (0.052 + 0.036 / (gravityDistance + 0.22));
    vec2 localCenter = mix(
      followedCenter,
      gravityCenter,
      clamp(gravityPull * 0.24, 0.0, 0.52)
    );
    vec2 tunnelPoint = warpedPoint - localCenter;
    vec2 starPoint = mix(
      screenPoint - localCenter,
      tunnelPoint,
      0.42
    );

    vec4 stars = radialStarLayer(starPoint, 0.0, 89.0, 3.7) * 0.68;
    stars += radialStarLayer(starPoint, 1.0, 137.0, 4.6) * 0.48;
    stars += radialStarLayer(starPoint, 2.0, 181.0, 5.5) * 0.32;
    stars *= starViewportFade;

    vec2 tunnelHalfSize = vec2(0.49, 0.265)
      / max(uGridScale, 0.55);
    float xRatio = abs(tunnelPoint.x) / tunnelHalfSize.x;
    float yRatio = abs(tunnelPoint.y) / tunnelHalfSize.y;
    bool hitsSideWall = xRatio > yRatio;

    float wallCoordinate = hitsSideWall
      ? abs(tunnelPoint.x)
      : abs(tunnelPoint.y);
    float wallHalfSize = hitsSideWall
      ? tunnelHalfSize.x
      : tunnelHalfSize.y;
    float depth = wallHalfSize / max(wallCoordinate, 0.001);
    vec2 wallPoint = tunnelPoint * depth;

    float acrossWall = hitsSideWall
      ? wallPoint.y / tunnelHalfSize.y
      : wallPoint.x / tunnelHalfSize.x;
    float wallCells = hitsSideWall ? 6.0 : 10.0;
    float longitudinalCoordinate = (acrossWall * 0.5 + 0.5) * wallCells;
    float depthCoordinate = (depth + uTime * uSpeed) * 10.0;

    float longitudinalLines = gridLine(
      longitudinalCoordinate,
      uLineThickness * 0.74
    );
    float depthSlices = gridLine(depthCoordinate, uLineThickness);
    float longitudinalGlow = gridLine(
      longitudinalCoordinate,
      uLineThickness * 3.25
    );
    float depthGlow = gridLine(
      depthCoordinate,
      uLineThickness * 3.65
    );
    float wallSeamDerivative = max(fwidth(xRatio - yRatio), 0.0001);
    float wallSeam = 1.0 - smoothstep(
      0.0,
      wallSeamDerivative * 1.8,
      abs(xRatio - yRatio)
    );

    float holeDistance = roundedBoxDistance(
      tunnelPoint,
      tunnelHalfSize,
      0.035
    );
    float holeEdgeWidth = max(fwidth(holeDistance), 0.0005);
    float outsideHole = smoothstep(
      -holeEdgeWidth,
      holeEdgeWidth,
      holeDistance
    );

    float nearFade = smoothstep(0.22, 0.38, depth);
    float horizonFade = 1.0 - smoothstep(0.94, 1.035, depth);
    float mesh = max(depthSlices, longitudinalLines * 0.78);
    mesh = max(mesh, wallSeam * 0.84);
    float meshGlow = max(depthGlow, longitudinalGlow * 0.74);
    meshGlow = max(meshGlow, wallSeam * 0.4);
    mesh *= outsideHole * nearFade * horizonFade;
    meshGlow *= outsideHole
      * nearFade
      * horizonFade
      * gridViewportFade;
    meshGlow = pow(clamp(meshGlow, 0.0, 1.0), 1.28)
      * uGridGlow
      * uGridIntensity
      * 0.48;
    mesh = pow(clamp(mesh * uGridIntensity, 0.0, 1.0), 0.88);
    mesh *= gridViewportFade;

    float starAlpha = clamp(
      pow(max(stars.a, 0.0), 0.65)
        * uStarIntensity
        * 1.45,
      0.0,
      0.92
    );
    vec3 normalizedStarColor = stars.rgb / max(stars.a, 0.0001);
    vec3 starContrastColor = mix(
      normalizedStarColor,
      vec3(0.18, 0.55, 0.76),
      0.62
    );
    vec3 visibleStarColor = mix(
      starContrastColor,
      normalizedStarColor,
      smoothstep(0.58, 0.92, starAlpha) * 0.38
    );
    vec3 color = mix(uBackgroundColor, visibleStarColor, starAlpha);
    color = mix(color, uGridColor, meshGlow);
    color = mix(color, uGridColor, mesh);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

export interface SpaceGridCanvasProps {
  backgroundColor?: string;
  centerFollow?: number;
  className?: string;
  dprCap?: number;
  edgeFade?: number;
  gravityRadius?: number;
  gravityStrength?: number;
  gridColor?: string;
  gridGlow?: number;
  gridIntensity?: number;
  gridScale?: number;
  lineThickness?: number;
  motionMode?: SpaceGridMotionMode;
  paused?: boolean;
  shaderRevision?: number;
  speed?: number;
  starCoolColor?: string;
  starDensity?: number;
  starIntensity?: number;
  starRadius?: number;
  starSmear?: number;
  starWarmColor?: string;
}

interface LiveSettings {
  backgroundColor: string;
  centerFollow: number;
  edgeFade: number;
  gravityRadius: number;
  gravityStrength: number;
  gridColor: string;
  gridGlow: number;
  gridIntensity: number;
  gridScale: number;
  lineThickness: number;
  paused: boolean;
  speed: number;
  starCoolColor: string;
  starDensity: number;
  starIntensity: number;
  starRadius: number;
  starSmear: number;
  starWarmColor: string;
}

interface RendererProgramDiagnostics {
  diagnostics?: {
    runnable?: boolean;
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function SpaceGridCanvas({
  backgroundColor = SPACE_GRID_DEFAULTS.backgroundColor,
  centerFollow = SPACE_GRID_DEFAULTS.centerFollow,
  className,
  dprCap = SPACE_GRID_DEFAULTS.dprCap,
  edgeFade = SPACE_GRID_DEFAULTS.edgeFade,
  gravityRadius = SPACE_GRID_DEFAULTS.gravityRadius,
  gravityStrength = SPACE_GRID_DEFAULTS.gravityStrength,
  gridColor = SPACE_GRID_DEFAULTS.gridColor,
  gridGlow = SPACE_GRID_DEFAULTS.gridGlow,
  gridIntensity = SPACE_GRID_DEFAULTS.gridIntensity,
  gridScale = SPACE_GRID_DEFAULTS.gridScale,
  lineThickness = SPACE_GRID_DEFAULTS.lineThickness,
  motionMode = SPACE_GRID_DEFAULTS.motionMode,
  paused = SPACE_GRID_DEFAULTS.paused,
  shaderRevision = 1,
  speed = SPACE_GRID_DEFAULTS.speed,
  starCoolColor = SPACE_GRID_DEFAULTS.starCoolColor,
  starDensity = SPACE_GRID_DEFAULTS.starDensity,
  starIntensity = SPACE_GRID_DEFAULTS.starIntensity,
  starRadius = SPACE_GRID_DEFAULTS.starRadius,
  starSmear = SPACE_GRID_DEFAULTS.starSmear,
  starWarmColor = SPACE_GRID_DEFAULTS.starWarmColor,
}: SpaceGridCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef<LiveSettings>({
    backgroundColor,
    centerFollow,
    edgeFade,
    gravityRadius,
    gravityStrength,
    gridColor,
    gridGlow,
    gridIntensity,
    gridScale,
    lineThickness,
    paused,
    speed,
    starCoolColor,
    starDensity,
    starIntensity,
    starRadius,
    starSmear,
    starWarmColor,
  });

  useEffect(() => {
    settingsRef.current = {
      backgroundColor,
      centerFollow,
      edgeFade,
      gravityRadius,
      gravityStrength,
      gridColor,
      gridGlow,
      gridIntensity,
      gridScale,
      lineThickness,
      paused,
      speed,
      starCoolColor,
      starDensity,
      starIntensity,
      starRadius,
      starSmear,
      starWarmColor,
    };
  }, [
    backgroundColor,
    centerFollow,
    edgeFade,
    gravityRadius,
    gravityStrength,
    gridColor,
    gridGlow,
    gridIntensity,
    gridScale,
    lineThickness,
    paused,
    speed,
    starCoolColor,
    starDensity,
    starIntensity,
    starRadius,
    starSmear,
    starWarmColor,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const finePointerQuery = window.matchMedia("(pointer: fine)");
    const pointerTarget = new THREE.Vector2();
    const pointerCurrent = new THREE.Vector2();
    const resolution = new THREE.Vector2(1, 1);
    let pointerActivityTarget = 0;
    let pointerActivityCurrent = 0;
    let elapsed = 0;
    let lastFrameTime = performance.now();
    let isIntersecting = true;
    let isDocumentVisible = !document.hidden;
    let loopIsRunning = false;
    let renderer: THREE.WebGLRenderer;

    const markRendererUnavailable = () => {
      container.dataset.webglUnavailable = "true";
      loopIsRunning = false;
      renderer?.setAnimationLoop(null);
    };

    const isReduced = () =>
      motionMode === "reduced" ||
      (motionMode === "auto" && reducedMotionQuery.matches);

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: false,
        antialias: false,
        canvas,
        powerPreference: "high-performance",
      });
    } catch (error) {
      container.dataset.webglUnavailable = "true";
      console.warn("SpaceGridCanvas could not create a WebGL renderer.", error);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, clamp(dprCap, 1, 2)),
    );

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      uBackgroundColor: {
        value: new THREE.Color(settingsRef.current.backgroundColor),
      },
      uCenterFollow: { value: settingsRef.current.centerFollow },
      uEdgeFade: { value: settingsRef.current.edgeFade },
      uGravityRadius: { value: settingsRef.current.gravityRadius },
      uGravityStrength: { value: settingsRef.current.gravityStrength },
      uGridColor: { value: new THREE.Color(settingsRef.current.gridColor) },
      uGridGlow: { value: settingsRef.current.gridGlow },
      uGridIntensity: { value: settingsRef.current.gridIntensity },
      uGridScale: { value: settingsRef.current.gridScale },
      uLineThickness: { value: settingsRef.current.lineThickness },
      uPointer: { value: pointerCurrent },
      uPointerActivity: { value: 0 },
      uResolution: { value: resolution },
      uSpeed: { value: settingsRef.current.speed },
      uStarCoolColor: {
        value: new THREE.Color(settingsRef.current.starCoolColor),
      },
      uStarDensity: { value: settingsRef.current.starDensity },
      uStarIntensity: { value: settingsRef.current.starIntensity },
      uStarRadius: { value: settingsRef.current.starRadius },
      uStarSmear: { value: settingsRef.current.starSmear },
      uStarWarmColor: {
        value: new THREE.Color(settingsRef.current.starWarmColor),
      },
      uTime: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      vertexShader: VERTEX_SHADER,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    let lastBackgroundColor = settingsRef.current.backgroundColor;
    let lastGridColor = settingsRef.current.gridColor;
    let lastStarCoolColor = settingsRef.current.starCoolColor;
    let lastStarWarmColor = settingsRef.current.starWarmColor;

    const updateUniformSettings = () => {
      const settings = settingsRef.current;
      uniforms.uCenterFollow.value = settings.centerFollow;
      uniforms.uEdgeFade.value = settings.edgeFade;
      uniforms.uGravityRadius.value = settings.gravityRadius;
      uniforms.uGravityStrength.value = settings.gravityStrength;
      uniforms.uGridGlow.value = settings.gridGlow;
      uniforms.uGridIntensity.value = settings.gridIntensity;
      uniforms.uGridScale.value = settings.gridScale;
      uniforms.uLineThickness.value = settings.lineThickness;
      uniforms.uSpeed.value = settings.speed;
      uniforms.uStarDensity.value = settings.starDensity;
      uniforms.uStarIntensity.value = settings.starIntensity;
      uniforms.uStarRadius.value = settings.starRadius;
      uniforms.uStarSmear.value = settings.starSmear;

      if (settings.backgroundColor !== lastBackgroundColor) {
        uniforms.uBackgroundColor.value.set(settings.backgroundColor);
        lastBackgroundColor = settings.backgroundColor;
      }

      if (settings.gridColor !== lastGridColor) {
        uniforms.uGridColor.value.set(settings.gridColor);
        lastGridColor = settings.gridColor;
      }

      if (settings.starCoolColor !== lastStarCoolColor) {
        uniforms.uStarCoolColor.value.set(settings.starCoolColor);
        lastStarCoolColor = settings.starCoolColor;
      }

      if (settings.starWarmColor !== lastStarWarmColor) {
        uniforms.uStarWarmColor.value.set(settings.starWarmColor);
        lastStarWarmColor = settings.starWarmColor;
      }
    };

    const renderFrame = (frameTime: number) => {
      const deltaSeconds = Math.min(
        Math.max((frameTime - lastFrameTime) / 1000, 0),
        0.05,
      );
      lastFrameTime = frameTime;
      updateUniformSettings();

      if (!settingsRef.current.paused && !isReduced()) {
        elapsed += deltaSeconds;
      }

      const smoothing = 1 - Math.exp(-deltaSeconds * 10);
      pointerCurrent.lerp(pointerTarget, smoothing);
      pointerActivityCurrent +=
        (pointerActivityTarget - pointerActivityCurrent) * smoothing;

      uniforms.uPointerActivity.value = pointerActivityCurrent;
      uniforms.uTime.value = elapsed;

      try {
        renderer.render(scene, camera);
        const programs = renderer.info.programs as
          | RendererProgramDiagnostics[]
          | null;
        if (programs?.some((program) => program.diagnostics?.runnable === false)) {
          markRendererUnavailable();
        }
      } catch (error) {
        console.warn("SpaceGridCanvas could not render a frame.", error);
        markRendererUnavailable();
      }
    };

    const renderStill = () => {
      updateUniformSettings();
      pointerCurrent.set(0, 0);
      pointerActivityCurrent = 0;
      uniforms.uPointerActivity.value = 0;
      uniforms.uTime.value = 0;

      try {
        renderer.render(scene, camera);
        const programs = renderer.info.programs as
          | RendererProgramDiagnostics[]
          | null;
        if (programs?.some((program) => program.diagnostics?.runnable === false)) {
          markRendererUnavailable();
        }
      } catch (error) {
        console.warn("SpaceGridCanvas could not render a still frame.", error);
        markRendererUnavailable();
      }
    };

    const updateAnimationLoop = () => {
      const shouldRun =
        isIntersecting && isDocumentVisible && !isReduced();

      if (shouldRun && !loopIsRunning) {
        loopIsRunning = true;
        lastFrameTime = performance.now();
        renderer.setAnimationLoop(renderFrame);
        return;
      }

      if (!shouldRun && loopIsRunning) {
        loopIsRunning = false;
        renderer.setAnimationLoop(null);
        renderStill();
      }
    };

    const resize = () => {
      const bounds = container.getBoundingClientRect();
      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height));
      renderer.setSize(width, height, false);
      renderer.getDrawingBufferSize(resolution);
      renderStill();
    };

    const resetPointer = () => {
      pointerTarget.set(0, 0);
      pointerActivityTarget = 0;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (isReduced() || !finePointerQuery.matches) return;

      const bounds = container.getBoundingClientRect();
      const relativeX = (event.clientX - bounds.left) / bounds.width;
      const relativeY = (event.clientY - bounds.top) / bounds.height;
      const isInside =
        relativeX >= 0 &&
        relativeX <= 1 &&
        relativeY >= 0 &&
        relativeY <= 1;

      if (!isInside) {
        resetPointer();
        return;
      }

      pointerTarget.set(
        clamp(relativeX * 2 - 1, -1, 1),
        clamp(1 - relativeY * 2, -1, 1),
      );
      pointerActivityTarget = 1;
    };

    const handleVisibilityChange = () => {
      isDocumentVisible = !document.hidden;
      updateAnimationLoop();
    };

    const handleMotionPreferenceChange = () => {
      resetPointer();
      updateAnimationLoop();
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      markRendererUnavailable();
    };

    const handleContextRestored = () => {
      delete container.dataset.webglUnavailable;
      resize();
      updateAnimationLoop();
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry?.isIntersecting ?? true;
        updateAnimationLoop();
      },
      { threshold: 0.01 },
    );

    resizeObserver.observe(container);
    intersectionObserver.observe(container);
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("blur", resetPointer);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    reducedMotionQuery.addEventListener(
      "change",
      handleMotionPreferenceChange,
    );
    finePointerQuery.addEventListener("change", resetPointer);
    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    resize();
    updateAnimationLoop();

    return () => {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetPointer);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      reducedMotionQuery.removeEventListener(
        "change",
        handleMotionPreferenceChange,
      );
      finePointerQuery.removeEventListener("change", resetPointer);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener(
        "webglcontextrestored",
        handleContextRestored,
      );
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [dprCap, motionMode, shaderRevision]);

  return (
    <div
      ref={containerRef}
      className={
        className
          ? `space-grid-canvas ${className}`
          : "space-grid-canvas"
      }
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="space-grid-canvas__surface"
        style={{ backgroundColor }}
      />
    </div>
  );
}
