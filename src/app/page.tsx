'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import ControlsPanel from '@/components/ControlsPanel';
import FormulaPanel from '@/components/FormulaPanel';
import ExplanationPanel from '@/components/ExplanationPanel';
import TimelinePlayer from '@/components/TimelinePlayer';
import { useSimulationStore } from '@/store/useSimulationStore';

const Scene3D = dynamic(() => import('@/components/Scene3D'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: '#040408' }}
    >
      <div className="text-center">
        <div
          className="float"
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            margin: '0 auto 14px',
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
            border: '1px solid rgba(139,92,246,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
          }}
        >
          ∫
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Loading 3D Engine…</p>
      </div>
    </div>
  ),
});

/* ─── Method selector ─────────────────────────────────────────────────── */

const METHODS = [
  { id: 'disk'   as const, label: 'Disk',   formula: 'π∫f²dx' },
  { id: 'washer' as const, label: 'Washer', formula: 'π∫(R²−r²)dx' },
  { id: 'shell'  as const, label: 'Shell',  formula: '2π∫xf dx' },
];

function MethodSelector() {
  const { method, setMethod } = useSimulationStore();

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        padding: '10px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}
    >
      {METHODS.map((m) => {
        const active = method === m.id;
        return (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            style={{
              flex: 1,
              padding: '8px 4px',
              borderRadius: 10,
              border: `1px solid ${active ? 'rgba(139,92,246,0.55)' : 'rgba(255,255,255,0.08)'}`,
              background: active
                ? 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.18))'
                : 'rgba(255,255,255,0.03)',
              color: active ? 'rgb(196,181,253)' : 'rgba(255,255,255,0.45)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center' as const,
              boxShadow: active ? '0 0 12px rgba(139,92,246,0.12)' : 'none',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</div>
            <div
              style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                opacity: 0.55,
                marginTop: 2,
                letterSpacing: '0.02em',
              }}
            >
              {m.formula}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Revolution angle control ────────────────────────────────────────── */

const DEGREE_PRESETS = [45, 90, 180, 270, 360] as const;

function RevolutionControl() {
  const { revolutionAngle, setRevolutionAngle } = useSimulationStore();
  const degrees = Math.round((revolutionAngle / (2 * Math.PI)) * 360);

  return (
    <div
      style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
        background: 'rgba(52,211,153,0.03)',
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.45)',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
          }}
        >
          Revolution Angle
        </span>

        {/* Degree preset chips */}
        <div style={{ display: 'flex', gap: 4 }}>
          {DEGREE_PRESETS.map((deg) => {
            const active = degrees === deg;
            return (
              <button
                key={deg}
                onClick={() => setRevolutionAngle((deg * Math.PI) / 180)}
                style={{
                  padding: '2px 7px',
                  borderRadius: 5,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  border: `1px solid ${active ? 'rgba(52,211,153,0.55)' : 'rgba(255,255,255,0.08)'}`,
                  background: active ? 'rgba(52,211,153,0.14)' : 'rgba(255,255,255,0.03)',
                  color: active ? 'rgb(52,211,153)' : 'rgba(255,255,255,0.35)',
                }}
              >
                {deg}°
              </button>
            );
          })}
        </div>
      </div>

      {/* Slider + live readout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="range"
          min={1}
          max={360}
          step={1}
          value={degrees}
          onChange={(e) =>
            setRevolutionAngle((parseInt(e.target.value) * Math.PI) / 180)
          }
          style={{ flex: 1 }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 15,
            fontWeight: 700,
            color: 'rgb(52,211,153)',
            minWidth: 44,
            textAlign: 'right',
          }}
        >
          {degrees}°
        </span>
      </div>
    </div>
  );
}

/* ─── Params summary / toggle bar ─────────────────────────────────────── */

function ParamsSummaryBar({
  showParams,
  onToggle,
}: {
  showParams: boolean;
  onToggle: () => void;
}) {
  const { expression, boundsA, boundsB, sliceCount } = useSimulationStore();

  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%',
        padding: '7px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: showParams ? 'rgba(139,92,246,0.07)' : 'transparent',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.2s',
        gap: 8,
      }}
    >
      {/* Summary chips */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflow: 'hidden',
          flexShrink: 1,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'rgb(52,211,153)',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          f(x) = {expression}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>
          [{boundsA}, {boundsB}]
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>
          n = {sliceCount}
        </span>
      </div>

      {/* Toggle label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          color: showParams ? 'rgba(196,181,253,0.8)' : 'rgba(255,255,255,0.38)',
          flexShrink: 0,
        }}
      >
        <span>{showParams ? 'Close' : 'Edit'}</span>
        <svg
          style={{
            width: 13,
            height: 13,
            transform: showParams ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>
  );
}

/* ─── Root page ──────────────────────────────────────────────────────────── */

export default function Page() {
  const [showParams, setShowParams] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: '#040408',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <header
        className="header-glow"
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.28), rgba(139,92,246,0.28))',
            border: '1px solid rgba(139,92,246,0.45)',
            boxShadow: '0 0 12px rgba(139,92,246,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          ∫
        </div>
        <div>
          <h1
            className="gradient-text"
            style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}
          >
            Volume Integration Visualizer
          </h1>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.25 }}>
            Solids of Revolution · Interactive 3D Calculus
          </p>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left: 3D Scene */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{ flex: '0 0 55%', position: 'relative', overflow: 'hidden', minWidth: 0 }}
        >
          <Scene3D />
        </motion.div>

        {/* Right: Educational Panel */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{
            flex: '0 0 45%',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(4,4,8,0.97)',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {/* Always-visible method selector */}
          <MethodSelector />

          {/* Always-visible revolution angle control */}
          <RevolutionControl />

          {/* Params summary + toggle */}
          <ParamsSummaryBar
            showParams={showParams}
            onToggle={() => setShowParams((v) => !v)}
          />

          {/* Expandable parameters drawer */}
          <AnimatePresence>
            {showParams && (
              <motion.div
                key="params-drawer"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                style={{
                  overflow: 'hidden',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    padding: '14px',
                    maxHeight: '42vh',
                    overflowY: 'auto',
                  }}
                >
                  <ControlsPanel />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scrollable learning content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <ExplanationPanel />
            <FormulaPanel />
          </div>

          {/* Fixed navigation bar */}
          <TimelinePlayer />
        </motion.aside>
      </main>
    </div>
  );
}
