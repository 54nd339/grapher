"use client";

import { useEffect, useRef } from "react";

import { useGraphStore } from "@/stores";

interface PolarGridOverlayProps {
  width: number;
  height: number;
}

/**
 * Canvas overlay that renders a polar coordinate grid.
 * Uses concentric circles and radial lines centered at origin.
 */
export function PolarGridOverlay({ width, height }: PolarGridOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewport = useGraphStore((s) => s.viewport);
  const polarGrid = useGraphStore((s) => s.polarGrid);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !polarGrid || width <= 0 || height <= 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    const { xMin, xMax, yMin, yMax } = viewport;

    // Transform math coords to pixel coords
    const toX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toY = (y: number) => ((yMax - y) / (yMax - yMin)) * height;

    const cx = toX(0);
    const cy = toY(0);

    // Radial step based on viewport range
    const maxR = Math.max(
      Math.abs(xMin), Math.abs(xMax),
      Math.abs(yMin), Math.abs(yMax),
    );
    const radiusStep = Math.pow(10, Math.floor(Math.log10(maxR / 2)));
    const pixelsPerUnit = width / (xMax - xMin);

    ctx.strokeStyle = "rgba(128, 128, 128, 0.15)";
    ctx.lineWidth = 1;

    // Draw concentric circles
    for (let r = radiusStep; r <= maxR * 2; r += radiusStep) {
      const pixelR = r * pixelsPerUnit;
      ctx.beginPath();
      ctx.arc(cx, cy, pixelR, 0, Math.PI * 2);
      ctx.stroke();

      // Label
      ctx.fillStyle = "rgba(128, 128, 128, 0.5)";
      ctx.font = "10px sans-serif";
      ctx.fillText(r.toString(), cx + pixelR + 2, cy - 2);
    }

    // Draw radial lines every 30°
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const endR = maxR * 3 * pixelsPerUnit;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + endR * Math.cos(rad), cy - endR * Math.sin(rad));
      ctx.stroke();
    }
  }, [viewport, polarGrid, width, height]);

  if (!polarGrid) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0"
      style={{ width, height }}
    />
  );
}
