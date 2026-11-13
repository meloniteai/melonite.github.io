import * as THREE from 'three';
import vertexShader from './shaders/facade.vert.glsl?raw';
import fragmentShader from './shaders/facade.frag.glsl?raw';
import sunsetShader from './shaders/sunset.glsl?raw';
import { paragraphs } from './excerpts.ts';
import { createTextMotion } from './text-motion.ts';
import { createSkyMotion } from './sky-motion.ts';

export const POSTER_WIDTH = 1000;
export const POSTER_HEIGHT = POSTER_WIDTH * Math.SQRT2;
const TYPE_SIZE = 16;
const LEADING = 17.8;
const CONDENSE = 0.88;
const coloredFacadeShader = `${sunsetShader}\n${fragmentShader}`;

// Empire State Building reference: stepped shaft, terraced crown, lantern,
// and slender antenna. Widths are fractions of the lower tower footprint.
// Each section describes a pair of text-covered wall planes, not an image mask.
interface EmpireSection {
  top: number;
  bottom: number;
  upper: number;
  lower: number;
  inkFloor?: number;
}

interface Building {
  name: string;
  anchor: [number, number];
  left: number;
  right: number;
  height: number;
  ink: [number, number];
  fade: [number, number];
  power: number;
  seed: number;
  distance?: number;
  layer?: number;
  textWidth?: [number, number];
  profile?: readonly EmpireSection[];
}

export interface SkylineOptions {
  onError?: (message: string) => void;
  motion?: boolean;
  motionTarget?: HTMLElement | Document;
  extendLeft?: boolean;
}

export interface Skyline {
  render(): void;
  resize(): void;
  exportPng(width?: number): Promise<Blob>;
  readonly frameCount: number;
  dispose(): void;
}

const EMPIRE_PROFILE: readonly EmpireSection[] = [
  { top: 0, bottom: 65, upper: 0.018, lower: 0.023, inkFloor: 0.85 },
  { top: 65, bottom: 74, upper: 0.048, lower: 0.048, inkFloor: 0.70 },
  { top: 74, bottom: 105, upper: 0.029, lower: 0.038, inkFloor: 0.75 },
  { top: 105, bottom: 116, upper: 0.085, lower: 0.085 },
  { top: 116, bottom: 196, upper: 0.11, lower: 0.15 },
  { top: 196, bottom: 208, upper: 0.26, lower: 0.26 },
  { top: 208, bottom: 222, upper: 0.46, lower: 0.46 },
  { top: 222, bottom: 288, upper: 0.64, lower: 0.64 },
  { top: 288, bottom: 414, upper: 0.83, lower: 0.83 },
  { top: 414, bottom: 1100, upper: 1.0, lower: 1.0 },
];

// Measured from the supplied poster: one cropped foreground tower, a distant
// pair of faces, a dominant corner, and a low foreground block. Dimensions are
// architectural units, with the corner positioned in the 1000-unit poster.
const BUILDINGS: readonly Building[] = [
  { name: 'Empire State Building', anchor: [482, 34], left: 180, right: 128, height: 1100,
    ink: [1.03, 0.78], fade: [0.17, 0.94], power: 1.3, seed: 3, profile: EMPIRE_PROFILE },
  { name: 'Recessed west wall', anchor: [300, 549], left: 0, right: 96, height: 940,
    ink: [0, 0.78], fade: [0.09, 0.83], power: 1.3, seed: 7 },
  { name: 'Midtown corner', anchor: [808, 400], left: 417, right: 382, height: 1020,
    ink: [1.16, 1.04], fade: [0.04, 0.81], power: 1.65, seed: 13 },
  { name: 'West foreground tower', anchor: [-132, -330], left: 0, right: 432, height: 1840,
    ink: [0, 1.25], fade: [0.58, 1.0], power: 1.25, seed: 21 },
  { name: 'Low east block', anchor: [1120, 869], left: 930, right: 0, height: 520,
    ink: [1.22, 0], fade: [0.06, 0.78], power: 1.4, seed: 31 },
];

