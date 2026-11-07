import { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { EASING } from '../../ui/motion';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { formatCurrency } from '../../lib/formatters';
import { calculateTrashDaysRemaining } from '@moneytracker/shared';
import type { Transaction } from '../../types';
import { Button, Badge } from '../ui';
import {
  XIcon,
  TrashIcon,
  RefreshCwIcon,
  SearchIcon,
} from '../icons';

export interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashItems: Transaction[];
  onRestore: (id: string) => Promise<boolean>;
  onPurgeTrash: () => Promise<boolean>;
  onPermanentlyDelete: (id: string) => Promise<boolean>;
}

export function TrashModal({
  isOpen,
  onClose,
  trashItems,
  onRestore,
  onPurgeTrash,
  onPermanentlyDelete,
}: TrashModalProps) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = trashItems.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.category.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      item.amount.toString().includes(q)
    );
  });

  const handleRestore = async (item: Transaction) => {
    try {
      setIsProcessing(true);
      const success = await onRestore(item.id);
      if (success) {
        showToast(`Restored ${item.category} transaction (₹${item.amount})`, 'success');
      } else {
        showToast('Unable to restore transaction. Please try again.', 'error');
      }
    } catch {
      showToast('Unable to restore transaction. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePermanentDelete = async (item: Transaction) => {
    const confirmed = await showConfirm(
      `Are you sure you want to permanently delete this ${item.category} transaction? This action cannot be undone.`,
      {
        title: 'Delete Permanently?',
        confirmText: 'Delete Permanently',
        cancelText: 'Cancel',
        variant: 'danger',
      },
    );

    if (!confirmed) return;

    try {
      setIsProcessing(true);
      const success = await onPermanentlyDelete(item.id);
      if (success) {
        showToast('Transaction permanently deleted.', 'info');
      } else {
        showToast('Failed to permanently delete transaction.', 'error');
      }
    } catch {
      showToast('Failed to permanently delete transaction.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmptyTrash = async () => {
    if (trashItems.length === 0) return;

    const confirmed = await showConfirm(
      `Are you sure you want to permanently delete all ${trashItems.length} items in the trash? This cannot be undone.`,
      {
        title: 'Empty Trash Bin?',
        confirmText: 'Empty Trash',
        cancelText: 'Cancel',
        variant: 'danger',
      },
    );

    if (!confirmed) return;

    try {
      setIsProcessing(true);
      const success = await onPurgeTrash();
      if (success) {
        showToast('Trash bin emptied successfully.', 'success');
      } else {
        showToast('Failed to empty trash.', 'error');
      }
    } catch {
      showToast('Failed to empty trash.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trash-modal-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <m.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: EASING.out }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                <TrashIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="trash-modal-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Trash Bin
                  </h2>
                  <Badge variant="neutral" className="text-xs font-semibold">
                    {trashItems.length} {trashItems.length === 1 ? 'item' : 'items'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transactions remain here for 30 days before permanent purging.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {trashItems.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={handleEmptyTrash}
                  disabled={isProcessing}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                >
                  Empty Trash
                </Button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Trash modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Bar (if > 3 items) */}
          {trashItems.length > 3 && (
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter deleted transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {/* List Area */}
          <div className="overflow-y-auto p-4 space-y-2 flex-1">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <TrashIcon className="w-6 h-6" />
                </div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {searchTerm ? 'No matching deleted transactions' : 'Trash is empty'}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchTerm
                    ? 'Try clearing your search term to view all trash items.'
                    : 'Transactions deleted within the last 30 days will appear here and can be restored.'}
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const daysRemaining = calculateTrashDaysRemaining(item.deletedAt || new Date().toISOString());

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {item.category}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              daysRemaining <= 3
                                ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <span>{item.date}</span>
                          {item.description && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[200px]">{item.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-bold ${
                          item.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {item.type === 'income' ? '+' : '-'}
                        {formatCurrency(item.amount)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          onClick={() => handleRestore(item)}
                          disabled={isProcessing}
                          title={`Restore ${item.category} transaction`}
                          aria-label={`Restore ${item.category} transaction`}
                          className="text-xs flex items-center gap-1 py-1 px-2.5"
                        >
                          <RefreshCwIcon className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </Button>

                        <button
                          type="button"
                          onClick={() => handlePermanentDelete(item)}
                          disabled={isProcessing}
                          title={`Permanently delete ${item.category} transaction`}
                          aria-label={`Permanently delete ${item.category} transaction`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </m.div>
      </div>
    </AnimatePresence>
  );
}
export default TrashModal;
