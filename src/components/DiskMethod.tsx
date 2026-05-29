'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { parseFunction, evaluateAt } from '@/lib/math';
import { buildSolidOfRevolutionGeometry, buildShadedRegionGeometry } from '@/lib/geometry';
import { useSimulationStore } from '@/store/useSimulationStore';
import type { EvalFunction } from 'mathjs';

interface DiskMethodProps {
  visible: boolean;
}

export default function DiskMethod({ visible }: DiskMethodProps) {
  const { expression, boundsA, boundsB, displayMode, revolutionAngle } = useSimulationStore();
  const meshRef = useRef<THREE.Mesh>(null);

  const fn = useMemo(() => parseFunction(expression), [expression]);

  const geometry = useMemo(() => {
    if (!fn || !visible) return null;
    return buildSolidOfRevolutionGeometry(fn, boundsA, boundsB, 120, 80, revolutionAngle);
  }, [fn, boundsA, boundsB, visible, revolutionAngle]);

  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.06 + Math.sin(Date.now() * 0.001) * 0.03;
    }
  });

  if (!fn || !geometry || !visible) return null;

  const isTransparent = displayMode === 'transparent';
  const isWireframe   = displayMode === 'wireframe';
  const isSolid       = displayMode === 'solid';
  // Partial when angle is meaningfully less than a full turn
  const isPartial = revolutionAngle < 2 * Math.PI - 0.05;

  return (
    <group>
      {/* Main solid of revolution — vertex colours give the cyan→violet gradient */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          emissive={new THREE.Color(0.06, 0.03, 0.18)}
          emissiveIntensity={0.06}
          roughness={isWireframe ? 0.9 : 0.28}
          metalness={isSolid ? 0.38 : 0.1}
          transparent={isTransparent || isWireframe}
          opacity={isTransparent ? 0.52 : isWireframe ? 0.14 : 1.0}
          wireframe={isWireframe}
          side={isPartial || isTransparent ? THREE.DoubleSide : THREE.FrontSide}
          depthWrite={!isTransparent && !isWireframe}
        />
      </mesh>

      {/* ── Partial-revolution cut faces ── */}
      {isPartial && (
        <>
          {/* Face at angle = 0 (the starting cut plane in the XY plane) */}
          <CutFace fn={fn} a={boundsA} b={boundsB} angle={0} />
          {/* Face at the current revolution angle */}
          <CutFace fn={fn} a={boundsA} b={boundsB} angle={revolutionAngle} />
          {/* Bright edge line at the cut */}
          <CutEdge fn={fn} a={boundsA} b={boundsB} angle={revolutionAngle} />
        </>
      )}

      {/* ── Full-solid end caps at x = a and x = b ── */}
      {!isPartial && isSolid && (
        <>
          <EndCap fn={fn} x={boundsA} />
          <EndCap fn={fn} x={boundsB} />
        </>
      )}
    </group>
  );
}

/* ─── Cut face — flat 2D region rotated to the given angle ─────────── */

function CutFace({
  fn, a, b, angle,
}: {
  fn: EvalFunction;
  a: number;
  b: number;
  angle: number;
}) {
  // The shaded 2D region lies in the XY plane (z=0).
  // Rotating by `angle` around the X-axis places it at the correct revolution angle.
  const geo = useMemo(() => buildShadedRegionGeometry(fn, a, b, 80), [fn, a, b]);

  return (
    <mesh geometry={geo} rotation={[angle, 0, 0]}>
      <meshStandardMaterial
        color="#c4b5fd"
        emissive="#7c3aed"
        emissiveIntensity={0.3}
        transparent
        opacity={0.65}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ─── Glowing edge line along the cut at angle ─────────────────────── */

function CutEdge({
  fn, a, b, angle,
}: {
  fn: EvalFunction;
  a: number;
  b: number;
  angle: number;
}) {
  const line = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const n  = 80;
    const dx = (b - a) / n;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    for (let i = 0; i <= n; i++) {
      const x = a + i * dx;
      const r = Math.max(0, evaluateAt(fn, x));
      pts.push(new THREE.Vector3(x, r * cosA, r * sinA));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: '#e879f9', linewidth: 2 });
    return new THREE.Line(geo, mat);
  }, [fn, a, b, angle]);

  return <primitive object={line} />;
}

/* ─── End cap disk at integration boundary ─────────────────────────── */

function EndCap({ fn, x }: { fn: EvalFunction; x: number }) {
  const radius = Math.max(0, evaluateAt(fn, x));
  if (radius <= 0) return null;

  return (
    <mesh position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <circleGeometry args={[radius, 56]} />
      <meshStandardMaterial
        color="#818cf8"
        emissive="#4338ca"
        emissiveIntensity={0.2}
        roughness={0.28}
        metalness={0.35}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
