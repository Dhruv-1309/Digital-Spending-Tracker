import { createContext } from 'react';
import type { ToastItem, ToastType, ToastAction } from '../types';

export interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (
    message: string,
    type?: ToastType,
    duration?: number,
    action?: ToastAction,
  ) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
