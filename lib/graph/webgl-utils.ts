/**
 * Minimal WebGL2 helpers for shader-based graph rendering.
 * Manages program compilation, uniform setting, and fullscreen quad drawing.
 */

// Per-context shader program cache keyed on fragment source hash.
// Avoids recompilation on pan/zoom when only uniforms change.
const programCache = new WeakMap<WebGL2RenderingContext, Map<string, WebGLProgram>>();

function getCacheMap(gl: WebGL2RenderingContext): Map<string, WebGLProgram> {
  let map = programCache.get(gl);
  if (!map) {
    map = new Map();
    programCache.set(gl, map);
  }
  return map;
}

export function createShaderProgram(
  gl: WebGL2RenderingContext,
  vertSrc: string,
  fragSrc: string,
): WebGLProgram | null {
  const cache = getCacheMap(gl);
  const key = fragSrc;
  const cached = cache.get(key);
  if (cached) return cached;

  const vs = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return null;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn("WebGL program link failed:", gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }

  gl.deleteShader(vs);
  gl.deleteShader(fs);
  cache.set(key, prog);
  return prog;
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(
      "WebGL shader compile failed:",
      gl.getShaderInfoLog(shader),
      "\nSource:",
      source.split("\n").map((l, i) => `${i + 1}: ${l}`).join("\n"),
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

const quadVAOs = new WeakMap<WebGL2RenderingContext, WebGLVertexArrayObject>();

/**
 * Draw a fullscreen quad covering clip space [-1,1].
 * Lazily creates and caches the VAO per GL context.
 */
export function drawFullscreenQuad(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
): void {
  let vao = quadVAOs.get(gl);
  if (!vao) {
    vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const loc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    quadVAOs.set(gl, vao);
  }

  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.bindVertexArray(null);
}

/**
 * Set a uniform by name. Auto-detects type from value.
 */
export function setUniform(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
  value: number | [number, number] | [number, number, number] | [number, number, number, number],
): void {
  const loc = gl.getUniformLocation(program, name);
  if (!loc) return;

  if (typeof value === "number") {
    gl.uniform1f(loc, value);
  } else if (value.length === 2) {
    gl.uniform2f(loc, value[0], value[1]);
  } else if (value.length === 3) {
    gl.uniform3f(loc, value[0], value[1], value[2]);
  } else {
    gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
  }
}