// Projected anchors compose the descending roofline; distance foreshortens
// both the physical facade and its type. Draw layers are independent of x, so
// broad nearby walls conceal the feet of the finer, paler buildings behind.
const WEST_BUILDINGS: readonly Building[] = [
  { name: 'Distant west loft', anchor: [-740, 1030], left: 95, right: 62, height: 640,
    ink: [0.72, 0.94], fade: [0.12, 0.91], power: 1.3, seed: 41, distance: 0.65, layer: 0.5 },
  { name: 'Recessed narrow slab', anchor: [-492, 840], left: 120, right: 190, height: 1060,
    ink: [0.77, 0.96], fade: [0.1, 0.91], power: 1.45, seed: 47, distance: 0.9, layer: 0.6 },
  { name: 'Tower-side rear shaft', anchor: [-306, 680], left: 120, right: 65, height: 1300,
    ink: [0.74, 0.96], fade: [0.16, 0.95], power: 1.3, seed: 53, distance: 0.75, layer: 0.7 },
  { name: 'Low west warehouse', anchor: [-930, 1280], left: 180, right: 65, height: 360,
    ink: [0.82, 1.02], fade: [0.0, 0.96], power: 1.2, seed: 59, distance: 0.1, layer: 2.1 },
  { name: 'Broad west tenement', anchor: [-652, 1080], left: 235, right: 78, height: 710,
    ink: [1.06, 0.85], fade: [0.16, 0.97], power: 1.2, seed: 61, distance: 0.25, layer: 2.4 },
  { name: 'Low recessed courtyard wall', anchor: [-395, 1088], left: 95, right: 205, height: 580,
    ink: [0.82, 0.98], fade: [0.08, 0.96], power: 1.4, seed: 67, distance: 0.15, layer: 2.6 },
  { name: 'Near west masonry block', anchor: [-285, 865], left: 260, right: 95, height: 790,
    ink: [1.13, 0.84], fade: [0.24, 0.98], power: 1.35, seed: 71, distance: 0.05, layer: 3.5 },
  { name: 'Continuous west foreground frontage', anchor: [65, 1008], left: 840, right: 0, height: 430,
    ink: [1.18, 0], fade: [0.06, 0.84], power: 1.4, seed: 79, layer: 4.5 },
];

