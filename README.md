# Volume Integration Visualizer

An interactive 3D calculus learning tool that teaches **Solids of Revolution** through guided animations and real-time 3D visualization. Students can see how rotating a 2D curve around the x-axis creates a 3D solid, explore how integration computes its exact volume, and experiment with different functions and methods.

---

## Table of Contents

- [About the Project](#about-the-project)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Running the App](#running-the-app)
- [What You Can Do](#what-you-can-do)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Supported Function Syntax](#supported-function-syntax)
- [Project Structure](#project-structure)

---

## About the Project

In integral calculus, when you revolve a curve — say `y = x²` — around the x-axis, it sweeps out a 3D shape called a **solid of revolution**. Integration gives us an exact formula to compute the volume of that shape.

This app visualizes that entire process step by step:

1. Start with a 2D curve on the xy-plane
2. Approximate the area under it with rectangles (Riemann sum)
3. Revolve each rectangle around the x-axis — each becomes a **disk**
4. Stack all the disks together to form the **solid**
5. Take the limit as the number of disks → ∞ to get the **exact volume integral**

Students can control every parameter, rotate the solid at any angle, and instantly see how the math changes.

---

## Tech Stack

| Purpose | Library / Tool |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| 3D Rendering | React Three Fiber + Three.js |
| 3D Utilities | @react-three/drei |
| Math Parsing | mathjs |
| Formula Display | KaTeX |
| Animations | Framer Motion |
| State Management | Zustand |
| Styling | Tailwind CSS v4 |

---

## Getting Started

### Prerequisites

You need **Node.js v18 or higher** installed on your machine.

Check if you have it:

```bash
node --version   # should print v18.x.x or higher
npm --version    # should print 9.x.x or higher
```

If not installed, download it from [nodejs.org](https://nodejs.org).

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/JeganT143/volume-by-integation-visualization.git
cd volume-by-integation-visualization
```

### Step 2 — Install dependencies

```bash
npm install
```

This installs all required packages including Three.js, React Three Fiber, mathjs, KaTeX, and Framer Motion. It may take a minute.

---

## Running the App

### Development mode

Use this while learning or making changes. The app auto-reloads when you edit files.

```bash
npm run dev
```

Open your browser and go to:

```
http://localhost:3000
```

### Production mode

Use this for deployment or to test the optimized build.

```bash
npm run build
npm run start
```

---

## What You Can Do

The app is split into two panels: the **3D scene** on the left and the **learning panel** on the right.

---

### Walk through the guided steps

The right panel contains **9 learning steps** that take you from the basic concept to the final integral formula.

- Click **Next** to advance one step
- Click **Prev** to go back
- Click **Play** to auto-advance through all steps automatically
- Click **any step dot** in the progress bar to jump directly to that step
- Drag the **Speed** slider to make auto-play faster or slower

The 3D scene updates at each step to show what is being explained — rectangles appear, revolve, become disks, then accumulate into the full solid.

---

### Change the revolution angle

This is the most powerful feature for understanding solids of revolution.

The **Revolution Angle** slider (always visible, below the method bar) controls how far the curve is rotated around the x-axis.

- Drag the slider from **1° to 360°**
- Click the preset buttons — **45° / 90° / 180° / 270° / 360°** — to snap to common angles
- At angles less than 360°, the solid is cut open so you can look inside and see the cross-section
- A glowing edge line shows exactly where the revolution stopped
- At 360° you get the complete closed solid

---

### Change the integration method

Three classic methods are available, selectable from the top bar:

| Method | Formula | Description |
|---|---|---|
| **Disk** | V = π ∫ [f(x)]² dx | Rotates the area under a single curve. Each slice is a solid disk. |
| **Washer** | V = π ∫ [R(x)² − r(x)²] dx | Rotates the area between two curves. Each slice is a ring (washer) with a hole in the middle. |
| **Shell** | V = 2π ∫ x · f(x) dx | Builds the solid from nested cylindrical shells instead of stacked disks. Useful when disk/washer is awkward. |

---

### Edit the function and parameters

Click **Edit ▾** (the summary bar below the method selector) to open the parameters drawer. You can:

**Function f(x)**
- Type any mathematical expression in the input box
- Use the quick-select chips to instantly switch to a common function: `x²`, `sin(x)`, `√x`, `eˣ`, `1/x`, `cos(x)`

**Integration Bounds**
- Set the **lower bound (a)** and **upper bound (b)** — the range of x values to integrate over
- The 3D solid and all volume calculations update instantly

**Number of Slices (n)**
- Drag the slider from 1 to 50
- Fewer slices = rougher approximation (you can clearly see the blocky disks)
- More slices = the approximation approaches the exact integral value
- Watch the **error percentage** in the formula panel shrink as n increases

**3D Display Mode**
- **Solid** — fully opaque solid with lighting and color gradient
- **Glass** — semi-transparent so you can see through the surface
- **Wireframe** — mesh outline only, great for seeing the geometry structure
- **Slices** — shows each individual disk separately with distinct colors

---

### Read the math results

Below the step explanation, the **Mathematics panel** always shows:

- The current function written as a formula: `f(x) = ...`
- The relevant formula for the current learning step (rendered with KaTeX)
- At the final step, the specific method's volume formula with your actual bounds filled in
- **Riemann Sum** — the numerical approximation using n slices
- **Exact Volume** — computed using numerical integration (Simpson's rule, 1000 sub-intervals)
- **Approximation error %** — how close the Riemann sum is to the exact value (green < 1%, yellow < 5%, red otherwise)

---

### Navigate the 3D scene

**Rotate** — click and drag inside the 3D canvas to orbit around the solid

**Zoom** — scroll the mouse wheel, or click the **+** and **−** buttons in the bottom-right corner of the scene

**Camera presets** — click the four buttons in the top-left corner of the scene:
- **3D** — default isometric view, best for seeing the full solid
- **Top** — looking straight down the y-axis
- **Front** — looking straight at the yz-plane
- **Side** — looking along the x-axis, shows the curve profile

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `→` or `L` | Next step |
| `←` or `J` | Previous step |
| `Space` or `K` | Play / Pause auto-advance |
| `R` | Reset everything to the beginning |

> Shortcuts do not trigger when you are typing in an input field.

---

## Supported Function Syntax

The function input accepts standard mathjs expressions. Some examples:

| What you want | What to type |
|---|---|
| x squared | `x^2` |
| Square root of x | `sqrt(x)` |
| Sine of x | `sin(x)` |
| Cosine of x | `cos(x)` |
| e to the power x | `exp(x)` |
| Natural log | `log(x)` |
| Absolute value | `abs(x)` |
| Constant pi | `pi` |
| One over x | `1/x` |
| A polynomial | `x^3 - 2*x + 1` |
| Compound expression | `sin(x) + 0.5` |

A green dot on the input means the expression is valid. A red dot means there is a syntax error.

---

## Project Structure

```
volume_integration/
│
├── src/
│   ├── app/
│   │   ├── page.tsx              # Root page — layout, method bar, revolution control
│   │   ├── layout.tsx            # HTML shell and metadata
│   │   └── globals.css           # Design tokens, component styles, animations
│   │
│   ├── components/
│   │   ├── Scene3D.tsx           # Canvas setup, camera, lighting, zoom buttons
│   │   ├── DiskMethod.tsx        # Disk solid geometry with color gradient and cut faces
│   │   ├── WasherMethod.tsx      # Washer solid geometry
│   │   ├── ShellMethod.tsx       # Shell solid geometry
│   │   ├── SliceVisualizer.tsx   # Individual colored slices for each method
│   │   ├── FunctionGraph.tsx     # 2D curve and shaded region in the 3D scene
│   │   ├── ExplanationPanel.tsx  # Step progress dots and explanation text
│   │   ├── FormulaPanel.tsx      # KaTeX formulas, volume results, error %
│   │   ├── TimelinePlayer.tsx    # Navigation buttons and speed slider
│   │   └── ControlsPanel.tsx     # Function, bounds, slices, display mode inputs
│   │
│   ├── store/
│   │   └── useSimulationStore.ts # Zustand store — all shared simulation state
│   │
│   └── lib/
│       ├── math.ts               # Expression parsing, Riemann sums, volume integrals
│       └── geometry.ts           # Three.js geometry builders for solids of revolution
│
├── package.json
└── README.md
```

---

## License

MIT
