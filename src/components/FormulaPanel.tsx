'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useSimulationStore,
  STEP_EXPLANATIONS,
} from '@/store/useSimulationStore';
import {
  parseFunction,
  diskMethodVolume,
  washerMethodVolume,
  shellMethodVolume,
  riemannSum,
} from '@/lib/math';

import 'katex/dist/katex.min.css';
import katex from 'katex';

/* ─── Inline KaTeX renderer ──────────────────────────────────────────── */

function Formula({
  latex,
  display = true,
}: {
  latex: string;
  display?: boolean;
}) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    try {
      setHtml(
        katex.renderToString(latex, {
          displayMode: display,
          throwOnError: false,
          trust: false,
          strict: false,
        }),
      );
    } catch {
      setHtml('');
    }
  }, [latex, display]);
  return <div className="formula-highlight" dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ─── FormulaPanel ───────────────────────────────────────────────────── */

export default function FormulaPanel() {
  const {
    currentStep, method,
    expression, innerExpression,
    boundsA, boundsB, sliceCount,
    exactVolume, approximateVolume,
    setExactVolume, setApproximateVolume,
    setIsExpressionValid,
  } = useSimulationStore();

  /* Volume computation — lives here so it always runs even when
     the params drawer is collapsed and ControlsPanel is unmounted. */
  useEffect(() => {
    const fn      = parseFunction(expression);
    const innerFn = parseFunction(innerExpression);

    if (!fn) {
      setIsExpressionValid(false);
      setExactVolume(0);
      setApproximateVolume(0);
      return;
    }
    setIsExpressionValid(true);

    let vol = 0;
    if (method === 'disk')                  vol = diskMethodVolume(fn, boundsA, boundsB);
    else if (method === 'washer' && innerFn) vol = washerMethodVolume(fn, innerFn, boundsA, boundsB);
    else if (method === 'shell')             vol = shellMethodVolume(fn, boundsA, boundsB);

    setExactVolume(Math.max(0, vol));

    const { total } = riemannSum(fn, boundsA, boundsB, sliceCount);
    setApproximateVolume(total);
  }, [
    expression, innerExpression,
    boundsA, boundsB, sliceCount, method,
    setExactVolume, setApproximateVolume, setIsExpressionValid,
  ]);

  /* Formula to display */
  const stepData = STEP_EXPLANATIONS[currentStep];
  const methodFormulas: Record<string, string> = {
    disk:   `V = \\pi \\int_{${boundsA}}^{${boundsB}} [f(x)]^2\\,dx`,
    washer: `V = \\pi \\int_{${boundsA}}^{${boundsB}} \\left[R(x)^2 - r(x)^2\\right]\\,dx`,
    shell:  `V = 2\\pi \\int_{${boundsA}}^{${boundsB}} x\\,f(x)\\,dx`,
  };
  const displayFormula =
    currentStep === 'formula' ? methodFormulas[method] : stepData?.formula;

  /* Approximation error */
  const error =
    exactVolume > 0
      ? Math.abs((approximateVolume - exactVolume) / exactVolume) * 100
      : null;

  const card: React.CSSProperties = {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: '12px 14px',
  };

  return (
    <div
      className="glass-card"
      style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      {/* Section label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgb(6,182,212)',
            boxShadow: '0 0 6px rgba(6,182,212,0.7)',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(6,182,212,0.9)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Mathematics
        </span>
      </div>

      {/* Current function */}
      <div style={card}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginBottom: 6 }}>
          Current function:
        </p>
        <Formula latex={`f(x) = ${expression}`} display={false} />
      </div>

      {/* Step formula */}
      <AnimatePresence mode="wait">
        {displayFormula ? (
          <motion.div
            key={`${currentStep}-${method}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            style={{
              ...card,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 80,
            }}
          >
            <Formula latex={displayFormula} display={true} />
          </motion.div>
        ) : (
          <motion.div
            key="formula-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              ...card,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 68,
              background: 'rgba(0,0,0,0.18)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
              Advance through the steps to see formulas
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Volume results — always shown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Riemann approximation */}
        <div
          style={{
            padding: '12px',
            borderRadius: 10,
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.22)',
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: 'rgba(251,191,36,0.65)',
              marginBottom: 6,
              lineHeight: 1.3,
            }}
          >
            Riemann Sum
            <br />
            <span style={{ fontFamily: 'var(--font-mono)' }}>n = {sliceCount}</span>
          </p>
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'rgb(251,191,36)',
            }}
          >
            {approximateVolume > 0 ? approximateVolume.toFixed(4) : '—'}
          </p>
        </div>

        {/* Exact integral */}
        <div
          style={{
            padding: '12px',
            borderRadius: 10,
            background: 'rgba(6,182,212,0.08)',
            border: '1px solid rgba(6,182,212,0.22)',
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: 'rgba(34,211,238,0.65)',
              marginBottom: 6,
              lineHeight: 1.3,
            }}
          >
            Exact Volume
            <br />
            <span style={{ fontFamily: 'var(--font-mono)' }}>∫ computed</span>
          </p>
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'rgb(34,211,238)',
            }}
          >
            {exactVolume > 0 ? exactVolume.toFixed(4) : '—'}
          </p>
        </div>
      </div>

      {/* Error percentage */}
      {error !== null && exactVolume > 0 && (
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', textAlign: 'center' }}>
          Approximation error:{' '}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color:
                error < 1
                  ? 'rgb(52,211,153)'
                  : error < 5
                  ? 'rgb(251,191,36)'
                  : 'rgb(248,113,113)',
            }}
          >
            {error.toFixed(2)}%
          </span>
        </p>
      )}
    </div>
  );
}
