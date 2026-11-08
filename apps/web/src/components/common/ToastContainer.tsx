import { useToast } from '../../hooks/useToast';
import { ToastContainerUI } from '../ui/Toast';

/**
 * Global Toast Host (SPEC Section 5 & Phase 3 App Shell)
 * Swapped to the new Toast primitive component while preserving
 * the ToastContext and useToast API contracts.
 */
export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return <ToastContainerUI toasts={toasts} onDismiss={dismissToast} />;
}

export default ToastContainer;
