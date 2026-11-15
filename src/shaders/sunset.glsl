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

// Broad, diagonal dry-brush passes overlap like the chalky stroke reference.
// Uneven pressure and ragged edges keep each pass hand-drawn.
// The pigment samples the existing sunset gradient; the paper stays white.
float skyBrushStrokes(vec2 point, float blueRegion, float cloudCoverage) {
  vec2 brush = vec2(dot(point, vec2(0.9063, 0.4226)), dot(point, vec2(-0.4226, 0.9063)));
  float tooth = skyGrain(point * vec2(0.92, 1.32));
  float fleck = skyGrain(point * 0.48 + vec2(48.3, 11.5));
  float roughEdge = (skyGrain(point * 0.18) - 0.5) * 7.0 + (tooth - 0.5) * 4.0;
  float bristles = skyGrain(brush * vec2(0.032, 0.58) + vec2(7.4, 15.1));
  float deposit = smoothstep(0.20, 0.83, tooth * 0.72 + fleck * 0.28);
  // A light, grainy first pass joins the strokes without blank paper islands.
  float paint = 0.18 * (0.40 + deposit * 0.60);

  // Sample overlapping ends as well as adjacent passes, with six bounded dabs.
  float row = floor(brush.y / 34.0);
  for (int neighbor = -1; neighbor <= 1; neighbor++) {
    float band = row + float(neighbor);
    float offset = skyGrainHash(vec2(band, 21.8)) * 260.0;
    float firstColumn = floor((brush.x + offset) / 260.0 - 0.5);
    for (int overlap = 0; overlap < 2; overlap++) {
      float column = firstColumn + float(overlap);
      vec2 seed = vec2(column, band);
      float variation = skyGrainHash(seed + vec2(3.2, 9.7));
      float radius = mix(27.0, 35.0, skyGrainHash(seed + 17.2));
      float halfLength = mix(134.0, 166.0, variation);
      vec2 local = brush - vec2((column + 0.5) * 260.0 - offset,
        (band + 0.5) * 34.0 + (variation - 0.5) * 6.0);
      local.y += local.x * (skyGrainHash(seed + 31.4) - 0.5) * 0.055;
      float edge = length(vec2(max(abs(local.x) - (halfLength - radius), 0.0), local.y)) - radius;
      float footprint = 1.0 - smoothstep(-2.5, 2.5, edge + roughEdge);
      float inkLoad = skyGrainHash(seed + 8.1);
      // Some passes carry more blue pigment, creating irregular darker patches
      // along the brushwork without deepening the warm sunset underneath.
      float pressure = mix(0.45, 0.62, inkLoad)
        + blueRegion * smoothstep(0.38, 0.78, inkLoad) * 0.24;
      float pigment = footprint * pressure * (0.48 + deposit * 0.52) * (0.82 + bristles * 0.18);
      paint = 1.0 - (1.0 - paint) * (1.0 - pigment);
    }
  }

  // More clouds, stretched into flat, broken banks rather than curled shapes.
  vec2 sweep = vec2(point.x, point.y + point.x * 0.012);
  float broad = skyGrain(sweep * vec2(0.005, 0.052) + vec2(3.2, 7.1));
  float broken = skyGrain(sweep * vec2(0.021, 0.043) + vec2(17.8, 2.4));
  float clouds = smoothstep(0.55, 0.78, broad * 0.88 + broken * 0.12);
  return paint * (1.0 - clouds * 0.50 * cloudCoverage);
}

// Share a broad, screen-space upper feather between the sky and building ink.
// Cropped towers and the Empire State spire dissolve into the page together.
float skylineTopFade(float down) {
  return pow(smoothstep(0.0, 0.30, down), 0.85);
}

// Sky samples from assets/inspo/97e829ce06133233f550935cd7b4652e.jpg.
// Warm accents are sampled from assets/inspo/sunset-warm-detail.png. The blue
// sky transitions through turquoise, cream and gold into a muted coral horizon.
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

  // Turquoise bridges the warm horizon and cool blue above across both halves.
  // Keep the highest sky blue and taper out before the warm sunset colors.
  vec3 turquoise = vec3(90.0, 174.0, 174.0) / 255.0;
  // Give the open left sky a longer blue-to-turquoise blend, tapering the
  // adjustment away across the central tower to preserve the right sky.
  float leftSky = 1.0 - smoothstep(0.30, 0.56, uv.x);
  vec2 turquoiseTransition = mix(vec2(0.20, 0.42), vec2(0.08, 0.50), leftSky);
  float turquoiseBand = smoothstep(turquoiseTransition.x, turquoiseTransition.y, horizon)
    * (1.0 - smoothstep(0.55, 0.74, horizon));
  sky = mix(sky, turquoise, turquoiseBand * 0.55);

  float sides = smoothstep(0.0, 0.12, uv.x) * (1.0 - smoothstep(0.88, 1.0, uv.x));
  float bottomFade = 1.0 - smoothstep(0.90, 1.0, down);
  // Retain more color through the feather while still arriving smoothly at
  // pure white at the boundary, without a hard rectangular edge.
  // Let the nearest upper/side edge control the feather. Multiplying both
  // washes out the corners and erases the brush texture before the boundary.
  float edgeFade = min(skylineTopFade(down), pow(sides, 0.85)) * pow(bottomFade, 0.85);
  // Fill the empty wedge above the lower west buildings, rather than pulling
  // the strongest color toward the densely occupied right-hand tower group.
  vec2 glow = (uv - vec2(mix(0.5, 0.38, uSkyExpanded), 0.55)) / vec2(0.86, 0.84);
  float atmosphere = exp(-dot(glow, glow) * 0.25);

  // The buildings retain their almost-white paper. Only the open sky receives
  // the brush texture and softly feathered cloud breaks in the pigment.
  if (surfaceStrength < 0.5) {
    return mix(vec3(1.0), sky, uSkyStrength * surfaceStrength * edgeFade * atmosphere);
  }
  float brushScale = clamp(uSkyViewport.x / 900.0, 0.65, 1.0);
  vec2 brushPoint = uv * uSkyViewport / brushScale;
  float blueRegion = 1.0 - smoothstep(0.48, 0.68, down);
  // Clear the upper-right cloud bank where it crowds the white edge feather.
  // Taper cloud density back in toward the center and lower sky, at any size.
  float upperRight = smoothstep(0.58, 0.80, uv.x)
    * (1.0 - smoothstep(0.22, 0.50, down));
  float paint = skyBrushStrokes(brushPoint, blueRegion, 1.0 - upperRight);

  // The pale gaps read as clouds, so give them reflected sunset light as well
  // as coloring the brush pigment. Warmth rises softly from the lower left;
  // the shared edge fade still brings the artwork cleanly back to white.
  float sunsetBounce = smoothstep(0.48, 0.84, down)
    * (1.0 - smoothstep(0.34, 0.68, uv.x));
  vec3 cloudLight = mix(cream, gold, smoothstep(0.53, 0.74, down));
  cloudLight = mix(cloudLight, apricot, smoothstep(0.70, 0.92, down) * 0.72);
  vec3 cloudPaper = mix(vec3(1.0), cloudLight, sunsetBounce * 0.34 * edgeFade * atmosphere);

  // A little of the existing moving grain lives inside the pigment, while
  // the brush strokes stay fixed. CSS coordinates preserve texture size on
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
