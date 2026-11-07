import React, { useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { AlertTriangleIcon, XIcon } from '../icons';
import { Button } from './Button';
import { EASING } from '../../ui/motion';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  id?: string;
}

/**
 * ConfirmDialog Primitive (SPEC Section 4 & 5)
 * Centered modal dialog with shadow-3, focus moved to safe button first,
 * destructive confirm in danger token, backdrop click and Escape to close,
 * focus trapping, and exit animation via Motion.
 */
export function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
  id = 'confirmDialog',
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Save previous focus and move focus to safe button on open
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus safe button (Cancel) first
      setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Handle Escape key and focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id={id}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop with 200ms fade */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.20 }}
            onClick={onCancel}
            aria-hidden="true"
            className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]"
          />

          {/* Modal Card with 320ms in, 220ms out */}
          <m.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-message`}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: 12,
              scale: 0.98,
              transition: { duration: 0.22, ease: EASING.in },
            }}
            transition={{
              duration: 0.32,
              ease: EASING.out,
            }}
            className="relative z-10 w-full max-w-md rounded-card bg-surface border border-line shadow-3 p-6 sm:p-7 flex flex-col gap-5 focus:outline-none"
          >
            {/* Header */}
            <div className="flex items-start gap-4">
              <div
                className={`p-2.5 rounded-card shrink-0 flex items-center justify-center ${
                  variant === 'danger'
                    ? 'bg-danger-tint text-danger'
                    : 'bg-accent-tint text-accent'
                }`}
              >
                <AlertTriangleIcon size={24} />
              </div>

              <div className="flex-1 flex flex-col gap-1 pr-6">
                <h3 id={`${id}-title`} className="font-display text-lg font-semibold text-ink">
                  {title}
                </h3>
                <div id={`${id}-message`} className="text-sm text-ink-2 leading-relaxed">
                  {message}
                </div>
              </div>

              <button
                type="button"
                aria-label="Close dialog"
                onClick={onCancel}
                className="absolute top-5 right-5 p-1 rounded-chip text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Actions: Safe button first */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                ref={cancelBtnRef}
                type="button"
                onClick={onCancel}
                className="h-10 px-4 rounded-btn border border-line-strong bg-surface text-ink text-sm font-medium hover:bg-surface-2 transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {cancelText}
              </button>

              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                size="md"
                onClick={onConfirm}
              >
                {confirmText}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmDialog;
