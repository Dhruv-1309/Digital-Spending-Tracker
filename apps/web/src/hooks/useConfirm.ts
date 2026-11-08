import { useContext } from 'react';
import { ConfirmContext, type ConfirmContextValue } from '../context/confirmContextDef';

export function useConfirm(): ConfirmContextValue {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
