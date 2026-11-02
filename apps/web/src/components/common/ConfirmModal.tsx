import { useEffect, useRef } from 'react';
import { useConfirm } from '../../hooks/useConfirm';
import { AlertTriangleIcon, XIcon } from './icons';
import { Button } from './Button';

export function ConfirmModal() {
  const { confirmState, handleConfirm, handleCancel } = useConfirm();
  const { isOpen, message, title, confirmText, cancelText, variant } = confirmState;
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus moves to safe button first
    setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleCancel]);

  if (!isOpen) {
    return (
      <div
        id="confirmModal"
        className="confirm-modal hidden"
        aria-hidden="true"
        data-variant={variant}
      />
    );
  }

  const isDanger = variant === 'danger';

  return (
    <div
      id="confirmModal"
      className="confirm-modal active fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-hidden="false"
      data-variant={variant}
    >
      {/* Backdrop */}
      <div
        className="confirm-backdrop fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-base"
        data-confirm-close="true"
        onClick={handleCancel}
      />

      {/* Modal Dialog Card */}
      <div
        className="confirm-card relative z-10 w-full max-w-md bg-surface border border-line rounded-card shadow-warm-3 p-6 space-y-5 animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmTitle"
        aria-describedby="confirmMessage"
      >
        <div className="confirm-header flex items-start gap-4">
          <div
            id="confirmIcon"
            className={`confirm-icon p-3 rounded-full shrink-0 ${
              isDanger ? 'bg-danger-tint text-danger' : 'bg-warning-tint text-warning'
            }`}
          >
            <AlertTriangleIcon size={24} />
          </div>

          <div className="confirm-text flex-1">
            <h3 id="confirmTitle" className="font-display text-section-title font-semibold text-ink">
              {title}
            </h3>
            <p id="confirmMessage" className="mt-1 text-body-sm text-ink-2">
              {message}
            </p>
          </div>

          <button
            className="confirm-close p-1.5 rounded-btn hover:bg-surface-2 text-ink-3 hover:text-ink transition-colors"
            type="button"
            aria-label="Close confirmation"
            onClick={handleCancel}
          >
            <XIcon size={18} />
          </button>
        </div>

        <div className="confirm-actions flex items-center justify-end gap-3 pt-2">
          <Button
            ref={cancelBtnRef}
            id="confirmCancelBtn"
            variant="secondary"
            type="button"
            onClick={handleCancel}
          >
            {cancelText}
          </Button>

          <Button
            id="confirmOkBtn"
            variant={isDanger ? 'danger' : 'primary'}
            type="button"
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
