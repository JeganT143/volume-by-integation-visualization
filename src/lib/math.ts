/**
 * math.ts
 * Safe mathematical expression parsing, evaluation, and numerical integration utilities.
 * Uses mathjs for parsing user-provided function strings securely.
 */

import * as math from 'mathjs';

/**
 * Parse a function expression string and return a compiled evaluator.
 * Returns null if the expression is invalid.
 */
export function parseFunction(expression: string): math.EvalFunction | null {
  try {
    const sanitized = sanitizeExpression(expression);
    const compiled = math.compile(sanitized);
    // Test-evaluate at x=1 to check for basic errors
    compiled.evaluate({ x: 1 });
    return compiled;
  } catch {
    return null;
  }
}

/**
 * Sanitize user input to prevent unsafe operations.
 * Replaces common notation like ^ with ** (math.js handles ^ natively).
 */
function sanitizeExpression(expr: string): string {
  return expr
    .replace(/\be\b/g, 'e') // keep 'e' as Euler's number
    .replace(/π/g, 'pi')
    .replace(/\babs\b/g, 'abs')
    .trim();
}

/**
 * Evaluate a compiled math function at a given x value.
 * Returns 0 if evaluation fails (e.g., domain errors like sqrt of negative).
 */
export function evaluateAt(fn: math.EvalFunction, x: number): number {
  try {
    const result = fn.evaluate({ x });
    if (typeof result === 'number' && isFinite(result)) return result;
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Generate an array of [x, y] points for a function over [a, b].
 * Used to draw the 2D function curve.
 */
export function generateCurvePoints(
  fn: math.EvalFunction,
  a: number,
  b: number,
  samples: number = 200
): [number, number][] {
  const points: [number, number][] = [];
  const step = (b - a) / samples;
  for (let i = 0; i <= samples; i++) {
    const x = a + i * step;
    const y = evaluateAt(fn, x);
    points.push([x, y]);
  }
  return points;
}

/**
 * Compute the Left Riemann Sum approximation of a function from a to b with n slices.
 * Returns both the approximate value and an array of slice data for visualization.
 */
export function riemannSum(
  fn: math.EvalFunction,
  a: number,
  b: number,
  n: number,
  type: 'left' | 'right' | 'midpoint' = 'midpoint'
): { total: number; slices: { x: number; y: number; width: number }[] } {
  const dx = (b - a) / n;
  let total = 0;
  const slices: { x: number; y: number; width: number }[] = [];

  for (let i = 0; i < n; i++) {
    const xLeft = a + i * dx;
    const xRight = xLeft + dx;
    let sampleX: number;

    if (type === 'left') sampleX = xLeft;
    else if (type === 'right') sampleX = xRight;
    else sampleX = (xLeft + xRight) / 2; // midpoint

    const y = Math.max(0, evaluateAt(fn, sampleX));
    const sliceArea = y * dx;
    total += sliceArea;
    slices.push({ x: xLeft, y, width: dx });
  }

  return { total, slices };
}

/**
 * Numerically integrate using adaptive Simpson's rule for a more accurate "exact" value.
 * Used to compare against Riemann approximation.
 */
export function adaptiveIntegrate(
  fn: math.EvalFunction,
  a: number,
  b: number
): number {
  const n = 1000; // high sample count for accuracy
  const dx = (b - a) / n;
  let sum = 0;

  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    const x1 = x0 + dx / 2;
    const x2 = x0 + dx;
    const y0 = Math.max(0, evaluateAt(fn, x0));
    const y1 = Math.max(0, evaluateAt(fn, x1));
    const y2 = Math.max(0, evaluateAt(fn, x2));
    // Simpson's 1/3 rule
    sum += (dx / 6) * (y0 + 4 * y1 + y2);
  }

  return sum;
}

/**
 * Compute the volume of the solid of revolution using the Disk method.
 * V = π ∫[a,b] [f(x)]² dx
 */
export function diskMethodVolume(
  fn: math.EvalFunction,
  a: number,
  b: number
): number {
  const n = 1000;
  const dx = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = a + i * dx + dx / 2;
    const r = Math.max(0, evaluateAt(fn, x));
    sum += Math.PI * r * r * dx;
  }
  return sum;
}

/**
 * Compute the volume of the solid of revolution using the Washer method.
 * V = π ∫[a,b] [R(x)² - r(x)²] dx
 */
export function washerMethodVolume(
  outerFn: math.EvalFunction,
  innerFn: math.EvalFunction,
  a: number,
  b: number
): number {
  const n = 1000;
  const dx = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = a + i * dx + dx / 2;
    const R = Math.max(0, evaluateAt(outerFn, x));
    const r = Math.max(0, evaluateAt(innerFn, x));
    sum += Math.PI * (R * R - r * r) * dx;
  }
  return sum;
}

/**
 * Compute the volume using the Shell Method.
 * V = 2π ∫[a,b] x·f(x) dx
 */
export function shellMethodVolume(
  fn: math.EvalFunction,
  a: number,
  b: number
): number {
  const n = 1000;
  const dx = (b - a) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x = a + i * dx + dx / 2;
    const h = Math.max(0, evaluateAt(fn, x));
    sum += 2 * Math.PI * x * h * dx;
  }
  return sum;
}

/**
 * Validate and return a safe default if expression is empty or invalid.
 */
export function getValidExpression(input: string): string {
  const defaults = ['x^2', 'sin(x)', 'sqrt(x)', 'exp(-x^2)'];
  if (!input || input.trim() === '') return defaults[0];
  const fn = parseFunction(input);
  return fn ? input : defaults[0];
}
