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
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 point = vec2(uv.x * aspect, uv.y);
    float drift = uTime * 0.035;

    float broadFog = fbm(point * 1.38 + vec2(drift, -drift * 0.16));
    float fineFog = fbm(point * 2.7 + vec2(-drift * 0.42, drift * 0.12));
    float upperBias = smoothstep(
      0.04 + (broadFog - 0.5) * 0.09,
      0.61 + (broadFog - 0.5) * 0.07,
      uv.y
    );
    float edgeFade =
      smoothstep(0.0, 0.13, uv.y) *
      (1.0 - smoothstep(0.88, 1.0, uv.y));
    float density =
      0.8 +
      (broadFog - 0.5) * 0.26 +
      (fineFog - 0.5) * 0.1;
    float fog = clamp(density * upperBias * edgeFade, 0.0, 1.0);

    vec3 paper = vec3(0.941, 0.929, 0.898);
    vec3 pearl = vec3(0.875, 0.899, 0.977);
    vec3 lavender = vec3(0.655, 0.674, 0.925);
    vec3 blue = vec3(0.404, 0.510, 0.925);

    float lavenderMix =
      smoothstep(0.16, 0.78, uv.y) * 0.68 +
      (broadFog - 0.5) * 0.1;
    vec3 fogColor = mix(pearl, lavender, lavenderMix);
    fogColor = mix(
      fogColor,
      blue,
      smoothstep(0.52, 0.92, uv.y) * 0.28
    );
    vec3 color = mix(paper, fogColor, fog);

    gl_FragColor = vec4(color, 1.0);
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
        alpha: false,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      canvas.dataset.webglUnavailable = "true";
      geometry.dispose();
      material.dispose();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

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
