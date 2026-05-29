/**
 * useSimulationStore.ts
 * Global state management using Zustand.
 * Stores all simulation parameters and UI state.
 */

import { create } from 'zustand';

/** The integration method being visualized */
export type IntegrationMethod = 'disk' | 'washer' | 'shell';

/** Timeline step identifiers for the guided learning mode */
export type LearningStep =
  | 'intro'
  | 'show2D'
  | 'addRectangles'
  | 'shrinkDx'
  | 'revolve'
  | 'showSlices'
  | 'accumulate'
  | 'continuous'
  | 'formula';

/** Visualization display mode */
export type DisplayMode = 'solid' | 'transparent' | 'wireframe' | 'slices';

/** Camera preset views */
export type CameraView = 'isometric' | 'top' | 'front' | 'side';

/**
 * All simulation state and actions.
 */
interface SimulationState {
  // --- Function parameters ---
  expression: string;         // f(x) expression string, e.g. "x^2"
  innerExpression: string;    // g(x) for washer method inner function
  boundsA: number;            // lower integration bound
  boundsB: number;            // upper integration bound
  sliceCount: number;         // number of Riemann/disk/shell slices

  // --- Method and mode ---
  method: IntegrationMethod;
  displayMode: DisplayMode;

  // --- Animation ---
  isPlaying: boolean;         // timeline is playing
  animationSpeed: number;     // 0.5x to 3x
  currentStep: LearningStep;  // current step in guided learning
  stepIndex: number;          // 0-based index of current step
  revolutionAngle: number;    // 0 to 2*PI for animation of revolution

  // --- Camera ---
  cameraView: CameraView;

  // --- Computed values (cached for display) ---
  approximateVolume: number;
  exactVolume: number;
  isExpressionValid: boolean;

