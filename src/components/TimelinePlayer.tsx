'use client';

import { useEffect, useRef } from 'react';
import { useSimulationStore, LEARNING_STEPS } from '@/store/useSimulationStore';

/* ─── Icon components ──────────────────────────────────────────────── */

function IconPlay() {
  return (
    <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function IconChevronLeft() {
  return (
    <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function IconReset() {
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

/* ─── TimelinePlayer ─────────────────────────────────────────────────── */

export default function TimelinePlayer() {
  const {
    isPlaying, setIsPlaying,
    stepIndex, nextStep, prevStep,
    animationSpeed, setAnimationSpeed,
    reset,
  } = useSimulationStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Auto-advance while playing */
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        const { stepIndex: si } = useSimulationStore.getState();
        if (si < LEARNING_STEPS.length - 1) {
          nextStep();
        } else {
          setIsPlaying(false);
        }
      }, 3000 / animationSpeed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, animationSpeed, nextStep, setIsPlaying]);

  /* Keyboard shortcuts */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
        case 'j':
          e.preventDefault();
          prevStep();
          break;
        case 'r':
          reset();
          break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPlaying, setIsPlaying, nextStep, prevStep, reset]);

  const isFirst = stepIndex === 0;
  const isLast  = stepIndex === LEARNING_STEPS.length - 1;

  /* Shared button base */
  const btnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 9,
    cursor: 'pointer',
    transition: 'all 0.18s',
    fontWeight: 600,
    fontSize: 13,
    border: '1px solid',
    lineHeight: 1,
  };

  const speedLabel = animationSpeed % 1 === 0
    ? `${animationSpeed}x`
    : `${animationSpeed}x`;

  return (
    <div
      style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 14px 14px',
        background: 'rgba(0,0,0,0.35)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* ── Navigation row ── */}
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>

        {/* Prev */}
        <button
          onClick={prevStep}
          disabled={isFirst}
          title="Previous step (← or J)"
          style={{
            ...btnBase,
            padding: '9px 13px',
            background: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.1)',
            color: isFirst ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
            cursor: isFirst ? 'not-allowed' : 'pointer',
          }}
        >
          <IconChevronLeft />
          Prev
        </button>

        {/* Play / Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause (Space)' : 'Auto-play (Space)'}
          style={{
            ...btnBase,
            flex: 1,
            padding: '9px',
            background: isPlaying
              ? 'rgba(244,63,94,0.16)'
              : 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
            borderColor: isPlaying ? 'rgba(244,63,94,0.45)' : 'rgba(139,92,246,0.45)',
            color: isPlaying ? 'rgb(251,113,133)' : 'rgb(196,181,253)',
            boxShadow: isPlaying
              ? '0 0 10px rgba(244,63,94,0.12)'
              : '0 0 10px rgba(139,92,246,0.12)',
          }}
        >
          {isPlaying ? <><IconPause /> Pause</> : <><IconPlay /> Play</>}
        </button>

        {/* Next */}
        <button
          onClick={nextStep}
          disabled={isLast}
          title="Next step (→ or L)"
          style={{
            ...btnBase,
            padding: '9px 13px',
            background: isLast
              ? 'rgba(255,255,255,0.04)'
              : 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.18))',
            borderColor: isLast ? 'rgba(255,255,255,0.08)' : 'rgba(139,92,246,0.4)',
            color: isLast ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.88)',
            cursor: isLast ? 'not-allowed' : 'pointer',
          }}
        >
          Next
          <IconChevronRight />
        </button>

        {/* Reset */}
        <button
          onClick={reset}
          title="Reset (R)"
          style={{
            ...btnBase,
            width: 38,
            height: 38,
            padding: 0,
            flexShrink: 0,
            background: 'rgba(255,255,255,0.04)',
            borderColor: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.38)',
          }}
        >
          <IconReset />
        </button>
      </div>

      {/* ── Speed control ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
          Speed
        </span>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.25}
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
          style={{ flex: 1 }}
        />
        <span
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'rgba(139,92,246,0.9)',
            flexShrink: 0,
            minWidth: 28,
            textAlign: 'right',
          }}
        >
          {speedLabel}
        </span>
      </div>

      {/* ── Keyboard hint ── */}
      <p
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.22)',
          textAlign: 'center',
          letterSpacing: '0.04em',
        }}
      >
        ← → step &nbsp;·&nbsp; Space play &nbsp;·&nbsp; R reset
      </p>
    </div>
  );
}
