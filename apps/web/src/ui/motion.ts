/**
 * MoneyTracker Motion Constants and Helpers (SPEC Section 4)
 * Source of truth: docs/redesign/SPEC.md
 * NOTE: Kept in src/ui/ so src/lib stays free of React/UI logic.
 */

import { useState, useEffect } from 'react';
import { useReducedMotion as useMotionReducedMotion } from 'motion/react';

// Duration in seconds (standard for motion/react transitions)
export const DURATION = {
  fast: 0.12,   // 120ms: hover, press, color changes
  base: 0.20,   // 200ms: dropdowns, toasts, tab indicator
  slow: 0.32,   // 320ms: modals, section reveals
  chart: 0.60,  // 600ms: chart entrance, progress fill
} as const;

// Duration in milliseconds (for setTimeout / Chart.js / CSS helpers)
export const DURATION_MS = {
  fast: 120,
  base: 200,
  slow: 320,
  chart: 600,
} as const;

// Bezier curve control points for motion/react transition easing
export const EASING = {
  standard: [0.2, 0, 0, 1] as const,
  out: [0.16, 1, 0.3, 1] as const,      // Entrances
  in: [0.4, 0, 1, 1] as const,          // Exits
} as const;

// CSS cubic-bezier string representations
export const EASING_CSS = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

/**
 * Hook to detect whether the user prefers reduced motion (SPEC Section 4 rule 9).
 * Returns true if prefers-reduced-motion: reduce is active.
 */
export function useReducedMotion(): boolean {
  const motionReduced = useMotionReducedMotion();
  const [mediaQueryMatches, setMediaQueryMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setMediaQueryMatches(e.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return Boolean(motionReduced ?? mediaQueryMatches);
}
