import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { CheckCircleIcon, AlertCircleIcon, AlertTriangleIcon, InfoIcon, XIcon } from '../icons';
import { EASING } from '../../ui/motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItemUI {
  id: string;
  type: ToastType;
  message: React.ReactNode;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastProps {
  toast: ToastItemUI;
  onDismiss: (id: string) => void;
  className?: string;
}

const toastTypeStyles: Record<
  ToastType,
  { icon: React.ReactNode; barColor: string; role: 'status' | 'alert' }
> = {
  success: {
    icon: <CheckCircleIcon size={20} className="text-income shrink-0" />,
    barColor: 'bg-income',
    role: 'status',
  },
  error: {
    icon: <AlertCircleIcon size={20} className="text-danger shrink-0" />,
    barColor: 'bg-danger',
    role: 'alert',
  },
  warning: {
    icon: <AlertTriangleIcon size={20} className="text-warning shrink-0" />,
    barColor: 'bg-warning',
    role: 'status',
  },
  info: {
    icon: <InfoIcon size={20} className="text-accent shrink-0" />,
    barColor: 'bg-accent',
    role: 'status',
  },
};

/**
 * Toast Element Primitive (SPEC Section 4 & 5)
 * - Icon, message, close button, timer bar
 * - Pauses timer on mouse hover and keyboard focus
 * - Timer bar scaleX from 1 to 0 over its duration
 * - Motion exit animation (rises 16px and fades in 200ms, exit 140ms)
 */
export function Toast({ toast, onDismiss, className = '' }: ToastProps) {
  const duration = toast.duration ?? 4000;
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const lastTickRef = useRef<number | null>(null);

  const config = toastTypeStyles[toast.type] || toastTypeStyles.info;

  useEffect(() => {
    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const prevTick = lastTickRef.current ?? now;
      const delta = now - prevTick;
      lastTickRef.current = now;

      if (!isPaused) {
        setTimeLeft((prev) => {
          const next = prev - delta;
          if (next <= 0) {
            clearInterval(interval);
            onDismiss(toast.id);
            return 0;
          }
          return next;
        });
      }
    }, 25);

    return () => clearInterval(interval);
  }, [isPaused, duration, onDismiss, toast.id]);

  const progress = Math.max(0, Math.min(1, timeLeft / duration));

  return (
    <m.div
      layout
      role={config.role}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      tabIndex={0}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.14, ease: EASING.in } }}
      transition={{ duration: 0.20, ease: EASING.out }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        lastTickRef.current = Date.now();
        setIsPaused(false);
      }}
      onFocus={() => setIsPaused(true)}
      onBlur={() => {
        lastTickRef.current = Date.now();
        setIsPaused(false);
      }}
      className={`relative overflow-hidden w-80 sm:w-96 rounded-btn bg-surface border border-line shadow-2 p-3.5 flex items-start gap-3 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${className}`}
    >
      <span className="mt-0.5">{config.icon}</span>

      <div className="flex-1 text-sm font-sans text-ink leading-snug break-words">
        {toast.message}
        {toast.action && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
            className="ml-2 font-medium text-accent underline hover:no-underline focus-visible:outline-none"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        aria-label="Close notification"
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-chip text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <XIcon size={16} />
      </button>

      {/* Timer Bar scaleX from 1 to 0 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-2">
        <div
          aria-hidden="true"
          className={`h-full w-full ${config.barColor}`}
          style={{
            transform: `scaleX(${progress})`,
            transformOrigin: 'left center',
          }}
        />
      </div>
    </m.div>
  );
}

export interface ToastContainerUIProps {
  toasts: ToastItemUI[];
  onDismiss: (id: string) => void;
  className?: string;
}

/**
 * ToastContainer Primitive (SPEC Section 4 & 5)
 * Stacks toasts with 8px gaps, max 3 visible,
 * bottom-right on desktop, top-center on mobile.
 */
export function ToastContainerUI({
  toasts,
  onDismiss,
  className = '',
}: ToastContainerUIProps) {
  const visibleToasts = toasts.slice(-3);

  return (
    <div
      id="toastContainer"
      data-testid="toast-container"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed z-[100] pointer-events-none flex flex-col gap-2 p-4 bottom-4 right-4 sm:bottom-6 sm:right-6 max-sm:top-4 max-sm:inset-x-0 max-sm:items-center max-sm:p-3 ${className}`}
    >
      <div className="pointer-events-auto flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {visibleToasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Toast;
