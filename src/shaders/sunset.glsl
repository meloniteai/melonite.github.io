uniform vec2 uSkyResolution;
uniform vec2 uSkyViewport;
uniform float uSkyStrength;
uniform float uSkyExpanded;
uniform float uSkyTime;

float skyGrainHash(vec2 cell) {
  return fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
}

// Interpolate neighboring grains so drifting remains smooth at subpixel speeds.
float skyGrain(vec2 point) {
  vec2 cell = floor(point);
  vec2 blend = fract(point);
  blend = blend * blend * (3.0 - 2.0 * blend);
  return mix(
    mix(skyGrainHash(cell), skyGrainHash(cell + vec2(1.0, 0.0)), blend.x),
    mix(skyGrainHash(cell + vec2(0.0, 1.0)), skyGrainHash(cell + vec2(1.0)), blend.x),
    blend.y
  );
}

// Sky samples from assets/inspo/97e829ce06133233f550935cd7b4652e.jpg.
// Warm accents are sampled from assets/inspo/sunset-warm-detail.png. The blue
// sky transitions through cream and gold into apricot and a muted coral horizon.
// Facade paper uses a weaker tint to keep the city white.
vec3 sunsetPaper(float surfaceStrength) {
  vec2 uv = clamp(gl_FragCoord.xy / uSkyResolution, 0.0, 1.0);
  float down = 1.0 - uv.y;
  vec3 upperBlue = vec3(103.0, 128.0, 188.0) / 255.0;
  vec3 middleBlue = vec3(132.0, 156.0, 208.0) / 255.0;
  vec3 paleBlue = vec3(173.0, 188.0, 220.0) / 255.0;
  vec3 blueHaze = vec3(202.0, 204.0, 212.0) / 255.0;
  vec3 cream = vec3(255.0, 232.0, 197.0) / 255.0;
  vec3 gold = vec3(255.0, 226.0, 162.0) / 255.0;
  vec3 apricot = vec3(250.0, 176.0, 129.0) / 255.0;
  vec3 coral = vec3(198.0, 150.0, 131.0) / 255.0;

  // The reference is slightly warmer toward the right, with a long, gradual
  // blue-to-pale-blue transition instead of broad pink bands in mid-sky.
  float horizon = clamp(down + 0.035 * (uv.x - 0.5), 0.0, 1.0);
  vec3 sky = mix(upperBlue, middleBlue, smoothstep(0.03, 0.43, horizon));
  sky = mix(sky, paleBlue, smoothstep(0.40, 0.65, horizon));
  sky = mix(sky, blueHaze, smoothstep(0.60, 0.72, horizon));
  sky = mix(sky, cream, smoothstep(0.64, 0.77, horizon));
  sky = mix(sky, gold, smoothstep(0.73, 0.84, horizon));
  sky = mix(sky, apricot, smoothstep(0.80, 0.91, horizon));
  sky = mix(sky, coral, smoothstep(0.89, 0.98, horizon));

  float sides = smoothstep(0.0, 0.12, uv.x) * (1.0 - smoothstep(0.88, 1.0, uv.x));
  // Begin fading farther below the top so the blue reaches white gradually
  // instead of forming a narrow, visibly horizontal band. Side fades stay put.
  float topFade = smoothstep(0.0, 0.30, down);
  float ends = topFade * (1.0 - smoothstep(0.90, 1.0, down));
  // Retain more color through the feather while still arriving smoothly at
  // pure white at the boundary, without a hard rectangular edge.
  float edgeFade = pow(sides * ends, 0.85);
  // Fill the empty wedge above the lower west buildings, rather than pulling
  // the strongest color toward the densely occupied right-hand tower group.
  vec2 glow = (uv - vec2(mix(0.5, 0.38, uSkyExpanded), 0.55)) / vec2(0.86, 0.84);
  float atmosphere = exp(-dot(glow, glow) * 0.25);

  vec3 paper = mix(vec3(1.0), sky, uSkyStrength * surfaceStrength * edgeFade * atmosphere);

  // Keep the facades clean. Two fine grain layers drift at different speeds
  // through the open sky, independently of pointer input and text scrolling.
  if (surfaceStrength < 0.5) return paper;
  vec2 grainPoint = uv * uSkyViewport;
  float driftTime = uSkyTime * 1.25;
  float nearGrain = skyGrain(grainPoint / 0.8 + driftTime * vec2(1.4, 0.35));
  float farGrain = skyGrain(grainPoint / 1.35 + driftTime * vec2(0.33, -0.18) + vec2(73.1, 19.7));
  // Restore fine-grain contrast after interpolation without increasing opacity.
  float grain = clamp((mix(nearGrain, farGrain, 0.22) - 0.5) * 1.8 + 0.5, 0.0, 1.0);
  grain *= grain;
  return mix(paper, vec3(1.0), grain * 0.184 * edgeFade);
}
