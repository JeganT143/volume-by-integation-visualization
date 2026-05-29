/**
 * SliceVisualizer.tsx
 * Renders the individual disk, washer, or shell slices with animations.
 * Handles the visual transition from rectangles → 3D slices → accumulated volume.
 */

'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { parseFunction } from '@/lib/math';
import { generateDiskSlices, generateWasherSlices, generateShellSlices } from '@/lib/geometry';
import { useSimulationStore } from '@/store/useSimulationStore';

interface SliceVisualizerProps {
  visible: boolean;
}

/**
 * Renders disk slices (cylinders) for the disk method.
 * Each disk: radius = f(x), thickness = dx.
 */
function DiskSlices() {
  const { expression, boundsA, boundsB, sliceCount, displayMode } = useSimulationStore();
  const fn = useMemo(() => parseFunction(expression), [expression]);

  const slices = useMemo(() => {
    if (!fn) return [];
    return generateDiskSlices(fn, boundsA, boundsB, sliceCount);
  }, [fn, boundsA, boundsB, sliceCount]);

  const isTransparent = displayMode === 'transparent';
  const isWireframe = displayMode === 'wireframe';

  return (
    <group>
      {slices.map((slice, i) => {
        if (slice.radius <= 0) return null;
        const hue = 220 + (i / slices.length) * 60;
        const color = new THREE.Color(`hsl(${hue}, 80%, 60%)`);

        return (
          <mesh
            key={i}
            position={[slice.x, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry
              args={[slice.radius, slice.radius, slice.thickness, 32, 1, isWireframe]}
            />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.15}
              transparent={isTransparent || true}
              opacity={isTransparent ? 0.3 : 0.75}
              wireframe={isWireframe}
              roughness={0.4}
              metalness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Renders washer slices (hollow cylinders) for the washer method.
 */
function WasherSlices() {
  const { expression, innerExpression, boundsA, boundsB, sliceCount, displayMode } = useSimulationStore();
  const outerFn = useMemo(() => parseFunction(expression), [expression]);
  const innerFn = useMemo(() => parseFunction(innerExpression), [innerExpression]);

  const slices = useMemo(() => {
    if (!outerFn || !innerFn) return [];
    return generateWasherSlices(outerFn, innerFn, boundsA, boundsB, sliceCount);
  }, [outerFn, innerFn, boundsA, boundsB, sliceCount]);

  const isTransparent = displayMode === 'transparent';
  const isWireframe = displayMode === 'wireframe';

  return (
    <group>
      {slices.map((slice, i) => {
        if (slice.outerRadius <= 0) return null;
        const hue = 260 + (i / slices.length) * 60;
        const color = new THREE.Color(`hsl(${hue}, 75%, 65%)`);

        return (
          <group key={i} position={[slice.x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            {/* Outer cylinder */}
            <mesh>
              <cylinderGeometry
                args={[slice.outerRadius, slice.outerRadius, slice.thickness, 32, 1, true]}
              />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.2}
                transparent={true}
                opacity={isTransparent ? 0.25 : 0.65}
                wireframe={isWireframe}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Top cap washer */}
            <mesh position={[0, slice.thickness / 2, 0]}>
              <ringGeometry args={[slice.innerRadius, slice.outerRadius, 32]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.15}
                transparent={true}
                opacity={isTransparent ? 0.25 : 0.65}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Bottom cap washer */}
            <mesh position={[0, -slice.thickness / 2, 0]}>
              <ringGeometry args={[slice.innerRadius, slice.outerRadius, 32]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.15}
                transparent={true}
                opacity={isTransparent ? 0.25 : 0.65}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/**
 * Renders cylindrical shell slices for the shell method.
 * Each shell: radius = x (distance from y-axis), height = f(x), thickness = dx.
 */
function ShellSlices() {
  const { expression, boundsA, boundsB, sliceCount, displayMode } = useSimulationStore();
  const fn = useMemo(() => parseFunction(expression), [expression]);

  const slices = useMemo(() => {
    if (!fn) return [];
    return generateShellSlices(fn, boundsA, boundsB, sliceCount);
  }, [fn, boundsA, boundsB, sliceCount]);

  const isTransparent = displayMode === 'transparent';
  const isWireframe = displayMode === 'wireframe';

  return (
    <group>
      {slices.map((slice, i) => {
        if (slice.height <= 0 || slice.radius <= 0) return null;
        const hue = 140 + (i / slices.length) * 80;
        const color = new THREE.Color(`hsl(${hue}, 70%, 60%)`);

        return (
          <mesh
            key={i}
            position={[0, slice.height / 2, 0]}
          >
            {/* Open cylinder: radiusTop, radiusBottom, height, segments, heightSegments, openEnded */}
            <cylinderGeometry
              args={[slice.radius + slice.thickness / 2, slice.radius + slice.thickness / 2, slice.height, 32, 1, true]}
            />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.2}
              transparent={true}
              opacity={isTransparent ? 0.2 : 0.6}
              wireframe={isWireframe}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Animated rectangles for the 2D Riemann sum visualization.
 * Shown during the 'addRectangles' and 'shrinkDx' steps.
 */
export function RiemannRectangles({ visible }: { visible: boolean }) {
  const { expression, boundsA, boundsB, sliceCount } = useSimulationStore();
  const fn = useMemo(() => parseFunction(expression), [expression]);

  const slices = useMemo(() => {
    if (!fn || !visible) return [];
    return generateDiskSlices(fn, boundsA, boundsB, sliceCount);
  }, [fn, boundsA, boundsB, sliceCount, visible]);

  if (!visible || !fn) return null;

  return (
    <group>
      {slices.map((slice, i) => {
        if (slice.radius <= 0) return null;
        const hue = 220 + (i / slices.length) * 60;
        const color = new THREE.Color(`hsl(${hue}, 80%, 60%)`);

        return (
          <mesh
            key={i}
            position={[slice.x + slice.width / 2, slice.radius / 2, 0]}
          >
            <boxGeometry args={[slice.width * 0.95, slice.radius, 0.01]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.3}
              transparent
              opacity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Main entry: renders the appropriate slices based on current method */
export default function SliceVisualizer({ visible }: SliceVisualizerProps) {
  const { method, displayMode } = useSimulationStore();

  if (!visible || displayMode === 'solid') return null;

  return (
    <group>
      {method === 'disk' && <DiskSlices />}
      {method === 'washer' && <WasherSlices />}
      {method === 'shell' && <ShellSlices />}
    </group>
  );
}
