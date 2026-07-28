import { useEffect, useRef } from "react";
import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three";

const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;

  float hash(vec2 point) {
    return fract(sin(dot(point, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    vec2 curve = local * local * (3.0 - 2.0 * local);

    float a = hash(cell);
    float b = hash(cell + vec2(1.0, 0.0));
    float c = hash(cell + vec2(0.0, 1.0));
    float d = hash(cell + vec2(1.0, 1.0));

    return mix(mix(a, b, curve.x), mix(c, d, curve.x), curve.y);
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.52;
    mat2 rotation = mat2(0.82, -0.57, 0.57, 0.82);

    for (int octave = 0; octave < 5; octave++) {
      value += amplitude * noise(point);
      point = rotation * point * 2.03 + vec2(4.1, 1.7);
      amplitude *= 0.5;
    }

    return value;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 point = uv * vec2(2.55, 1.42);
    float drift = uTime * 0.24;
    vec2 warp = vec2(
      fbm(point * 0.72 + vec2(drift * 0.28, 2.4)),
      fbm(point * 0.78 + vec2(5.1, -drift * 0.2))
    ) - 0.5;
    vec2 warpedPoint = point + warp * vec2(0.48, 0.24);

    float broadFog = fbm(
      warpedPoint * 1.12 + vec2(drift, -drift * 0.14)
    );
    float fineFog = fbm(
      warpedPoint * 2.25 + vec2(-drift * 0.72, drift * 0.18)
    );
    float contourNoise = fbm(
      vec2(uv.x * 3.2 + drift * 0.2, drift * -0.08 + 4.7)
    );
    float crest =
      0.34 +
      (contourNoise - 0.5) * 0.4 +
      sin(uv.x * 5.1 + 0.7) * 0.085 +
      sin(uv.x * 10.8 + drift * 0.16) * 0.035 +
      (uv.x - 0.5) * 0.1;
    crest +=
      exp(-pow((uv.x - 0.69) / 0.19, 2.0)) * 0.17 -
      exp(-pow((uv.x - 0.32) / 0.14, 2.0)) * 0.07;
    float verticalShape = smoothstep(
      crest - 0.1,
      crest + 0.11,
      uv.y
    );
    float edgeFade =
      smoothstep(0.0, 0.06, uv.y) *
      (1.0 - smoothstep(0.79, 1.0, uv.y));
    float sideShape = mix(
      0.72,
      1.08,
      smoothstep(0.0, 0.62, uv.x)
    );
    sideShape *= 1.0 -
      smoothstep(0.78, 1.02, uv.x) * 0.18;
    float fogStructure = smoothstep(
      0.36,
      0.72,
      broadFog * 0.78 + fineFog * 0.32
    );
    float density = 0.46 + fogStructure * 0.68;
    float fog = clamp(
      density * verticalShape * edgeFade * sideShape,
      0.0,
      1.0
    );

    vec3 pearl = vec3(0.949, 0.976, 0.988);
    vec3 sky = vec3(0.886, 0.953, 0.980);
    vec3 blue = vec3(0.729, 0.867, 0.941);

    float lavenderMix =
      smoothstep(0.16, 0.78, uv.y) * 0.68 +
      (broadFog - 0.5) * 0.18 +
      (fogStructure - 0.5) * 0.24;
    vec3 fogColor = mix(pearl, sky, lavenderMix);
    fogColor = mix(
      fogColor,
      blue,
      smoothstep(0.5, 0.92, uv.y) *
        (0.22 + smoothstep(0.5, 0.82, fineFog) * 0.16)
    );
    float alpha = fog * (0.48 + fogStructure * 0.34);

    gl_FragColor = vec4(fogColor, alpha);
  }
`;

export function FogTransition() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new PlaneGeometry(2, 2);
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vector2(1, 1) },
      },
      depthTest: false,
      depthWrite: false,
    });
    const plane = new Mesh(geometry, material);
    scene.add(plane);

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        premultipliedAlpha: true,
        powerPreference: "low-power",
      });
    } catch {
      canvas.dataset.webglUnavailable = "true";
      geometry.dispose();
      material.dispose();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);

    let frame: number | null = null;
    let visible = true;
    const startedAt = performance.now();

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(width));
      const nextHeight = Math.max(1, Math.round(height));
      renderer.setSize(nextWidth, nextHeight, false);
      material.uniforms.uResolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
      );
      renderer.render(scene, camera);
    };

    const render = (now: number) => {
      frame = null;
      material.uniforms.uTime.value = (now - startedAt) / 1000;
      renderer.render(scene, camera);
      if (visible && !reduceMotion) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const start = () => {
      if (frame === null && visible && !reduceMotion) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const stop = () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        start();
      } else {
        stop();
      }
    });
    visibilityObserver.observe(container);

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      canvas.dataset.webglUnavailable = "true";
      stop();
    };

    const handleContextRestored = () => {
      delete canvas.dataset.webglUnavailable;
      resize();
      start();
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);
    resize();
    renderer.render(scene, camera);
    start();

    return () => {
      stop();
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="fog-transition" aria-hidden="true">
      <canvas ref={canvasRef} className="fog-transition-canvas" />
    </div>
  );
}
