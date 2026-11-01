import { useEffect } from 'react';
import { useConfirm } from '../../hooks/useConfirm';

export function ConfirmModal() {
  const { confirmState, handleConfirm, handleCancel } = useConfirm();
  const { isOpen, message, title, confirmText, cancelText, variant } = confirmState;

  useEffect(() => {
    if (!isOpen) return;

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

  return (
    <div
      id="confirmModal"
      className={`confirm-modal ${isOpen ? 'active' : ''}`}
      aria-hidden={!isOpen}
      data-variant={variant}
    >
      <div
        className="confirm-backdrop"
        data-confirm-close="true"
        onClick={handleCancel}
      />
      <div
        className="confirm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmTitle"
        aria-describedby="confirmMessage"
      >
        <div className="confirm-header">
          <div className="confirm-icon" id="confirmIcon">
            <i className="fas fa-triangle-exclamation"></i>
          </div>
          <div className="confirm-text">
            <h3 id="confirmTitle">{title}</h3>
            <p id="confirmMessage">{message}</p>
          </div>
          <button
            className="confirm-close"
            type="button"
            aria-label="Close confirmation"
            onClick={handleCancel}
          >
            <i className="fas fa-xmark"></i>
          </button>
        </div>
        <div className="confirm-actions">
          <button
            id="confirmCancelBtn"
            className="btn confirm-btn confirm-btn--ghost"
            type="button"
            onClick={handleCancel}
          >
            {cancelText}
          </button>
          <button
            id="confirmOkBtn"
            className={`btn confirm-btn ${
              variant === 'danger' ? 'confirm-btn--danger' : 'confirm-btn--primary'
            }`}
            type="button"
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
