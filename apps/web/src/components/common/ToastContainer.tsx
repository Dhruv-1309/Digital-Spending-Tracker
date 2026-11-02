import { useEffect, useState, useRef } from 'react';
import { useToast } from '../../hooks/useToast';
import type { ToastItem, ToastType } from '../../types';
import { CheckCircleIcon, AlertCircleIcon, AlertTriangleIcon, XIcon } from './icons';

interface ToastElementProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

function ToastElement({ toast, onDismiss }: ToastElementProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(0);
  const remainingTimeRef = useRef<number>(toast.duration || 4000);
  const totalDuration = toast.duration || 4000;

  useEffect(() => {
    if (isPaused) return;

    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newRemaining = Math.max(remainingTimeRef.current - elapsed, 0);
      setProgress((newRemaining / totalDuration) * 100);

      if (newRemaining <= 0) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      remainingTimeRef.current = Math.max(remainingTimeRef.current - (Date.now() - startTimeRef.current), 0);
    };
  }, [isPaused, onDismiss, toast.id, totalDuration]);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon size={20} className="text-income" />;
      case 'error':
        return <AlertCircleIcon size={20} className="text-danger" />;
      case 'warning':
        return <AlertTriangleIcon size={20} className="text-warning" />;
      default:
        return <AlertCircleIcon size={20} className="text-accent" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-income/30 bg-surface';
      case 'error':
        return 'border-danger/30 bg-surface';
      case 'warning':
        return 'border-warning/30 bg-surface';
      default:
        return 'border-accent/30 bg-surface';
    }
  };

  const role = toast.type === 'error' ? 'alert' : 'status';

  return (
    <div
      role={role}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className={`toast toast--${toast.type} relative flex flex-col w-full max-w-sm rounded-btn border shadow-warm-2 overflow-hidden transition-all duration-base ${getBorderColor(
        toast.type,
      )}`}
    >
      <div className="flex items-center gap-3 p-3.5">
        <div className="toast__icon shrink-0">{getIcon(toast.type)}</div>
        <div className="toast__content flex-1 text-body-sm font-medium text-ink">{toast.message}</div>
        <button
          type="button"
          className="toast__close p-1 rounded-btn hover:bg-surface-2 text-ink-3 hover:text-ink transition-colors shrink-0"
          aria-label="Close notification"
          onClick={() => onDismiss(toast.id)}
        >
          <XIcon size={16} />
        </button>
      </div>

      {/* Timer Bar */}
      <div className="h-1 w-full bg-surface-2 overflow-hidden">
        <div
          className={`h-full origin-left transition-transform duration-75 ${
            toast.type === 'error'
              ? 'bg-danger'
              : toast.type === 'success'
              ? 'bg-income'
              : toast.type === 'warning'
              ? 'bg-warning'
              : 'bg-accent'
          }`}
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  const visibleToasts = toasts.slice(-3);

  return (
    <div
      id="toastContainer"
      className="toast-container fixed z-50 flex flex-col gap-2 pointer-events-none p-4 max-sm:top-0 max-sm:inset-x-0 max-sm:items-center sm:bottom-4 sm:right-4 sm:items-end"
      aria-live="polite"
      aria-atomic="true"
    >
      {visibleToasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full max-w-sm">
          <ToastElement toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  );
}
