/**
 * geometry.ts
 * Utilities for generating 3D geometry data for solids of revolution.
 * Used by React Three Fiber components to build BufferGeometry.
 */

import * as THREE from 'three';
import type { EvalFunction } from 'mathjs';
import { evaluateAt } from './math';

/** A single disk slice: position on x-axis, radius, and thickness */
export interface DiskSlice {
  x: number;
  radius: number;
  thickness: number;
  width: number;    // same as thickness, used for 2D rectangle visualization
  color?: string;
}

/** A single washer slice with inner and outer radii */
export interface WasherSlice {
  x: number;
  outerRadius: number;
  innerRadius: number;
  thickness: number;
}

/** A single cylindrical shell */
export interface ShellSlice {
  x: number;
  radius: number;    // distance from y-axis
  height: number;   // f(x) at that x
  thickness: number;
}

/**
 * Generate disk slice data for the disk method.
 * Each slice is a thin cylinder: radius = f(x), thickness = dx.
 */
export function generateDiskSlices(
  fn: EvalFunction,
  a: number,
  b: number,
  n: number
): DiskSlice[] {
  const dx = (b - a) / n;
  const slices: DiskSlice[] = [];
  const hue = 220; // base hue for color gradient

  for (let i = 0; i < n; i++) {
    const x = a + i * dx;
    const radius = Math.max(0, evaluateAt(fn, x + dx / 2));
    const t = i / n; // normalized position for color
    slices.push({
      x,
      radius,
      thickness: dx,
      width: dx,
      color: `hsl(${hue + t * 60}, 80%, 60%)`,
    });
  }

  return slices;
}

/**
 * Generate washer slice data for the washer method.
 */
export function generateWasherSlices(
  outerFn: EvalFunction,
  innerFn: EvalFunction,
  a: number,
  b: number,
  n: number
): WasherSlice[] {
  const dx = (b - a) / n;
  const slices: WasherSlice[] = [];

  for (let i = 0; i < n; i++) {
    const x = a + i * dx + dx / 2;
    const outerRadius = Math.max(0, evaluateAt(outerFn, x));
    const innerRadius = Math.max(0, evaluateAt(innerFn, x));
    slices.push({
      x,
      outerRadius: Math.max(outerRadius, innerRadius),
      innerRadius: Math.min(outerRadius, innerRadius),
      thickness: dx,
    });
  }

  return slices;
}

/**
 * Generate cylindrical shell slice data for the shell method.
 */
export function generateShellSlices(
  fn: EvalFunction,
  a: number,
  b: number,
  n: number
): ShellSlice[] {
  const dx = (b - a) / n;
  const slices: ShellSlice[] = [];

  for (let i = 0; i < n; i++) {
    const x = a + i * dx + dx / 2;
    const height = Math.max(0, evaluateAt(fn, x));
    slices.push({
      x,
      radius: x,     // shell radius = distance from y-axis
      height,
      thickness: dx,
    });
  }

  return slices;
}

/**
 * Build a THREE.BufferGeometry for a solid of revolution using lathe-like approach.
 * Generates vertices by rotating the function profile around the x-axis.
 *
 * @param maxAngle - revolution angle in radians (0 to 2π). Defaults to full 2π.
 */
export function buildSolidOfRevolutionGeometry(
  fn: EvalFunction,
  a: number,
  b: number,
  samples: number = 100,
  segments: number = 64,
  maxAngle: number = 2 * Math.PI,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const clampedAngle = Math.max(0.001, Math.min(maxAngle, 2 * Math.PI));
  const dx     = (b - a) / samples;
  const dTheta = clampedAngle / segments;

  for (let i = 0; i <= samples; i++) {
    const x = a + i * dx;
    const r = Math.max(0, evaluateAt(fn, x));

    // Gradient: cyan (#06b6d4) → violet (#8b5cf6) along x-axis
    const t  = samples > 0 ? i / samples : 0;
    const rc = 0.024 + t * 0.522;   // 0.024 → 0.546
    const gc = 0.714 - t * 0.351;   // 0.714 → 0.363
    const bc = 0.831 + t * 0.135;   // 0.831 → 0.966

    for (let j = 0; j <= segments; j++) {
      const theta = j * dTheta;
      const cosT  = Math.cos(theta);
      const sinT  = Math.sin(theta);

      positions.push(x, r * cosT, r * sinT);
      normals.push(0, cosT, sinT);
      uvs.push(i / samples, j / segments);

      // Slight brightness variation around circumference for depth cue
      const bright = 0.80 + 0.20 * cosT;
      colors.push(rc * bright, gc * bright, bc * bright);
    }
  }

  const cols = segments + 1;
  for (let i = 0; i < samples; i++) {
    for (let j = 0; j < segments; j++) {
      const a0 = i * cols + j;
      const b0 = a0 + 1;
      const c0 = (i + 1) * cols + j;
      const d0 = c0 + 1;
      indices.push(a0, c0, b0);
      indices.push(b0, c0, d0);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal',   new THREE.Float32BufferAttribute(normals,   3));
  geometry.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs,       2));
  geometry.setAttribute('color',    new THREE.Float32BufferAttribute(colors,    3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Build a simple tube geometry along the x-axis to represent a 2D curve in 3D space.
 * Returns a series of points (THREE.Vector3) that can be used as a tube path.
 */
export function buildCurvePoints(
  fn: EvalFunction,
  a: number,
  b: number,
  samples: number = 200
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const dx = (b - a) / samples;
  for (let i = 0; i <= samples; i++) {
    const x = a + i * dx;
    const y = Math.max(0, evaluateAt(fn, x));
    points.push(new THREE.Vector3(x, y, 0));
  }
  return points;
}

/**
 * Build a closed polygon for the shaded region under the curve.
 * Used to draw the 2D area visualization as a flat 3D plane.
 */
export function buildShadedRegionGeometry(
  fn: EvalFunction,
  a: number,
  b: number,
  samples: number = 100
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const dx = (b - a) / samples;

  shape.moveTo(a, 0);

  for (let i = 0; i <= samples; i++) {
    const x = a + i * dx;
    const y = Math.max(0, evaluateAt(fn, x));
    shape.lineTo(x, y);
  }

  shape.lineTo(b, 0);
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape, samples);
  return geometry;
}
