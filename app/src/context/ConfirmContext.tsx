import React, { useState, useCallback, useRef } from 'react';
import { ConfirmContext, type ConfirmOptions, type ConfirmState } from './confirmContextDef';

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    message: '',
    title: 'Please confirm',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'warning',
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const showConfirm = useCallback((message: string, options: ConfirmOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setConfirmState({
        isOpen: true,
        message,
        title: options.title || 'Please confirm',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'warning',
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider
      value={{ confirmState, showConfirm, handleConfirm, handleCancel }}
    >
      {children}
    </ConfirmContext.Provider>
  );
}
