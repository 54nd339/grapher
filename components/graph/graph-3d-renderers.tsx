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
import { ceCompile, ceCompileImplicitFromLatex, compileExpressionLatex, toPlainExpression } from "@/lib/math";

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
    const span = IMPLICIT_VIEW_MAX - IMPLICIT_VIEW_MIN;
    nextMesh.position.set(IMPLICIT_VIEW_MIN, IMPLICIT_VIEW_MIN, IMPLICIT_VIEW_MIN);
    nextMesh.scale.set(span, span, span);
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

      const fn = ceCompileImplicitFromLatex(latex) ?? (() => {
        const plain = toPlainExpression(latex, "none");
        if (!/=/.test(plain)) return null;
        const [lhs, rhs = "0"] = plain.split("=");
        if (!lhs.trim()) return null;
        return ceCompile(`(${lhs})-(${rhs})`);
      })();
      if (!fn) {
        toast.error("Failed to compile implicit 3D equation.", {
          id: `implicit3d-compile-${expressionId}`,
        });
        return;
      }

      const sampled = await sampleImplicitField(
        fn,
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
  return (
    <>
      <Text position={[6, 0, 0]} fontSize={0.4} color={color} anchorX="center" anchorY="middle">
        X
      </Text>
      <Text position={[0, 6, 0]} fontSize={0.4} color={color} anchorX="center" anchorY="middle">
        Y
      </Text>
      <Text position={[0, 0, 6]} fontSize={0.4} color={color} anchorX="center" anchorY="middle">
        Z
      </Text>
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
