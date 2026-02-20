/**
 * GPU-accelerated 3D surface rendering.
 * Generates vertex/fragment shaders that displace a flat grid mesh
 * using a CE-compiled GLSL expression for z = f(x, y).
 */

import { ceCompileGLSLFromLatex } from "@/lib/math";

export interface SurfaceShaders {
  vertexShader: string;
  fragmentShader: string;
}

/**
 * Build a vertex/fragment shader pair for a z=f(x,y) surface.
 * Accepts raw LaTeX (e.g. "\\sin(x) \\cdot y") so that CE's LaTeX parser
 * correctly handles functions like \\log_{10}, \\sqrt[3]{x}, etc.
 *
 * Returns null if the expression cannot be compiled to GLSL.
 */
export function buildSurfaceShaders(
  latex: string,
  sliderUniforms: Record<string, number> = {},
): SurfaceShaders | null {
  const glsl = ceCompileGLSLFromLatex(latex);
  if (!glsl) return null;

  const uniformDecls = Object.keys(sliderUniforms)
    .map((k) => `uniform float ${k};`)
    .join("\n");

  const vertexShader = `
${glsl.preamble}
${uniformDecls}
uniform float u_zMin;
uniform float u_zMax;

varying float vHeight;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // position.x = math x, position.z = math y (Three.js Y-up convention)
  float x = position.x;
  float y = position.z;

  float z = ${glsl.code};
  if (isinf(z) || z != z) z = 0.0;

  vec3 displaced = vec3(position.x, z, position.z);

  // Normalized height for color mapping
  float range = u_zMax - u_zMin;
  vHeight = range > 0.0 ? (z - u_zMin) / range : 0.5;
  vNormal = normal;
  vPosition = displaced;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

  const fragmentShader = `
uniform float u_opacity;
uniform bool u_wireframe;

varying float vHeight;
varying vec3 vNormal;
varying vec3 vPosition;

// HSL to RGB for blue (240deg) -> red (0deg) gradient
vec3 heightToColor(float t) {
  float hue = (1.0 - clamp(t, 0.0, 1.0)) * 240.0;
  float s = 0.75;
  float l = 0.55;
  float c = (1.0 - abs(2.0 * l - 1.0)) * s;
  float x = c * (1.0 - abs(mod(hue / 60.0, 2.0) - 1.0));
  float m = l - c / 2.0;
  vec3 rgb;
  if (hue < 60.0) rgb = vec3(c, x, 0.0);
  else if (hue < 120.0) rgb = vec3(x, c, 0.0);
  else if (hue < 180.0) rgb = vec3(0.0, c, x);
  else if (hue < 240.0) rgb = vec3(0.0, x, c);
  else if (hue < 300.0) rgb = vec3(x, 0.0, c);
  else rgb = vec3(c, 0.0, x);
  return rgb + m;
}

void main() {
  vec3 baseColor = heightToColor(vHeight);

  // Simple lambertian shading
  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
  vec3 n = normalize(vNormal);
  float diff = max(dot(n, lightDir), 0.0);
  float ambient = 0.4;

  vec3 color = baseColor * (ambient + (1.0 - ambient) * diff);
  gl_FragColor = vec4(color, u_opacity);
}
`;

  return { vertexShader, fragmentShader };
}

/**
 * Pre-scan a surface mesh to find z-range for color normalization.
 * Evaluates the expression at a coarse grid using the JS path.
 */
export function estimateZRange(
  evalFn: ((scope: Record<string, number>) => number) | null,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  scope: Record<string, number> = {},
  samples = 20,
): [number, number] {
  if (!evalFn) return [-1, 1];

  let zMin = Infinity;
  let zMax = -Infinity;
  const dx = (xMax - xMin) / samples;
  const dy = (yMax - yMin) / samples;

  for (let i = 0; i <= samples; i++) {
    for (let j = 0; j <= samples; j++) {
      const x = xMin + i * dx;
      const y = yMin + j * dy;
      try {
        const z = evalFn({ ...scope, x, y });
        if (typeof z === "number" && isFinite(z)) {
          if (z < zMin) zMin = z;
          if (z > zMax) zMax = z;
        }
      } catch {
        /* skip */
      }
    }
  }

  if (!isFinite(zMin)) zMin = -1;
  if (!isFinite(zMax)) zMax = 1;
  if (zMin === zMax) { zMin -= 1; zMax += 1; }

  return [zMin, zMax];
}
