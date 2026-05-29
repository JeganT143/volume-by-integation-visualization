'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  useSimulationStore,
  STEP_EXPLANATIONS,
  LEARNING_STEPS,
  STEP_LABELS,
} from '@/store/useSimulationStore';

export default function ExplanationPanel() {
  const { currentStep, stepIndex, setStepIndex, setCurrentStep } = useSimulationStore();
  const data = STEP_EXPLANATIONS[currentStep];

  function jumpTo(index: number) {
    setStepIndex(index);
    setCurrentStep(LEARNING_STEPS[index]);
  }

  return (
    <div
      className="glass-card"
      style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      {/* ── Step progress ── */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(139,92,246,0.9)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Step {stepIndex + 1} / {LEARNING_STEPS.length}
          </span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', fontWeight: 500 }}>
            {STEP_LABELS[currentStep]}
          </span>
        </div>

        {/* Clickable step segments */}
        <div style={{ display: 'flex', gap: 4 }} role="tablist" aria-label="Learning steps">
          {LEARNING_STEPS.map((step, index) => {
            const done    = index < stepIndex;
            const current = index === stepIndex;
            return (
              <button
                key={step}
                role="tab"
                aria-selected={current}
                aria-label={`Step ${index + 1}: ${STEP_LABELS[step]}`}
                title={`Step ${index + 1}: ${STEP_LABELS[step]}`}
                onClick={() => jumpTo(index)}
                style={{
                  flex: 1,
                  height: current ? 8 : 5,
                  borderRadius: 4,
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.35s ease',
                  background: done
                    ? 'rgb(16,185,129)'
                    : current
                    ? 'rgb(139,92,246)'
                    : 'rgba(255,255,255,0.1)',
                  boxShadow: current ? '0 0 8px rgba(139,92,246,0.5)' : 'none',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ── Animated step content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -14 }}
          transition={{ duration: 0.28 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1.3,
            }}
          >
            {data.title}
          </h2>
          <p
            style={{
              fontSize: 15,
              color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.7,
            }}
          >
            {data.body}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
