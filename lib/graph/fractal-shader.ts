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

// Double-Single precision math for deep zoom
const DS_MATH = `
struct ds_float {
  float hi;
  float lo;
};

ds_float ds_set(float a) { return ds_float(a, 0.0); }

ds_float ds_add(ds_float a, ds_float b) {
  float s = a.hi + b.hi;
  float v = s - a.hi;
  float e = (a.hi - (s - v)) + (b.hi - v);
  float g = e + a.lo + b.lo;
  float zh = s + g;
  float zl = g - (zh - s);
  return ds_float(zh, zl);
}

ds_float ds_sub(ds_float a, ds_float b) {
  return ds_add(a, ds_float(-b.hi, -b.lo));
}

ds_float ds_mul(ds_float a, ds_float b) {
  float hi = a.hi * b.hi;
  float lo = a.hi * b.lo + a.lo * b.hi;
  float zh = hi + lo;
  float zl = lo - (zh - hi);
  return ds_float(zh, zl);
}

ds_float ds_mix(ds_float a, ds_float b, float t) {
  // mix(a, b, t) = a + t * (b - a)
  return ds_add(a, ds_mul(ds_set(t), ds_sub(b, a)));
}
`;

export const MANDELBROT_FRAGMENT = `#version 300 es
precision highp float;
${DS_MATH}

uniform vec2 u_resolution;
uniform vec4 u_viewBoxHi; // [xMin, yMin, xMax, yMax] hi parts
uniform vec4 u_viewBoxLo; // [xMin, yMin, xMax, yMax] lo parts
uniform int u_maxIter;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  
  ds_float xMin = ds_float(u_viewBoxHi.x, u_viewBoxLo.x);
  ds_float yMin = ds_float(u_viewBoxHi.y, u_viewBoxLo.y);
  ds_float xMax = ds_float(u_viewBoxHi.z, u_viewBoxLo.z);
  ds_float yMax = ds_float(u_viewBoxHi.w, u_viewBoxLo.w);

  ds_float x0 = ds_mix(xMin, xMax, uv.x);
  ds_float y0 = ds_mix(yMin, yMax, uv.y);

  ds_float x = ds_set(0.0);
  ds_float y = ds_set(0.0);
  int iter = 0;
  
  for (int i = 0; i < 1000; i++) {
    if (i >= u_maxIter) break;
    
    // x*x + y*y > 4.0
    ds_float x2 = ds_mul(x, x);
    ds_float y2 = ds_mul(y, y);
    if (x2.hi + y2.hi > 4.0) break;
    
    // xn = x*x - y*y + x0
    ds_float xn = ds_add(ds_sub(x2, y2), x0);
    // y = 2.0*x*y + y0
    y = ds_add(ds_mul(ds_set(2.0), ds_mul(x, y)), y0);
    x = xn;
    iter = i + 1;
  }

  if (iter >= u_maxIter) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    float mag2 = x.hi * x.hi + y.hi * y.hi;
    float t = float(iter) - log2(log2(max(mag2, 1e-10)));
    float norm = clamp(t / float(u_maxIter), 0.0, 1.0);
    vec3 col = 0.5 + 0.5 * cos(6.28318 * (norm + vec3(0.0, 0.33, 0.67)));
    fragColor = vec4(col, 1.0);
  }
}
`;

export const JULIA_FRAGMENT = `#version 300 es
precision highp float;
${DS_MATH}

uniform vec2 u_resolution;
uniform vec4 u_viewBoxHi;
uniform vec4 u_viewBoxLo;
uniform vec2 u_cHi;
uniform vec2 u_cLo;
uniform int u_maxIter;

out vec4 fragColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  
  ds_float xMin = ds_float(u_viewBoxHi.x, u_viewBoxLo.x);
  ds_float yMin = ds_float(u_viewBoxHi.y, u_viewBoxLo.y);
  ds_float xMax = ds_float(u_viewBoxHi.z, u_viewBoxLo.z);
  ds_float yMax = ds_float(u_viewBoxHi.w, u_viewBoxLo.w);

  ds_float x = ds_mix(xMin, xMax, uv.x);
  ds_float y = ds_mix(yMin, yMax, uv.y);
  ds_float cx = ds_float(u_cHi.x, u_cLo.x);
  ds_float cy = ds_float(u_cHi.y, u_cLo.y);

  int iter = 0;
  for (int i = 0; i < 1000; i++) {
    if (i >= u_maxIter) break;
    
    ds_float x2 = ds_mul(x, x);
    ds_float y2 = ds_mul(y, y);
    if (x2.hi + y2.hi > 4.0) break;
    
    ds_float xn = ds_add(ds_sub(x2, y2), cx);
    y = ds_add(ds_mul(ds_set(2.0), ds_mul(x, y)), cy);
    x = xn;
    iter = i + 1;
  }

  if (iter >= u_maxIter) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    float mag2 = x.hi * x.hi + y.hi * y.hi;
    float t = float(iter) - log2(log2(max(mag2, 1e-10)));
    float norm = clamp(t / float(u_maxIter), 0.0, 1.0);
    vec3 col = 0.5 + 0.5 * cos(6.28318 * (norm + vec3(0.0, 0.33, 0.67)));
    fragColor = vec4(col, 1.0);
  }
}
`;
