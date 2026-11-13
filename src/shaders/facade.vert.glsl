uniform vec2 uAnchor;
uniform float uPosterHeight;
uniform float uShear;
attribute float inkFloor;
varying vec2 vUv;
varying vec2 vPoster;
varying float vInkFloor;

void main() {
  vUv = uv;
  vInkFloor = inkFloor;
  vec3 p = (modelMatrix * vec4(position, 1.0)).xyz;

  // Architectural oblique projection: verticals remain parallel, while
  // perpendicular walls recede in opposite directions. No time or motion.
  vec2 projected = uAnchor + vec2(p.x + p.z, p.y + uShear * (p.x - p.z));
  vPoster = vec2(projected.x / 1000.0, projected.y / uPosterHeight);
  gl_Position = projectionMatrix * viewMatrix *
    vec4(projected.x, uPosterHeight - projected.y, 0.0, 1.0);
}
