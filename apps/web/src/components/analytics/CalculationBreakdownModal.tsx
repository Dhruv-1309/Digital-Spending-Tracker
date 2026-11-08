import { useEffect, useRef } from 'react';
import { m } from 'motion/react';
import { EASING } from '../../ui/motion';
import { Button } from '../ui';
import { XIcon, CheckIcon } from '../icons';
import type { CalculationBreakdown } from '@moneytracker/shared';

// Fallback icon if CalculatorIcon is not available
function CalcGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="18" />
      <path d="M16 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 10h.01" />
      <path d="M12 14h.01" />
      <path d="M8 14h.01" />
      <path d="M12 18h.01" />
      <path d="M8 18h.01" />
    </svg>
  );
}

export interface CalculationBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  breakdown: CalculationBreakdown | null;
}

export function CalculationBreakdownModal({
  isOpen,
  onClose,
  breakdown,
}: CalculationBreakdownModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !breakdown) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calcModalTitle"
    >
      <m.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: EASING.out }}
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-surface border border-line-strong shadow-2 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-tint text-accent flex items-center justify-center shrink-0">
              <CalcGlyph size={18} />
            </div>
            <div>
              <h3 id="calcModalTitle" className="font-display font-semibold text-base sm:text-lg text-ink">
                {breakdown.title}
              </h3>
              <p className="text-xs text-ink-3">Transparent Math Breakdown (DIFF-4)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors duration-fast"
            aria-label="Close calculation breakdown"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs sm:text-sm">
          {/* Description */}
          <p className="text-ink-2 leading-relaxed">{breakdown.description}</p>

          {/* Formula Display Box */}
          <div className="p-3.5 rounded-xl bg-canvas border border-line font-mono text-xs text-ink">
            <span className="text-ink-3 block font-sans text-[11px] mb-1 font-semibold uppercase tracking-wider">
              Formula Equation:
            </span>
            <code className="text-accent font-semibold">{breakdown.formula}</code>
          </div>

          {/* Exact Inputs */}
          <div>
            <h4 className="font-sans font-semibold text-xs text-ink uppercase tracking-wider mb-2">
              Your Input Values:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-canvas p-3 rounded-xl border border-line">
              {Object.entries(breakdown.inputs).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between gap-2 py-0.5">
                  <span className="text-ink-3 text-xs">{key}:</span>
                  <span className="font-mono font-medium text-ink text-xs">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step Derivation */}
          <div>
            <h4 className="font-sans font-semibold text-xs text-ink uppercase tracking-wider mb-2">
              Step-by-Step Arithmetic:
            </h4>
            <div className="space-y-2">
              {breakdown.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-surface border border-line space-y-1 shadow-1"
                >
                  <span className="text-[11px] font-semibold text-accent block">{step.label}</span>
                  <div className="flex items-center justify-between gap-3 font-mono text-xs">
                    <span className="text-ink-2">{step.math}</span>
                    <span className="font-semibold text-ink">= {step.result}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conclusion */}
          <div className="p-3.5 rounded-xl bg-accent-tint/30 border border-accent/20">
            <span className="text-[11px] font-semibold text-accent block uppercase tracking-wider mb-1">
              Conclusion & Interpretation:
            </span>
            <p className="text-xs text-ink font-medium leading-relaxed">{breakdown.conclusion}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3.5 border-t border-line bg-surface">
          <Button type="button" variant="primary" size="md" onClick={onClose} icon={<CheckIcon size={16} />}>
            Got it
          </Button>
        </div>
      </m.div>
    </div>
  );
}
