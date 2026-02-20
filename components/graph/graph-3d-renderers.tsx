"use client";

import { useMemo, useRef, useCallback, useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { toast } from "sonner";
import * as THREE from "three";
import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js";

import {
  generateSurfaceData,
  generateCurveData,
  buildSurfaceShaders,
  estimateZRange,
  sampleImplicitField,
} from "@/lib/graph";
import {
  GPU_GRID_SIZE,
  IMPLICIT_MC_RESOLUTION,
  IMPLICIT_VIEW_MIN,
  IMPLICIT_VIEW_MAX,
  IMPLICIT_MAX_POLYGONS,
} from "@/lib/constants";
import { compileExpressionLatex, toPlainExpression } from "@/lib/math";

/* ── GPU Surface (vertex-shader displacement) ────────── */

export function GPUSurface({
  expressionId,
  latex,
  wireframe,
  scope,
}: {
  expressionId: string;
  latex: string;
  wireframe: boolean;
  scope: Record<string, number>;
}) {
  const surfaceLatex = useMemo(() => toPlainExpression(latex, "auto"), [latex]);

  const shaders = useMemo(() => buildSurfaceShaders(surfaceLatex, scope), [surfaceLatex, scope]);

  const evalFn = useMemo(
    () => compileExpressionLatex(latex, { mode: "auto" }),
    [latex],
  );
  const [zMin, zMax] = useMemo(
    () => estimateZRange(evalFn, -5, 5, -5, 5, scope),
    [evalFn, scope],
  );

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(10, 10, GPU_GRID_SIZE, GPU_GRID_SIZE);
    geo.rotateX(-Math.PI / 2);
    geo.computeVertexNormals();
    return geo;
  }, []);

  useEffect(() => {
    return () => { geometry.dispose(); };
  }, [geometry]);

  const uniforms = useMemo(() => {
    const u: Record<string, THREE.IUniform> = {
      u_zMin: { value: zMin },
      u_zMax: { value: zMax },
      u_opacity: { value: 0.85 },
      u_wireframe: { value: wireframe },
    };
    for (const [k, v] of Object.entries(scope)) {
      u[k] = { value: v };
    }
    return u;
  }, [zMin, zMax, wireframe, scope]);

  if (!shaders) {
    return (
      <CPUSurface
        expressionId={expressionId}
        latex={latex}
        wireframe={wireframe}
        scope={scope}
      />
    );
  }

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        vertexShader={shaders.vertexShader}
        fragmentShader={shaders.fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        transparent
        wireframe={wireframe}
      />
    </mesh>
  );
}

/* ── CPU Surface fallback (vertex-colored) ───────────── */

