import { useEffect, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import type { ToastItem, ToastType } from '../../types';

const iconMap: Record<ToastType, string> = {
  success: 'fa-check-circle',
  error: 'fa-circle-xmark',
  warning: 'fa-triangle-exclamation',
  info: 'fa-circle-info',
};

interface ToastElementProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

function ToastElement({ toast, onDismiss }: ToastElementProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setVisible(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 200);
  };

  const safeType = iconMap[toast.type] ? toast.type : 'info';
  const iconClass = iconMap[safeType];

  return (
    <div
      className={`toast toast--${safeType} ${visible ? 'toast--show' : 'toast--hide'}`}
      role="status"
    >
      <div className="toast__icon">
        <i className={`fas ${iconClass}`}></i>
      </div>
      <div className="toast__content">{toast.message}</div>
      <button
        className="toast__close"
        type="button"
        aria-label="Close notification"
        onClick={handleClose}
      >
        <i className="fas fa-xmark"></i>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      id="toastContainer"
      className="toast-container"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastElement
          key={toast.id}
          toast={toast}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
}
