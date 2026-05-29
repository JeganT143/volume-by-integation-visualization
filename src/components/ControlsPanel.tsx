'use client';

import { useState, useCallback } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { parseFunction } from '@/lib/math';

const PRESET_FUNCTIONS = [
  { label: 'x²',     value: 'x^2' },
  { label: 'sin(x)', value: 'sin(x)' },
  { label: '√x',     value: 'sqrt(x)' },
  { label: 'eˣ',     value: 'exp(x)' },
  { label: '1/x',    value: '1/x' },
  { label: 'cos(x)', value: 'cos(x)' },
];

const DISPLAY_MODES = [
  { id: 'solid'       as const, label: 'Solid' },
  { id: 'transparent' as const, label: 'Glass' },
  { id: 'wireframe'   as const, label: 'Wire'  },
  { id: 'slices'      as const, label: 'Slices'},
];

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.45)',
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: 8,
};

export default function ControlsPanel() {
  const {
    expression, setExpression,
    innerExpression, setInnerExpression,
    boundsA, setBoundsA,
    boundsB, setBoundsB,
    sliceCount, setSliceCount,
    method,
    displayMode, setDisplayMode,
    setIsExpressionValid,
  } = useSimulationStore();

  const [localExpr, setLocalExpr]   = useState(expression);
  const [localInner, setLocalInner] = useState(innerExpression);
  const [exprValid, setExprValid]   = useState(true);

  const handleExprChange = useCallback(
    (val: string) => {
      setLocalExpr(val);
      const fn    = parseFunction(val);
      const valid = fn !== null;
      setExprValid(valid);
      setIsExpressionValid(valid);
      if (valid) setExpression(val);
    },
    [setExpression, setIsExpressionValid],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Function ── */}
      <div>
        <p style={sectionLabel}>Function f(x)</p>

        <div style={{ position: 'relative', marginBottom: 8 }}>
          <span
            style={{
              position: 'absolute', left: 12,
              top: '50%', transform: 'translateY(-50%)',
              fontFamily: 'var(--font-mono)', fontSize: 13,
              color: 'rgba(255,255,255,0.28)',
              pointerEvents: 'none',
            }}
          >
            y =
          </span>
          <input
            type="text"
            value={localExpr}
            onChange={(e) => handleExprChange(e.target.value)}
            className={`input-field ${exprValid ? '' : 'invalid'}`}
            placeholder="x^2"
            spellCheck={false}
            style={{ paddingLeft: 44 }}
          />
          <span
            style={{
              position: 'absolute', right: 12,
              top: '50%', transform: 'translateY(-50%)',
              width: 8, height: 8, borderRadius: '50%',
              background: exprValid ? '#10b981' : '#f43f5e',
              transition: 'background 0.2s',
            }}
          />
        </div>

        {!exprValid && (
          <p style={{ fontSize: 12, color: 'rgb(251,113,133)', marginBottom: 8 }}>
            Invalid expression — try: x^2, sin(x), sqrt(x)
          </p>
        )}

        {/* Preset chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PRESET_FUNCTIONS.map((p) => {
            const active = expression === p.value;
            return (
              <button
                key={p.value}
                onClick={() => { setLocalExpr(p.value); handleExprChange(p.value); }}
                style={{
                  padding: '5px 11px',
                  borderRadius: 7,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: active ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: active ? 'rgb(196,181,253)' : 'rgba(255,255,255,0.5)',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Washer inner function ── */}
      {method === 'washer' && (
        <div>
          <p style={sectionLabel}>
            Inner function g(x)
            <span style={{ textTransform: 'none', fontWeight: 400, opacity: 0.6 }}> — the hole</span>
          </p>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute', left: 12,
                top: '50%', transform: 'translateY(-50%)',
                fontFamily: 'var(--font-mono)', fontSize: 13,
                color: 'rgba(255,255,255,0.28)',
                pointerEvents: 'none',
              }}
            >
              g =
            </span>
            <input
              type="text"
              value={localInner}
              onChange={(e) => {
                setLocalInner(e.target.value);
                const fn = parseFunction(e.target.value);
                if (fn) setInnerExpression(e.target.value);
              }}
              className="input-field"
              placeholder="x"
              spellCheck={false}
              style={{ paddingLeft: 44 }}
            />
          </div>
        </div>
      )}

      {/* ── Integration bounds ── */}
      <div>
        <p style={sectionLabel}>Integration Bounds</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginBottom: 5 }}>Lower (a)</div>
            <input
              type="number"
              value={boundsA}
              step={0.5}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v < boundsB) setBoundsA(v);
              }}
              className="input-field"
              style={{ textAlign: 'center' }}
            />
          </div>
          <div style={{ paddingBottom: 10, color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>→</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginBottom: 5 }}>Upper (b)</div>
            <input
              type="number"
              value={boundsB}
              step={0.5}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v > boundsA) setBoundsB(v);
              }}
              className="input-field"
              style={{ textAlign: 'center' }}
            />
          </div>
        </div>
      </div>

      {/* ── Number of slices ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ ...sectionLabel, marginBottom: 0 }}>Number of Slices</p>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 15,
              fontWeight: 700,
              color: 'rgb(167,139,250)',
            }}
          >
            {sliceCount}
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={50}
          step={1}
          value={sliceCount}
          onChange={(e) => setSliceCount(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'rgba(255,255,255,0.22)',
            marginTop: 4,
          }}
        >
          <span>1 — rough</span>
          <span>50 — fine</span>
        </div>
      </div>

      {/* ── 3D Display mode ── */}
      <div>
        <p style={sectionLabel}>3D Display Mode</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          {DISPLAY_MODES.map((m) => {
            const active = displayMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setDisplayMode(m.id)}
                style={{
                  padding: '8px 4px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  background: active ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? 'rgba(6,182,212,0.45)' : 'rgba(255,255,255,0.07)'}`,
                  color: active ? 'rgb(34,211,238)' : 'rgba(255,255,255,0.4)',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
