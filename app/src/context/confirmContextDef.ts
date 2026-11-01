import { createContext } from 'react';

export interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'warning' | 'danger';
}

export interface ConfirmState {
  isOpen: boolean;
  message: string;
  title: string;
  confirmText: string;
  cancelText: string;
  variant: 'warning' | 'danger';
}

export interface ConfirmContextValue {
  confirmState: ConfirmState;
  showConfirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const ConfirmContext = createContext<ConfirmContextValue | undefined>(undefined);
