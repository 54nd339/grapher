/**
 * WebGL shaders for Mandelbrot and Julia set rendering.
 * GPU-accelerated fractal rendering at pixel-level precision with smooth coloring.
 */

export const FRACTAL_VERTEX = `#version 300 es
precision highp float;
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const MANDELBROT_FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform vec4 u_viewBox;
uniform int u_maxIter;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float x0 = mix(u_viewBox.x, u_viewBox.z, uv.x);
  float y0 = mix(u_viewBox.y, u_viewBox.w, uv.y);

  float x = 0.0, y = 0.0;
  int iter = 0;
  for (int i = 0; i < 1000; i++) {
    if (i >= u_maxIter) break;
    if (x*x + y*y > 4.0) break;
    float xn = x*x - y*y + x0;
    y = 2.0*x*y + y0;
    x = xn;
    iter = i + 1;
  }

  if (iter >= u_maxIter) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    // Smooth coloring
    float t = float(iter) - log2(log2(x*x + y*y));
    t = t / float(u_maxIter);
    vec3 col = 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
    fragColor = vec4(col, 1.0);
  }
}
`;

export const JULIA_FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform vec4 u_viewBox;
uniform vec2 u_c;
uniform int u_maxIter;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float x = mix(u_viewBox.x, u_viewBox.z, uv.x);
  float y = mix(u_viewBox.y, u_viewBox.w, uv.y);

  int iter = 0;
  for (int i = 0; i < 1000; i++) {
    if (i >= u_maxIter) break;
    if (x*x + y*y > 4.0) break;
    float xn = x*x - y*y + u_c.x;
    y = 2.0*x*y + u_c.y;
    x = xn;
    iter = i + 1;
  }

  if (iter >= u_maxIter) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    float t = float(iter) - log2(log2(x*x + y*y));
    t = t / float(u_maxIter);
    vec3 col = 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67)));
    fragColor = vec4(col, 1.0);
  }
}
`;
