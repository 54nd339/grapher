export function is3DSupported(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;

  const canvas = document.createElement("canvas");
  const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | WebGL2RenderingContext | null;
  if (!gl) return false;

  const ext = gl.getExtension("WEBGL_debug_renderer_info") as {
    UNMASKED_RENDERER_WEBGL: number;
  } | null;

  if (!ext) return true;

  const renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? "").toLowerCase();
  if (!renderer) return true;

  const softwareRenderer = /(swiftshader|llvmpipe|software|softpipe|mesa offscreen)/.test(renderer);
  return !softwareRenderer;
}