  // --- Actions ---
  setExpression: (expr: string) => void;
  setInnerExpression: (expr: string) => void;
  setBoundsA: (a: number) => void;
  setBoundsB: (b: number) => void;
  setSliceCount: (n: number) => void;
  setMethod: (method: IntegrationMethod) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setIsPlaying: (playing: boolean) => void;
  setAnimationSpeed: (speed: number) => void;
  setCurrentStep: (step: LearningStep) => void;
  setStepIndex: (index: number) => void;
  setRevolutionAngle: (angle: number) => void;
  setCameraView: (view: CameraView) => void;
  setApproximateVolume: (v: number) => void;
  setExactVolume: (v: number) => void;
  setIsExpressionValid: (valid: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

/** Ordered list of learning steps for the timeline */
export const LEARNING_STEPS: LearningStep[] = [
  'intro',
  'show2D',
  'addRectangles',
  'shrinkDx',
  'revolve',
  'showSlices',
  'accumulate',
  'continuous',
  'formula',
];

/** Human-readable label for each learning step */
export const STEP_LABELS: Record<LearningStep, string> = {
  intro: 'Introduction',
  show2D: '2D Region',
  addRectangles: 'Add Rectangles',
  shrinkDx: 'Shrink Δx',
  revolve: 'Revolve!',
  showSlices: 'Show Slices',
  accumulate: 'Accumulate',
  continuous: 'Continuous Limit',
  formula: 'The Formula',
};

/** Explanatory text for each step shown in the ExplanationPanel */
export const STEP_EXPLANATIONS: Record<LearningStep, { title: string; body: string; formula?: string }> = {
  intro: {
    title: 'Volume Under a Curve',
    body: 'We want to find the volume of the 3D solid created when we rotate a 2D region around the x-axis. This is one of the most beautiful ideas in calculus.',
  },
  show2D: {
    title: 'The 2D Region',
    body: 'Start by looking at the region between the curve y = f(x) and the x-axis, from x = a to x = b. This flat region will become our 3D solid.',
    formula: 'y = f(x)',
  },
  addRectangles: {
    title: 'Approximate with Rectangles',
    body: 'Divide the region into thin vertical rectangles of width Δx. Each rectangle has height f(x). We can compute the area of each rectangle.',
    formula: 'A_i \\approx f(x_i) \\cdot \\Delta x',
  },
  shrinkDx: {
    title: 'Shrink Δx → 0',
    body: 'As we use more rectangles (smaller Δx), the approximation gets better and better. In the limit, we get the exact area — this is integration!',
    formula: '\\int_a^b f(x)\\,dx = \\lim_{n \\to \\infty} \\sum_{i=1}^{n} f(x_i)\\,\\Delta x',
  },
  revolve: {
    title: 'Revolve Around the x-axis',
    body: 'Now imagine spinning each rectangle 360° around the x-axis. Each rectangle sweeps out a circular disk! The 2D region becomes a beautiful 3D solid.',
  },
  showSlices: {
    title: 'Each Slice is a Disk',
    body: 'When we rotate a rectangle of height f(x) and width dx, it creates a disk with: radius = f(x), thickness = dx. The volume of each disk is π·r²·dx.',
    formula: 'V_{disk} = \\pi [f(x_i)]^2 \\cdot \\Delta x',
  },
  accumulate: {
    title: 'Sum the Disks',
    body: 'The total volume is approximately the sum of all disk volumes. The more slices we use, the more accurate our approximation becomes.',
    formula: 'V \\approx \\sum_{i=1}^{n} \\pi [f(x_i)]^2 \\cdot \\Delta x',
  },
  continuous: {
    title: 'Take the Limit',
    body: 'As the thickness dx → 0 and the number of disks → ∞, the sum becomes a definite integral. The approximation becomes exact!',
    formula: 'V = \\lim_{n \\to \\infty} \\sum_{i=1}^{n} \\pi [f(x_i)]^2 \\Delta x',
  },
  formula: {
    title: 'The Volume Formula',
    body: 'This limit of sums IS the integral. The disk method gives us an elegant formula for the exact volume of any solid of revolution.',
    formula: 'V = \\pi \\int_a^b [f(x)]^2\\,dx',
  },
};

const DEFAULT_STATE: Omit<SimulationState,
  'setExpression' | 'setInnerExpression' | 'setBoundsA' | 'setBoundsB' |
  'setSliceCount' | 'setMethod' | 'setDisplayMode' | 'setIsPlaying' |
  'setAnimationSpeed' | 'setCurrentStep' | 'setStepIndex' | 'setRevolutionAngle' |
  'setCameraView' | 'setApproximateVolume' | 'setExactVolume' | 'setIsExpressionValid' |
  'nextStep' | 'prevStep' | 'reset'
> = {
  expression: 'x^2',
  innerExpression: 'x',
  boundsA: 0,
  boundsB: 2,
  sliceCount: 10,
  method: 'disk',
  displayMode: 'solid',
  isPlaying: false,
  animationSpeed: 1,
  currentStep: 'intro',
  stepIndex: 0,
  revolutionAngle: 2 * Math.PI,
  cameraView: 'isometric',
  approximateVolume: 0,
  exactVolume: 0,
  isExpressionValid: true,
};

export const useSimulationStore = create<SimulationState>((set, get) => ({
  ...DEFAULT_STATE,

  setExpression: (expr) => set({ expression: expr }),
  setInnerExpression: (expr) => set({ innerExpression: expr }),
  setBoundsA: (a) => set({ boundsA: a }),
  setBoundsB: (b) => set({ boundsB: b }),
  setSliceCount: (n) => set({ sliceCount: n }),
  setMethod: (method) => set({ method }),
  setDisplayMode: (mode) => set({ displayMode: mode }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setStepIndex: (index) => set({ stepIndex: index }),
  setRevolutionAngle: (angle) => set({ revolutionAngle: angle }),
  setCameraView: (view) => set({ cameraView: view }),
  setApproximateVolume: (v) => set({ approximateVolume: v }),
  setExactVolume: (v) => set({ exactVolume: v }),
  setIsExpressionValid: (valid) => set({ isExpressionValid: valid }),

  nextStep: () => {
    const { stepIndex } = get();
    const next = Math.min(stepIndex + 1, LEARNING_STEPS.length - 1);
    set({ stepIndex: next, currentStep: LEARNING_STEPS[next] });
  },

  prevStep: () => {
    const { stepIndex } = get();
    const prev = Math.max(stepIndex - 1, 0);
    set({ stepIndex: prev, currentStep: LEARNING_STEPS[prev] });
  },

  reset: () => set({ ...DEFAULT_STATE }),
}));
