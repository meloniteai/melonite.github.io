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

// Lithographic crayon catches the tooth of the stone/paper. Broad, overlapping
// sweeps establish the tone; a few flat streaks interrupt the open evening sky.
// All pigment is procedural, with no photograph or repeating bitmap texture.
float skyLithograph(vec2 point) {
  vec2 sweep = point;
  // A gentle, straight slant keeps the clouds level without curling their
  // silhouettes. Stretch the grain horizontally into broken evening streaks.
  sweep.y += point.x * 0.012;
  float broad = skyGrain(sweep * vec2(0.005, 0.060) + vec2(3.2, 7.1));
  float scumble = skyGrain(sweep * vec2(0.021, 0.043) + vec2(17.8, 2.4));
  float small = skyGrain(sweep * vec2(0.055, 0.080) + vec2(8.4, 31.2));
  // Reserve pale cloud breaks for rare peaks, stretched into shallow streaks.
  // Steadier crayon pressure keeps the rest of the sunset open and unclouded;
  // the fine paper tooth still breaks up the pigment throughout the sky.
  float wisps = smoothstep(0.64, 0.84, broad * 0.88 + scumble * 0.12);
  float pressure = (0.56 + scumble * 0.08 + small * 0.04) * (1.0 - wisps * 0.72);

  // Fine, static granulation breaks the pigment at the scale of paper fibers.
  // Heavier pressure fills more of those hollows, just as a soft crayon does.
  float tooth = skyGrain(point * 1.45);
  float fleck = skyGrain(point * 0.54 + vec2(48.3, 11.5));
  float deposit = smoothstep(0.22, 0.78, tooth * 0.72 + fleck * 0.28 + pressure * 0.19);

  // Sparse engraved-looking lines follow the same straight sweep. Derivatives
  // keep the fine lines from aliasing at different pixel ratios/export sizes.
  float line = sweep.y / 3.5 + skyGrain(point * 0.014) * 0.12;
  float distanceToLine = abs(fract(line) - 0.5);
  float aa = max(fwidth(line), 0.035);
  float hatch = 1.0 - smoothstep(0.075 - aa, 0.075 + aa, distanceToLine);
  float hatchPatch = smoothstep(0.48, 0.73, scumble) * smoothstep(0.25, 0.6, small);
  return pressure * (0.38 + deposit * 0.62) + hatch * hatchPatch * 0.14;
}

// Share a broad, screen-space upper feather between the sky and building ink.
// Cropped towers and the Empire State spire dissolve into the page together.
float skylineTopFade(float down) {
  return pow(smoothstep(0.0, 0.30, down), 0.85);
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
  float bottomFade = 1.0 - smoothstep(0.90, 1.0, down);
  // Retain more color through the feather while still arriving smoothly at
  // pure white at the boundary, without a hard rectangular edge.
  float edgeFade = skylineTopFade(down) * pow(sides * bottomFade, 0.85);
  // Fill the empty wedge above the lower west buildings, rather than pulling
  // the strongest color toward the densely occupied right-hand tower group.
  vec2 glow = (uv - vec2(mix(0.5, 0.38, uSkyExpanded), 0.55)) / vec2(0.86, 0.84);
  float atmosphere = exp(-dot(glow, glow) * 0.25);

  // The buildings retain their almost-white paper. Only the open sky receives
  // the crayon texture and softly feathered gaps in the pigment.
  if (surfaceStrength < 0.5) {
    return mix(vec3(1.0), sky, uSkyStrength * surfaceStrength * edgeFade * atmosphere);
  }
  float brushScale = clamp(uSkyViewport.x / 900.0, 0.65, 1.0);
  vec2 brushPoint = uv * uSkyViewport / brushScale;
  float paint = skyLithograph(brushPoint);

  // The pale gaps read as clouds, so give them reflected sunset light as well
  // as coloring the crayon pigment. Warmth rises softly from the lower left;
  // the shared edge fade still brings the artwork cleanly back to white.
  float sunsetBounce = smoothstep(0.48, 0.84, down)
    * (1.0 - smoothstep(0.34, 0.68, uv.x));
  vec3 cloudLight = mix(cream, gold, smoothstep(0.53, 0.74, down));
  cloudLight = mix(cloudLight, apricot, smoothstep(0.70, 0.92, down) * 0.72);
  vec3 cloudPaper = mix(vec3(1.0), cloudLight, sunsetBounce * 0.34 * edgeFade * atmosphere);

  // A little of the existing moving grain lives inside the pigment, while
  // the crayon shading stays fixed. CSS coordinates preserve texture size on
  // Retina displays and in high-resolution PNG exports.
  vec2 grainPoint = uv * uSkyViewport;
  float driftTime = uSkyTime * 1.25;
  float nearGrain = skyGrain(grainPoint / 0.8 + driftTime * vec2(1.4, 0.35));
  float farGrain = skyGrain(grainPoint / 1.35 + driftTime * vec2(0.33, -0.18) + vec2(73.1, 19.7));
  // Restore fine-grain contrast after interpolation without increasing opacity.
  float grain = clamp((mix(nearGrain, farGrain, 0.22) - 0.5) * 1.8 + 0.5, 0.0, 1.0);
  paint *= 1.0 - grain * grain * 0.10;
  return mix(cloudPaper, sky, clamp(paint * uSkyStrength * 1.65, 0.0, 0.78) * edgeFade * atmosphere);
}