export function CPUSurface({
  expressionId,
  latex,
  wireframe,
  scope,
}: {
  expressionId: string;
  latex: string;
  wireframe: boolean;
  scope: Record<string, number>;
}) {
  const data = useMemo(
    () => generateSurfaceData(latex, -5, 5, -5, 5, undefined, scope),
    [latex, scope],
  );

  const geometry = useMemo(() => {
    if (!data) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(data.colors, 3));
    geo.setIndex(new THREE.BufferAttribute(data.indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, [data]);

  useEffect(() => {
    return () => { geometry?.dispose(); };
  }, [geometry]);

  useEffect(() => {
    if (data !== null) return;
    toast.error("Failed to render 3D surface for this expression.", {
      id: `surface3d-fail-${expressionId}`,
    });
  }, [data, expressionId]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        transparent
        opacity={0.85}
        wireframe={wireframe}
      />
    </mesh>
  );
}

/* ── Parametric 3D curve ─────────────────────────────── */

export function Curve3D({ latex, color, scope }: { latex: string; color: string; scope: Record<string, number> }) {
  const data = useMemo(() => generateCurveData(latex, undefined, undefined, undefined, scope), [latex, scope]);

  const lineObj = useMemo(() => {
    if (!data) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    const mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
    return new THREE.Line(geo, mat);
  }, [data, color]);

  useEffect(() => {
    return () => {
      if (!lineObj) return;
      lineObj.geometry.dispose();
      (lineObj.material as THREE.Material).dispose();
    };
  }, [lineObj]);

  if (!lineObj) return null;

  return <primitive object={lineObj} />;
}

/* ── Implicit surface via marching cubes ─────────────── */

export function ImplicitMarchingCubes3D({
  expressionId,
  latex,
  color,
  wireframe,
  scope,
}: {
  expressionId: string;
  latex: string;
  color: string;
  wireframe: boolean;
  scope: Record<string, number>;
}) {
  const [meshNode, setMeshNode] = useState<MarchingCubes | null>(null);
  const meshRef = useRef<MarchingCubes | null>(null);

  useEffect(() => {
    const material = new THREE.MeshStandardMaterial({
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });

    const nextMesh = new MarchingCubes(
      IMPLICIT_MC_RESOLUTION,
      material,
      false,
      false,
      IMPLICIT_MAX_POLYGONS,
    );

    nextMesh.isolation = 0;
    const span = IMPLICIT_VIEW_MAX - IMPLICIT_VIEW_MIN; // 10
    // MarchingCubes geometry natively generates coordinates in [-1, 1].
    // To map [-1, 1] back to [-5, 5] (which is IMPLICIT_VIEW_MIN to MAX),
    // we just scale by (span / 2) because 1 * 5 = 5, -1 * 5 = -5.
    // However, MarchingCubes grid spans from 0 to resolution-1, mapping to [-1 + 1/N, 1 - 1/N].
    // A scale of span/2 centers the object near (0,0,0), but the grid is slightly off-center
    // since it spans [-1, 1 - 2/N]. We add a translation T = halfSpan / (N-1) to perfectly snap it.
    const halfSpan = span / 2;
    const T = halfSpan / (IMPLICIT_MC_RESOLUTION - 1);
    nextMesh.position.set(T, T, T);
    // Apply scale multiplier with sub-cell adjustment to perfectly bound 0 to N-1 against world unit max.
    // MarchingCubes uses size-1 cells, so we scale by halfSpan * (N / (N-1))
    const scale = halfSpan * (IMPLICIT_MC_RESOLUTION / (IMPLICIT_MC_RESOLUTION - 1));
    nextMesh.scale.set(scale, scale, scale);
    meshRef.current = nextMesh;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- exposing created three object to JSX render tree
    setMeshNode(nextMesh);

    return () => {
      nextMesh.geometry.dispose();
      material.dispose();
      meshRef.current = null;
      setMeshNode(null);
    };
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const material = mesh.material as THREE.MeshStandardMaterial;
    material.color.set(color);
    material.wireframe = wireframe;
    material.needsUpdate = true;
  }, [meshNode, color, wireframe]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    let cancelled = false;
    const abortController = new AbortController();

    const build = async () => {
      const field = mesh.field;
      field.fill(Number.NaN);

      const sampled = await sampleImplicitField(
        latex,
        scope,
        IMPLICIT_MC_RESOLUTION,
        abortController.signal,
      );
      if (cancelled || abortController.signal.aborted) {
        return;
      }
      if (!sampled) {
        toast.error("Failed to evaluate implicit 3D field.", {
          id: `implicit3d-eval-${expressionId}`,
        });
        return;
      }

      if (sampled.timedOut) {
        toast.error("3D implicit surface sampling timed out. Try simplifying or zooming in.", {
          id: `implicit3d-timeout-${expressionId}`,
        });
        return;
      }

      field.set(sampled.field);

      mesh.isolation = 0;
      mesh.enableUvs = false;
      mesh.enableColors = false;
      mesh.update();

      if (mesh.count >= IMPLICIT_MAX_POLYGONS * 3) {
        toast.error("3D implicit mesh hit polygon budget. Reduce complexity or resolution.", {
          id: `implicit3d-polycap-${expressionId}`,
        });
      }
    };

    build().catch(() => {
      toast.error("Failed to render implicit 3D surface.", {
        id: `implicit3d-fail-${expressionId}`,
      });
    });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [meshNode, expressionId, latex, scope]);

  if (!meshNode) return null;
  return <primitive object={meshNode} />;
}

/* ── Axis labels ────────────────────────────────────── */

export function AxisLabels({ color }: { color: string }) {
  // We map Three.js X => Math X, Three.js Y => Math Z, Three.js Z => Math Y
  const labels: React.ReactNode[] = [];
  for (let i = -5; i <= 5; i++) {
    if (i === 0) continue;
    // Math X (Three.js X)
    labels.push(
      <Text key={`x-${i}`} position={[i, -0.4, 0]} fontSize={0.2} color={color} anchorX="center" anchorY="top">
        {i}
      </Text>
    );
    // Math Y (Three.js Z)
    labels.push(
      <Text key={`y-${i}`} position={[0, -0.4, i]} fontSize={0.2} color={color} anchorX="center" anchorY="top">
        {i}
      </Text>
    );
    // Math Z (Three.js Y)
    labels.push(
      <Text key={`z-${i}`} position={[-0.4, i, 0]} fontSize={0.2} color={color} anchorX="right" anchorY="middle">
        {i}
      </Text>
    );
  }

  return (
    <>
      <Text position={[6, 0, 0]} fontSize={0.4} color={color} anchorX="center" anchorY="middle">
        X
      </Text>
      <Text position={[0, 0, 6]} fontSize={0.4} color={color} anchorX="center" anchorY="middle">
        Y
      </Text>
      <Text position={[0, 6, 0]} fontSize={0.4} color={color} anchorX="center" anchorY="middle">
        Z
      </Text>
      {labels}
    </>
  );
}

/* ── Screenshot helper (must be inside Canvas tree) ── */

export function ScreenshotHelper({
  triggerRef,
}: {
  triggerRef: React.MutableRefObject<(() => void) | null>;
}) {
  const { gl } = useThree();

  const capture = useCallback(() => {
    const dataUrl = gl.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "grapher-3d.png";
    a.click();
  }, [gl]);

  useEffect(() => {
    triggerRef.current = capture;
    return () => { triggerRef.current = null; };
  }, [triggerRef, capture]);

  return null;
}
