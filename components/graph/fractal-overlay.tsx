"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { toast } from "sonner";

import { FRACTAL_VERTEX, MANDELBROT_FRAGMENT, JULIA_FRAGMENT, createShaderProgram } from "@/lib/graph";

interface FractalOverlayProps {
  type: "mandelbrot" | "julia";
  juliaC?: [number, number];
  maxIter?: number;
  width: number;
  height: number;
}

/**
 * WebGL canvas overlay for GPU-rendered fractal sets.
 */
export function FractalOverlay({
  type,
  juliaC = [-0.7, 0.27015],
  maxIter = 2000,
  width,
  height,
}: FractalOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const [localViewport, setLocalViewport] = useState({
    xMin: -2.5, xMax: 1, yMin: -1.2, yMax: 1.2,
  });
  const webglErrorShownRef = useRef(false);

  // Fractal-specific pan/zoom
  const dragRef = useRef<{ startX: number; startY: number; vp: typeof localViewport } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      vp: { ...localViewport },
    };
  }, [localViewport]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current || width <= 0 || height <= 0) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const vp = dragRef.current.vp;
    const xRange = vp.xMax - vp.xMin;
    const yRange = vp.yMax - vp.yMin;
    setLocalViewport({
      xMin: vp.xMin - (dx / width) * xRange,
      xMax: vp.xMax - (dx / width) * xRange,
      yMin: vp.yMin + (dy / height) * yRange,
      yMax: vp.yMax + (dy / height) * yRange,
    });
  }, [width, height]);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left) / rect.width;
    const my = 1 - (e.clientY - rect.top) / rect.height;
    const cx = localViewport.xMin + mx * (localViewport.xMax - localViewport.xMin);
    const cy = localViewport.yMin + my * (localViewport.yMax - localViewport.yMin);
    setLocalViewport((vp) => ({
      xMin: cx + (vp.xMin - cx) * factor,
      xMax: cx + (vp.xMax - cx) * factor,
      yMin: cy + (vp.yMin - cy) * factor,
      yMax: cy + (vp.yMax - cy) * factor,
    }));
  }, [localViewport]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    if (!glRef.current) {
      const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: false });
      if (!gl) {
        if (!webglErrorShownRef.current) {
          toast.error("Fractal renderer is unavailable.", {
            description: "WebGL2 is not supported in this environment.",
          });
          webglErrorShownRef.current = true;
        }
        return;
      }
      glRef.current = gl;
    }

    const gl = glRef.current;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);

    if (!programRef.current) {
      const frag = type === "mandelbrot" ? MANDELBROT_FRAGMENT : JULIA_FRAGMENT;
      const prog = createShaderProgram(gl, FRACTAL_VERTEX, frag);
      if (!prog) {
        if (!webglErrorShownRef.current) {
          toast.error("Failed to initialize fractal shader.");
          webglErrorShownRef.current = true;
        }
        return;
      }
      programRef.current = prog;
    }

    const prog = programRef.current;
    gl.useProgram(prog);

    // Set uniforms
    const resLoc = gl.getUniformLocation(prog, "u_resolution");
    const vbLoc = gl.getUniformLocation(prog, "u_viewBox");
    const iterLoc = gl.getUniformLocation(prog, "u_maxIter");
    gl.uniform2f(resLoc, width, height);
    gl.uniform4f(vbLoc, localViewport.xMin, localViewport.yMin, localViewport.xMax, localViewport.yMax);
    gl.uniform1i(iterLoc, maxIter);

    if (type === "julia") {
      const cLoc = gl.getUniformLocation(prog, "u_c");
      gl.uniform2f(cLoc, juliaC[0], juliaC[1]);
    }

    // Draw fullscreen quad
    const posLoc = gl.getAttribLocation(prog, "a_position");
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.deleteBuffer(buf);
  }, [type, localViewport, juliaC, maxIter, width, height]);

  useEffect(() => {
    return () => {
      const gl = glRef.current;
      if (gl && programRef.current) {
        gl.deleteProgram(programRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ width, height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    />
  );
}
