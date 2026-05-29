/**
 * Scene3D.tsx
 * The main React Three Fiber 3D canvas scene.
 * Cleaned up: removed overlapping overlays (moved to panel), wider FOV camera.
 */

'use client';

import { useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Stars, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '@/store/useSimulationStore';
import FunctionGraph from './FunctionGraph';
import SliceVisualizer, { RiemannRectangles } from './SliceVisualizer';
import DiskMethod from './DiskMethod';
import WasherMethod from './WasherMethod';
import ShellMethod from './ShellMethod';

/** Computes which 3D elements to show based on the current learning step */
function useSceneVisibility() {
  const { currentStep, displayMode } = useSimulationStore();

  const show2DCurve = ['show2D', 'addRectangles', 'shrinkDx', 'revolve', 'intro'].includes(currentStep);
  const show2DRects = ['addRectangles', 'shrinkDx'].includes(currentStep);
  const show3DSolid = ['revolve', 'showSlices', 'accumulate', 'continuous', 'formula'].includes(currentStep);
  const showSlices = ['showSlices', 'accumulate'].includes(currentStep) || displayMode === 'slices';
  const showContinuousSolid = ['continuous', 'formula'].includes(currentStep) || displayMode === 'solid' || displayMode === 'transparent' || displayMode === 'wireframe';

  return { show2DCurve, show2DRects, show3DSolid, showSlices, showContinuousSolid };
}

/** 3D Coordinate Axes */
function Axes() {
  const axisLength = 3.5;
  return (
    <group>
      <arrowHelper args={[
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-0.5, 0, 0),
        axisLength, '#ef4444', 0.15, 0.08
      ]} />
      <arrowHelper args={[
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, -0.5, 0),
        axisLength, '#22c55e', 0.15, 0.08
      ]} />
      <arrowHelper args={[
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -0.5),
        axisLength * 0.6, '#3b82f6', 0.15, 0.08
      ]} />
    </group>
  );
}

/** Ambient depth effect */
function SceneAmbience() {
  return (
    <>
      <Stars radius={50} depth={20} count={200} factor={2} saturation={0.5} fade speed={0.5} />
      <fog attach="fog" args={['#040408', 18, 45]} />
    </>
  );
}

/** Dynamic lighting with orbiting fill light */
function DynamicLighting() {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      const t = clock.getElapsedTime();
      lightRef.current.position.x = Math.sin(t * 0.3) * 5;
      lightRef.current.position.z = Math.cos(t * 0.3) * 5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} color="#1e1b4b" />
      <hemisphereLight args={['#312e81', '#0f172a', 0.5]} />
      <directionalLight position={[5, 8, 3]} intensity={1.2} color="#c4b5fd" castShadow />
      <directionalLight position={[-4, -2, -3]} intensity={0.4} color="#0ea5e9" />
      <pointLight ref={lightRef} position={[3, 4, 3]} intensity={2} color="#7c3aed" distance={12} decay={2} />
      <pointLight position={[0, -3, 0]} intensity={0.5} color="#0891b2" distance={8} decay={2} />
    </>
  );
}

/**
 * Module-level zoom callback — set by CameraController once mounted,
 * called by the HTML overlay ZoomButtons outside the Canvas.
 */
let _zoomFn: ((factor: number) => void) | null = null;

const ORBIT_TARGET = new THREE.Vector3(1, 0.5, 0);

/** Camera controller with preset views */
function CameraController() {
  const { camera } = useThree();
  const { cameraView } = useSimulationStore();

  useEffect(() => {
    const views: Record<string, [number, number, number]> = {
      isometric: [5, 3.5, 6],
      top:       [0, 10, 0],
      front:     [0, 0, 10],
      side:      [10, 0, 0],
    };
    const pos = views[cameraView] ?? views.isometric;
    camera.position.set(...pos);
    camera.lookAt(ORBIT_TARGET);
  }, [cameraView, camera]);

  // Expose a zoom function to the HTML overlay via module variable
  useEffect(() => {
    _zoomFn = (factor: number) => {
      const dir = new THREE.Vector3()
        .subVectors(camera.position, ORBIT_TARGET);
      const currentDist = dir.length();
      const newDist = Math.max(3, Math.min(25, currentDist * factor));
      dir.normalize().multiplyScalar(newDist);
      camera.position.copy(ORBIT_TARGET).add(dir);
    };
    return () => { _zoomFn = null; };
  }, [camera]);

  return (
    <OrbitControls
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={3}
      maxDistance={25}
      target={[1, 0.5, 0]}
      makeDefault
    />
  );
}

