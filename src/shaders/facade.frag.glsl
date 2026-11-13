uniform sampler2D uType;
uniform float uInk;
uniform float uFadeStart;
uniform float uFadeEnd;
uniform float uFadePower;
uniform float uEdgeShade;
uniform float uRows;
uniform float uSeed;
uniform float uScroll;
uniform float uTypeWidth;
uniform float uMotionScale;
uniform bool uClipToPoster;
uniform float uClipMinX;
varying vec2 vUv;
varying vec2 vPoster;
varying float vInkFloor;

float hash(float value) {
  return fract(sin(value * 127.1 + uSeed * 311.7) * 43758.5453);
}

void main() {
  if (uClipToPoster && (vPoster.x < uClipMinX || vPoster.x > 1.0 || vPoster.y < 0.0 || vPoster.y > 1.0)) discard;
  float down = 1.0 - vUv.y;
  float row = floor(down * uRows);
  // Each entire row advances along its own wall plane. Slightly different
  // rates make the paragraphs feel alive without moving the building mesh.
  float rowSpeed = mix(0.65, 1.15, hash(row + 19.0));
  vec2 typeUv = vec2(vUv.x + uScroll * rowSpeed * uMotionScale / uTypeWidth, vUv.y);
  // Explicit original gradients prevent the row-to-row UV discontinuity from
  // blurring glyphs. Horizontal RepeatWrapping makes the lines continuous.
  float printedType = 1.0 - textureGrad(uType, typeUv, dFdx(vUv), dFdy(vUv)).r;

  // Preserve the hairline antenna at compact sizes. All broad building faces
  // have a zero floor and are described exclusively by the paragraph glyphs.
  float glyph = max(printedType, vInkFloor);
  float haze = 1.0 - smoothstep(uFadeStart, uFadeEnd, down);
  haze = pow(haze, uFadePower);

  // Slight, deterministic differences in ink between lines evoke printed type.
  // The buildings remain white paper with black type. A trace of sky color
  // unifies their overlapping faces while the open sky carries the full wash.
  float lineInk = mix(0.79, 1.0, hash(row));
  float edge = mix(1.0, 0.72 + 0.28 * vUv.x, uEdgeShade);
  float streetHaze = 1.0 - smoothstep(0.88, 0.986, vPoster.y);
  float ink = clamp(glyph * uInk * haze * lineInk * edge * streetHaze, 0.0, 1.0);
  gl_FragColor = vec4(sunsetPaper(0.10) * (1.0 - ink), 1.0);
}
