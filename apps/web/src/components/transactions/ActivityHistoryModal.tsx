import { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { EASING } from '../../ui/motion';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import type { ActivityLogItem } from '../../types';
import { Button, Badge } from '../ui';
import {
  XIcon,
  TrashIcon,
  RefreshCwIcon,
  UploadIcon,
  ClockIcon,
  CheckCircleIcon,
  EditIcon,
} from '../icons';

export interface ActivityHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityLogItem[];
  onUndoBatch: (batchId: string, transactionIds: string[]) => Promise<boolean>;
  onClearHistory?: () => void;
}

function formatActivityTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ActivityHistoryModal({
  isOpen,
  onClose,
  activities,
  onUndoBatch,
  onClearHistory,
}: ActivityHistoryModalProps) {
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [filterType, setFilterType] = useState<'all' | 'import' | 'delete'>('all');
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

  const filteredActivities = activities.filter((act) => {
    if (filterType === 'all') return true;
    if (filterType === 'import') return act.type === 'import';
    if (filterType === 'delete') return act.type === 'delete';
    return true;
  });

  const handleUndoBatch = async (activity: ActivityLogItem) => {
    const batchId = activity.metadata?.batchId || '';
    const transactionIds = activity.metadata?.transactionIds || [];
    if (!transactionIds.length) return;

    const count = transactionIds.length;
    const confirmed = await showConfirm(
      `Are you sure you want to undo this import? ${count} ${
        count === 1 ? 'transaction' : 'transactions'
      } will be moved to the Trash bin.`,
      {
        title: 'Undo Import Batch?',
        confirmText: 'Undo Import',
        cancelText: 'Keep Transactions',
        variant: 'danger',
      },
    );

    if (!confirmed) return;

    try {
      setIsProcessing(true);
      const success = await onUndoBatch(batchId, transactionIds);
      if (success) {
        showToast(
          `Undid import of ${count} ${count === 1 ? 'transaction' : 'transactions'}. Items moved to Trash.`,
          'success',
        );
      } else {
        showToast('Unable to undo import batch. Please try again.', 'error');
      }
    } catch {
      showToast('Unable to undo import batch. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getActivityIcon = (type: ActivityLogItem['type']) => {
    switch (type) {
      case 'import':
        return <UploadIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'delete':
        return <TrashIcon className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
      case 'restore':
        return <RefreshCwIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'edit':
        return <EditIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      default:
        return <CheckCircleIcon className="w-4 h-4 text-slate-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-history-title"
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
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <ClockIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 id="activity-history-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Activity History
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Audit log of recent imports, edits, and deletions with one-click batch undo.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activities.length > 0 && onClearHistory && (
                <Button
                  variant="ghost"
                  onClick={onClearHistory}
                  disabled={isProcessing}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Clear History
                </Button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Activity History modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-2">Filter:</span>
            {(['all', 'import', 'delete'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterType === type
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {type === 'all' ? 'All Activities' : type === 'import' ? 'Imports' : 'Deletions'}
              </button>
            ))}
          </div>

          {/* Activity List */}
          <div className="overflow-y-auto p-4 space-y-2.5 flex-1">
            {filteredActivities.length === 0 ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <ClockIcon className="w-6 h-6" />
                </div>
                <p className="font-medium text-slate-900 dark:text-slate-100">No activity recorded</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Recent actions like importing CSV files and deleting transactions will appear here.
                </p>
              </div>
            ) : (
              filteredActivities.map((act) => {
                const canUndo = act.type === 'import' && act.canUndo && act.metadata?.transactionIds?.length;

                return (
                  <div
                    key={act.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                        {getActivityIcon(act.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {act.description}
                          </p>
                          <Badge variant="neutral" className="text-xs uppercase font-medium">
                            {act.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatActivityTime(act.timestamp)}
                        </p>
                      </div>
                    </div>

                    {canUndo && (
                      <Button
                        variant="secondary"
                        onClick={() => handleUndoBatch(act)}
                        disabled={isProcessing}
                        aria-label={`Undo import batch of ${act.metadata?.count || 0} transactions`}
                        className="text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-500/10 flex items-center gap-1.5"
                      >
                        <RefreshCwIcon className="w-3.5 h-3.5" />
                        <span>Undo Batch</span>
                      </Button>
                    )}
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
export default ActivityHistoryModal;