/** Grid floor */
function SceneGrid() {
  return (
    <Grid
      position={[0, -0.01, 0]}
      args={[12, 12]}
      cellSize={0.5}
      cellThickness={0.3}
      cellColor="#1e1b4b"
      sectionSize={1}
      sectionThickness={0.8}
      sectionColor="#312e81"
      fadeDistance={14}
      fadeStrength={2}
      infiniteGrid={false}
    />
  );
}

/** The inner scene: all 3D objects, wired up to simulation state. */
function SceneContent() {
  const { method, displayMode } = useSimulationStore();
  const { show2DCurve, show2DRects, show3DSolid, showSlices, showContinuousSolid } = useSceneVisibility();

  const showSolid = show3DSolid && (showContinuousSolid || displayMode !== 'slices');
  const showSlicesOnly = show3DSolid && (showSlices || displayMode === 'slices');

  return (
    <>
      <DynamicLighting />
      <SceneAmbience />
      <SceneGrid />
      <Axes />
      <CameraController />

      <FunctionGraph visible={show2DCurve || show3DSolid} showShading={show2DCurve} />
      <RiemannRectangles visible={show2DRects} />

      {method === 'disk' && <DiskMethod visible={showSolid} />}
      {method === 'washer' && <WasherMethod visible={showSolid} />}
      {method === 'shell' && <ShellMethod visible={showSolid} />}

      <SliceVisualizer visible={showSlicesOnly} />

      <GizmoHelper alignment="bottom-right" margin={[50, 50]}>
        <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
      </GizmoHelper>
    </>
  );
}

/** Compact camera preset buttons — top-left corner */
function CameraPresets() {
  const { cameraView, setCameraView } = useSimulationStore();

  const presets = [
    { id: 'isometric' as const, label: '3D' },
    { id: 'top' as const, label: 'Top' },
    { id: 'front' as const, label: 'Front' },
    { id: 'side' as const, label: 'Side' },
  ];

  return (
    <div className="absolute top-3 left-3 flex gap-1 z-10">
      {presets.map((p) => (
        <button
          key={p.id}
          id={`camera-${p.id}`}
          onClick={() => setCameraView(p.id)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: cameraView === p.id
              ? 'rgba(139,92,246,0.3)' : 'rgba(0,0,0,0.5)',
            border: `1px solid ${cameraView === p.id ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
            color: cameraView === p.id ? 'rgb(196,181,253)' : 'rgba(255,255,255,0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

/** Zoom in / out overlay buttons — sit in the bottom-right corner above the gizmo */
function ZoomButtons() {
  const btnStyle = (label: string) => ({
    width: 34,
    height: 34,
    borderRadius: 8,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    fontSize: label === '+' ? 22 : 26,
    fontWeight: 700,
    lineHeight: 1,
    cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.55)',
    color: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.15s',
    userSelect: 'none' as const,
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60,      // above the gizmo (which sits at bottom-right ~50px)
        right: 12,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <button
        title="Zoom in"
        style={btnStyle('+')}
        onClick={() => _zoomFn?.(0.75)}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.35)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.6)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.55)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
      >
        +
      </button>
      <button
        title="Zoom out"
        style={btnStyle('−')}
        onClick={() => _zoomFn?.(1.35)}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.35)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.6)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.55)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'; }}
      >
        −
      </button>
    </div>
  );
}

/** Main exported Scene3D component */
export default function Scene3D() {
  return (
    <div className="relative w-full h-full">
      <CameraPresets />
      <ZoomButtons />

      {/* Drag hint */}
      <div
        className="absolute bottom-3 left-3 z-10 text-[11px] text-white/20 px-2 py-1 rounded-lg"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      >
        Drag to rotate · Scroll or +/− to zoom
      </div>

      <Canvas
        camera={{ position: [5, 3.5, 6], fov: 45, near: 0.01, far: 100 }}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        style={{ background: 'linear-gradient(135deg, #040408 0%, #080b12 50%, #0d1117 100%)' }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
