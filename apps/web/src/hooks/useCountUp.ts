import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '../ui/motion';

export interface UseCountUpOptions {
  duration?: number; // defaults to 800 ms
}

/**
 * useCountUp Hook (SPEC Section 4 rule 7)
 * Animates a numeric value from its previous value (0 on first load) to targetValue
 * over 800ms using requestAnimationFrame and ease-out.
 * Under prefers-reduced-motion: reduce, returns targetValue immediately without animation.
 * The final value is present in the DOM text from the first render.
 */
export function useCountUp(
  targetValue: number,
  options: UseCountUpOptions = {},
): number {
  const { duration = 800 } = options;
  const prefersReduced = useReducedMotion();

  // The final value is rendered immediately on the first render
  const [displayValue, setDisplayValue] = useState<number>(targetValue);

  // Track previous target value; starts at 0 for first load
  const prevTargetRef = useRef<number>(0);
  const isFirstMountRef = useRef<boolean>(true);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Under reduced motion there is no count-up
    if (prefersReduced) {
      prevTargetRef.current = targetValue;
      return;
    }

    const startValue = isFirstMountRef.current ? 0 : prevTargetRef.current;
    isFirstMountRef.current = false;
    prevTargetRef.current = targetValue;

    // If starting and target value are identical, nothing to animate
    if (startValue === targetValue) {
      return;
    }

    const startTime = performance.now();

    // ease-out cubic
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOut(progress);

      const nextVal = startValue + (targetValue - startValue) * easedProgress;
      setDisplayValue(Math.round(nextVal));

      if (progress < 1) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayValue(targetValue);
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [targetValue, duration, prefersReduced]);

  if (prefersReduced) {
    return targetValue;
  }

  return displayValue;
}

export default useCountUp;
