import { useConfirm } from '../../hooks/useConfirm';
import { ConfirmDialog } from '../ui/ConfirmDialog';

/**
 * Global Confirm Dialog Host (SPEC Section 5 & Phase 3 App Shell)
 * Swapped to the new ConfirmDialog primitive component while preserving
 * the ConfirmContext and useConfirm API contracts.
 */
export function ConfirmModal() {
  const { confirmState, handleConfirm, handleCancel } = useConfirm();

  return (
    <ConfirmDialog
      id="confirmModal"
      isOpen={confirmState.isOpen}
      title={confirmState.title}
      message={confirmState.message}
      confirmText={confirmState.confirmText}
      cancelText={confirmState.cancelText}
      variant={confirmState.variant === 'danger' ? 'danger' : 'primary'}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}

export default ConfirmModal;
