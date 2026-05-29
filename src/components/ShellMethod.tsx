/**
 * ShellMethod.tsx
 * Renders the cylindrical shell solid for the shell method visualization.
 * Shows concentric cylindrical shells that accumulate to form the volume.
 */

'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { parseFunction, evaluateAt } from '@/lib/math';
import { useSimulationStore } from '@/store/useSimulationStore';

interface ShellMethodProps {
  visible: boolean;
}

/**
 * Build a solid from accumulated shells using a different geometry approach.
 * For the continuous solid view, we actually use a lathe geometry rotated 90°.
 */
function buildShellSolid(
  fn: ReturnType<typeof parseFunction>,
  a: number,
  b: number,
  samples: number = 100,
  segments: number = 64
): THREE.BufferGeometry {
  if (!fn) return new THREE.BufferGeometry();

  // Shell method: the solid is the same shape as disk method visually
  // but conceptually formed by shells. We render the profile via Lathe.
  const points: THREE.Vector2[] = [];

  // Bottom point at axis
  points.push(new THREE.Vector2(0, a));

  // Profile curve
  const dy = (b - a) / samples;
  for (let i = 0; i <= samples; i++) {
    const x = a + i * dy; // x here is the "height" of the lathe point
    const r = Math.max(0, evaluateAt(fn, x));
    points.push(new THREE.Vector2(r, x));
  }

  // Close at top
  points.push(new THREE.Vector2(0, b));

  // LatheGeometry rotates the profile around the Y axis
  const geo = new THREE.LatheGeometry(points, segments);
  return geo;
}

export default function ShellMethod({ visible }: ShellMethodProps) {
  const { expression, boundsA, boundsB, displayMode } = useSimulationStore();
  const groupRef = useRef<THREE.Group>(null);
  const fn = useMemo(() => parseFunction(expression), [expression]);

  const geometry = useMemo(() => {
    if (!fn || !visible) return null;
    return buildShellSolid(fn, boundsA, boundsB);
  }, [fn, boundsA, boundsB, visible]);

  useFrame(() => {
    if (groupRef.current) {
      // Subtle Y-axis rotation for shell method (more dramatic effect)
      // Not applied — user controls with orbit
    }
  });

  if (!fn || !geometry || !visible) return null;

  const isTransparent = displayMode === 'transparent';
  const isWireframe = displayMode === 'wireframe';

  return (
    // Rotate from Y-axis revolution to X-axis revolution
    <group ref={groupRef} rotation={[0, 0, -Math.PI / 2]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#10b981"
          emissive="#059669"
          emissiveIntensity={0.1}
          roughness={0.3}
          metalness={0.3}
          transparent={true}
          opacity={isTransparent ? 0.35 : isWireframe ? 0.1 : 0.85}
          wireframe={isWireframe}
          side={THREE.DoubleSide}
          depthWrite={!isTransparent}
        />
      </mesh>
    </group>
  );
}
