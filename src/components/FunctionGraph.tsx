/**
 * FunctionGraph.tsx
 * Renders the 2D function curve and the shaded region under it in the 3D scene.
 * This is a flat mesh lying on the XY plane (z=0) that shows the mathematical region.
 */

'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { parseFunction } from '@/lib/math';
import { buildCurvePoints, buildShadedRegionGeometry } from '@/lib/geometry';
import { useSimulationStore } from '@/store/useSimulationStore';

interface FunctionGraphProps {
  visible: boolean;
  showShading?: boolean;
}

export default function FunctionGraph({ visible, showShading = true }: FunctionGraphProps) {
  const { expression, boundsA, boundsB, currentStep } = useSimulationStore();
  const curveRef = useRef<THREE.Mesh>(null);

  // Parse function
  const fn = useMemo(() => parseFunction(expression), [expression]);

  // Curve tube path
  const curvePoints = useMemo(() => {
    if (!fn) return [];
    return buildCurvePoints(fn, boundsA, boundsB, 200);
  }, [fn, boundsA, boundsB]);

  // Create a smooth tube from the curve points
  const tubeGeometry = useMemo(() => {
    if (curvePoints.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    return new THREE.TubeGeometry(curve, 200, 0.015, 8, false);
  }, [curvePoints]);

  // Shaded region geometry
  const shadedGeometry = useMemo(() => {
    if (!fn || !showShading) return null;
    return buildShadedRegionGeometry(fn, boundsA, boundsB, 100);
  }, [fn, boundsA, boundsB, showShading]);

  // Animate shading opacity based on step
  const shadingOpacity = currentStep === 'intro' ? 0.15 : 0.25;

  // Animate the curve glow
  useFrame((_, delta) => {
    if (curveRef.current) {
      const mat = curveRef.current.material as THREE.MeshStandardMaterial;
      // Pulse the emissive intensity
      mat.emissiveIntensity = 0.6 + Math.sin(Date.now() * 0.002) * 0.2;
    }
  });

  if (!fn || !visible) return null;

  return (
    <group>
      {/* 2D curve tube */}
      {tubeGeometry && (
        <mesh ref={curveRef} geometry={tubeGeometry}>
          <meshStandardMaterial
            color="#06b6d4"
            emissive="#06b6d4"
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* Shaded region under the curve */}
      {shadedGeometry && showShading && (
        <mesh geometry={shadedGeometry} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#3b82f6"
            transparent={true}
            opacity={shadingOpacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            roughness={0.8}
          />
        </mesh>
      )}

      {/* x-axis boundary lines */}
      <BoundaryLine x={boundsA} />
      <BoundaryLine x={boundsB} />

      {/* Axis labels */}
      <AxisLabel position={[boundsA, -0.15, 0]} label={`a=${boundsA}`} color="#fbbf24" />
      <AxisLabel position={[boundsB, -0.15, 0]} label={`b=${boundsB}`} color="#fbbf24" />
    </group>
  );
}

/** Vertical dashed boundary line at integration limit */
function BoundaryLine({ x }: { x: number }) {
  const points = [new THREE.Vector3(x, 0, 0), new THREE.Vector3(x, 3, 0)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: '#fbbf24', opacity: 0.5, transparent: true });
  const lineObj = new THREE.Line(geometry, material);

  return <primitive object={lineObj} />;
}

/** Small floating text label using a 3D sprite-like approach */
function AxisLabel({ position, label, color }: { position: [number, number, number]; label: string; color: string }) {
  // We'll use a canvas texture for text labels
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = color;
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 128, 32);
    return new THREE.CanvasTexture(canvas);
  }, [label, color]);

  return (
    <sprite position={position} scale={[0.6, 0.15, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
}
