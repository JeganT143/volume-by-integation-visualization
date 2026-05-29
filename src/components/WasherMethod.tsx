/**
 * WasherMethod.tsx
 * Renders the solid of revolution for the washer method.
 * Shows a hollow solid formed by subtracting the inner function's revolution from the outer.
 */

'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { parseFunction, evaluateAt } from '@/lib/math';
import { useSimulationStore } from '@/store/useSimulationStore';

interface WasherMethodProps {
  visible: boolean;
}

/**
 * Build a washer solid geometry.
 * We create a series of ring cross-sections and connect them to form a hollow solid.
 */
function buildWasherSolid(
  outerFn: ReturnType<typeof parseFunction>,
  innerFn: ReturnType<typeof parseFunction>,
  a: number,
  b: number,
  xSamples: number = 80,
  radialSegments: number = 48
): THREE.BufferGeometry {
  if (!outerFn || !innerFn) return new THREE.BufferGeometry();

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const dx = (b - a) / xSamples;
  const dTheta = (2 * Math.PI) / radialSegments;

  // Generate vertices for inner and outer surfaces
  for (let i = 0; i <= xSamples; i++) {
    const x = a + i * dx;
    const Ro = Math.max(0, evaluateAt(outerFn, x));
    const Ri = Math.max(0, Math.min(evaluateAt(innerFn, x), Ro * 0.99));

    for (let j = 0; j <= radialSegments; j++) {
      const theta = j * dTheta;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      // Outer surface vertex
      positions.push(x, Ro * cosT, Ro * sinT);
      normals.push(0, cosT, sinT);

      // Inner surface vertex (flipped normal pointing inward)
      positions.push(x, Ri * cosT, Ri * sinT);
      normals.push(0, -cosT, -sinT);
    }
  }

  // Build faces for outer surface (even vertices)
  const stride = (radialSegments + 1) * 2;
  for (let i = 0; i < xSamples; i++) {
    for (let j = 0; j < radialSegments; j++) {
      // Outer surface
      const a0 = i * stride + j * 2;
      const b0 = a0 + 2;
      const c0 = (i + 1) * stride + j * 2;
      const d0 = c0 + 2;
      indices.push(a0, c0, b0, b0, c0, d0);

      // Inner surface (reversed winding)
      const a1 = i * stride + j * 2 + 1;
      const b1 = a1 + 2;
      const c1 = (i + 1) * stride + j * 2 + 1;
      const d1 = c1 + 2;
      indices.push(a1, b1, c1, b1, d1, c1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export default function WasherMethod({ visible }: WasherMethodProps) {
  const { expression, innerExpression, boundsA, boundsB, displayMode } = useSimulationStore();
  const meshRef = useRef<THREE.Mesh>(null);

  const outerFn = useMemo(() => parseFunction(expression), [expression]);
  const innerFn = useMemo(() => parseFunction(innerExpression), [innerExpression]);

  const geometry = useMemo(() => {
    if (!outerFn || !innerFn || !visible) return null;
    return buildWasherSolid(outerFn, innerFn, boundsA, boundsB);
  }, [outerFn, innerFn, boundsA, boundsB, visible]);

  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.08 + Math.sin(Date.now() * 0.0015) * 0.04;
    }
  });

  if (!visible || !geometry) return null;

  const isTransparent = displayMode === 'transparent';
  const isWireframe = displayMode === 'wireframe';

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#a855f7"
        emissive="#7c3aed"
        emissiveIntensity={0.08}
        roughness={0.35}
        metalness={0.3}
        transparent={true}
        opacity={isTransparent ? 0.35 : isWireframe ? 0.15 : 0.85}
        wireframe={isWireframe}
        side={THREE.DoubleSide}
        depthWrite={!isTransparent}
      />
    </mesh>
  );
}