/** Typeset live text, not the reference bitmap, into a high-resolution atlas. */
function createTypeTexture(width: number, height: number, offset: number, maxTextureSize: number, anisotropy: number, typeScale = 1) {
  const canvas = document.createElement('canvas');
  const scale = Math.min(3, maxTextureSize / Math.max(width, height));
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create the text texture canvas.');
  ctx.scale(canvas.width / width, canvas.height / height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#000';
  ctx.font = `700 ${TYPE_SIZE * typeScale}px "Cormorant Garamond", Georgia, serif`;
  ctx.textBaseline = 'top';
  ctx.scale(CONDENSE, 1);

  const available = (width - 5) / CONDENSE;
  const words = paragraphs.join(' ').toUpperCase().split(/\s+/);
  let cursor = offset % words.length;
  const gap = ctx.measureText(' ').width;
  const leading = LEADING * typeScale;
  const rows = Math.ceil(height / leading);

  for (let row = 0; row < rows; row++) {
    const line = [];
    let wordWidth = 0;
    while (true) {
      const word = words[cursor % words.length];
      const nextWidth = ctx.measureText(word).width;
      if (line.length && wordWidth + nextWidth + gap * line.length > available) break;
      line.push(word);
      wordWidth += nextWidth;
      cursor++;
    }
    const spacing = line.length > 1 ? (available - wordWidth) / (line.length - 1) : 0;
    let x = 2 / CONDENSE;
    for (const word of line) {
      ctx.fillText(word, x, row * leading + 1.4 * typeScale);
      x += ctx.measureText(word).width + spacing;
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  // The fractional count is intentional: shader row boundaries must match
  // exact typeset baselines even when the final line is only partially visible.
  return { texture, rows: height / leading };
}

function facadeGeometry(width: number, height: number, left: boolean) {
  // Actual perpendicular wall planes in XYZ, projected by the vertex shader.
  // Left wall: X=0, Z=-width..0. Right wall: Z=0, X=0..width.
  const points = left
    ? [0, 0, -width, 0, 0, 0, 0, height, 0, 0, height, -width]
    : [0, 0, 0, width, 0, 0, width, height, 0, 0, height, 0];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2));
  geometry.setAttribute('inkFloor', new THREE.Float32BufferAttribute([0, 0, 0, 0], 1));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  return geometry;
}

function landmarkGeometry(width: number, height: number, left: boolean, profile: readonly EmpireSection[], verticalScale: number) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const inkFloors = [];
  for (const section of profile) {
    const top = section.top * verticalScale;
    const bottom = section.bottom * verticalScale;
    const upper = width * section.upper;
    const lower = width * section.lower;
    const start = positions.length / 3;
    if (left) {
      positions.push(0, top, -upper, 0, top, 0, 0, bottom, 0, 0, bottom, -lower);
      uvs.push(0.5 - section.upper / 2, 1 - top / height, 0.5, 1 - top / height,
        0.5, 1 - bottom / height, 0.5 - section.lower / 2, 1 - bottom / height);
    } else {
      positions.push(0, top, 0, upper, top, 0, lower, bottom, 0, 0, bottom, 0);
      uvs.push(0.5, 1 - top / height, 0.5 + section.upper / 2, 1 - top / height,
        0.5 + section.lower / 2, 1 - bottom / height, 0.5, 1 - bottom / height);
    }
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
    inkFloors.push(...Array(4).fill(section.inkFloor || 0));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('inkFloor', new THREE.Float32BufferAttribute(inkFloors, 1));
  geometry.setIndex(indices);
  return geometry;
}

/**
 * Mount the artwork in any sized element. Cursor movement gives the text rows
 * momentum; geometry stays fixed. Rendering sleeps once the text settles.
 */
export function createSkyline(container: HTMLElement, { onError = () => {}, motion = true, motionTarget, extendLeft = false }: SkylineOptions = {}): Skyline {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setClearColor(0xffffff, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, POSTER_WIDTH, POSTER_HEIGHT, 0, 0.1, 100);
  camera.position.z = 10;
  const maxTextureSize = Math.min(renderer.capabilities.maxTextureSize, 8192);
  const anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  // Share one travel accumulator between all materials, including after resize.
  const scrollUniform = { value: 0 };
  const skyUniforms = {
    uSkyResolution: { value: new THREE.Vector2(1, 1) },
    uSkyViewport: { value: new THREE.Vector2(1, 1) },
    uSkyStrength: { value: 0.42 },
    uSkyExpanded: { value: 0 },
    uSkyTime: { value: 0 },
  };
  const skyGeometry = new THREE.PlaneGeometry(2, 2);
  const skyMaterial = new THREE.ShaderMaterial({
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `${sunsetShader}\nvoid main() { gl_FragColor = vec4(sunsetPaper(1.0), 1.0); }`,
    uniforms: skyUniforms,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
  skyMesh.name = 'Blue sunset sky fill';
  skyMesh.renderOrder = -10;
  skyMesh.frustumCulled = false;
  let resources: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];
  let compositionHeight = 0;
  let compositionExtended = false;
  let lastWidth = 0;
  let lastHeight = 0;
  let frameCount = 0;
  let disposed = false;
  let lost = false;
  let pendingRender = 0;

  function buildComposition(height: number, extended: boolean) {
    resources.forEach((resource) => resource.dispose());
    resources = [];
    scene.clear();
    scene.add(skyMesh);
    skyUniforms.uSkyExpanded.value = extended ? 1 : 0;
    const verticalScale = height / POSTER_HEIGHT;
    compositionHeight = height;
    compositionExtended = extended;
    const buildings = BUILDINGS.map((original, index) => {
      const joinsWest = extended && original.name === 'West foreground tower';
      // Reveal the existing tower's actual corner and its narrow return wall.
      // Its broad right facade retains exactly the same geometry and texture.
      const building: Building = joinsWest ? {
        ...original, left: 86, ink: [0.82, original.ink[1]],
        // This wall is seen obliquely: compress a full paragraph across the
        // narrow return instead of wrapping it into one-word lines.
        textWidth: [258, original.right],
      } : original;
      return { building, layer: index + 1, clip: extended, clipMinX: joinsWest ? -218 : 0 };
    });
    if (extended) {
      buildings.push(...WEST_BUILDINGS.map((building) => ({
        building, layer: building.layer ?? 0, clip: false, clipMinX: 0,
      })));
    }
    buildings.forEach(({ building, layer, clip, clipMinX }) => {
      const distance = building.distance ?? 0;
      const perspective = 1 / (1 + distance);
      const typeScale = (building.profile ? 0.53 : 1) * perspective;
      [building.left, building.right].forEach((width, side) => {
        if (!width) return;
        const faceHeight = building.height * verticalScale * perspective;
        // Unlike the surrounding slabs, the landmark keeps its slender
        // proportions when the composition changes from portrait to landscape.
        const faceWidth = width * perspective * (building.profile ? verticalScale : 1);
        const atlasWidth = building.profile ? faceWidth * 2 : (building.textWidth?.[side] ?? width) * perspective;
        const { texture, rows } = createTypeTexture(atlasWidth, faceHeight, building.seed * 13 + side * 47,
          maxTextureSize, anisotropy, typeScale);
        const material = new THREE.ShaderMaterial({
          vertexShader, fragmentShader: coloredFacadeShader,
          uniforms: {
            ...skyUniforms,
            uType: { value: texture },
            uAnchor: { value: new THREE.Vector2(building.anchor[0], building.anchor[1] * verticalScale) },
            uPosterHeight: { value: height },
            uClipToPoster: { value: clip },
            uClipMinX: { value: clipMinX / POSTER_WIDTH },
            uShear: { value: building.profile ? 0.55 : 0.55 * verticalScale },
            uInk: { value: building.ink[side] * (1 - distance * 0.28) },
            uFadeStart: { value: building.fade[0] },
            uFadeEnd: { value: building.fade[1] },
            uFadePower: { value: building.power },
            uEdgeShade: { value: side === 1 ? 0.35 : 0.0 },
            uRows: { value: rows },
            uSeed: { value: building.seed },
            uScroll: scrollUniform,
            uTypeWidth: { value: atlasWidth },
            uMotionScale: { value: typeScale },
          },
          side: THREE.DoubleSide,
          depthTest: false,
          depthWrite: false,
          toneMapped: false,
        });
        const geometry = building.profile
          ? landmarkGeometry(faceWidth, faceHeight, side === 0, building.profile, verticalScale * perspective)
          : facadeGeometry(faceWidth, faceHeight, side === 0);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `${building.name} / ${side === 0 ? 'left' : 'right'}`;
        mesh.renderOrder = layer;
        // Projection is in GLSL, so the CPU's unprojected bounding sphere is not
        // a valid culling volume for this architectural camera.
        mesh.frustumCulled = false;
        scene.add(mesh);
        resources.push(geometry, material, texture);
      });
    });
    container.dataset.buildings = String(buildings.length);
  }

  function render() {
    if (disposed || lost) return;
    cancelAnimationFrame(pendingRender);
    pendingRender = 0;
    // Drawing-buffer coordinates keep the wash identical across pixel ratios
    // and exported PNG sizes, and aligned between all overlapping faces.
    renderer.getDrawingBufferSize(skyUniforms.uSkyResolution.value);
    renderer.render(scene, camera);
    frameCount++;
    container.dataset.frames = String(frameCount);
    container.dataset.scroll = scrollUniform.value.toFixed(3);
    container.dataset.skyTime = skyUniforms.uSkyTime.value.toFixed(3);
    container.dataset.ready = 'true';
  }

  // Both clocks can update in the same browser frame. Coalesce those updates
  // into one WebGL draw, while keeping explicit resize/export renders immediate.
  function requestRender() {
    if (disposed || lost || pendingRender) return;
    pendingRender = requestAnimationFrame(render);
  }

  function resize() {
    if (disposed || lost) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    if (width === lastWidth && height === lastHeight) return;
    lastWidth = width;
    lastHeight = height;
    skyUniforms.uSkyViewport.value.set(width, height);
    // Recompose the architecture to fill the actual slot. Retypeset walls at
    // the new height, keeping glyph proportions and line spacing intact.
    // This avoids cropping the skyline or shrinking a portrait into a rectangle.
    const extended = extendLeft && width / height >= 2;
    const columnGap = parseFloat(getComputedStyle(container).getPropertyValue('--column-gap')) || 0;
    // The original right-hand slot used 80% of a 62% grid column. Keep its
    // physical size, expanding the camera leftwards instead of shrinking it.
    const primaryWidth = extended ? (width - columnGap) * 0.62 * 0.8 : width;
    const viewWidth = POSTER_WIDTH * width / primaryWidth;
    const viewHeight = POSTER_WIDTH * height / primaryWidth;
    const posterHeight = extended ? POSTER_WIDTH / 1.5 : viewHeight;
    if (Math.abs(posterHeight - compositionHeight) > 0.25 || extended !== compositionExtended) {
      buildComposition(posterHeight, extended);
    }
    camera.left = POSTER_WIDTH - viewWidth;
    camera.right = POSTER_WIDTH;
    camera.bottom = 0;
    camera.top = viewHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render();
  }

  function contextLost(event: Event) {
    event.preventDefault();
    lost = true;
    textMotion.pause();
    skyMotion.suspend();
    cancelAnimationFrame(pendingRender);
    pendingRender = 0;
    container.dataset.ready = 'false';
    onError('The graphics context was interrupted. Reload the page to restore the artwork.');
  }
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  const textMotion = createTextMotion(container, (distance) => {
    scrollUniform.value += distance;
    requestRender();
  }, { enabled: motion, inputTarget: motionTarget });
  const skyMotion = createSkyMotion(container, (seconds) => {
    skyUniforms.uSkyTime.value = seconds;
    requestRender();
  }, motion);

  async function exportPng(width = 2400) {
    if (disposed || lost) throw new Error('The artwork is unavailable. Reload the page and try again.');
    textMotion.pause();
    skyMotion.suspend();
    const previousRatio = renderer.getPixelRatio();
    const previousSize = renderer.getSize(new THREE.Vector2());
    try {
      renderer.setPixelRatio(1);
      renderer.setSize(width, Math.round(width * previousSize.y / previousSize.x), false);
      render();
      const blob = await new Promise<Blob>((resolve, reject) => {
        renderer.domElement.toBlob((result) => result ? resolve(result) : reject(new Error('PNG export failed.')), 'image/png');
      });
      return blob;
    } finally {
      renderer.setPixelRatio(previousRatio);
      renderer.setSize(previousSize.x, previousSize.y, false);
      render();
      if (!lost) skyMotion.resume();
    }
  }

  return {
    render, resize, exportPng,
    get frameCount() { return frameCount; },
    dispose() {
      if (disposed) return;
      disposed = true;
      textMotion.dispose();
      skyMotion.dispose();
      cancelAnimationFrame(pendingRender);
      observer.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      resources.forEach((resource) => resource.dispose());
      skyGeometry.dispose();
      skyMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
