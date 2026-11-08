import React, { useState, useEffect, useRef, useContext } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { EASING } from '../../ui/motion';
import { TrackerContext } from '../../context/trackerContextDef';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { DEFAULT_CATEGORIES } from '@moneytracker/shared';
import type { TransactionType } from '../../types';
import { Button, TextInput, SegmentedControl } from '../ui';
import {
  XIcon,
  TagIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  AlertTriangleIcon,
} from '../icons';

export interface CategorySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategorySettingsModal({ isOpen, onClose }: CategorySettingsModalProps) {
  const tracker = useContext(TrackerContext);
  const categories = tracker?.categories || { expense: [], income: [] };
  const transactions = tracker?.transactions || [];
  const addCustomCategory = tracker?.addCustomCategory;
  const renameCustomCategory = tracker?.renameCustomCategory;
  const deleteCustomCategory = tracker?.deleteCustomCategory;
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  const [activeType, setActiveType] = useState<TransactionType>('expense');
  const [newCatName, setNewCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [reassignTarget, setReassignTarget] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Preserve focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deletingCategory) {
          setDeletingCategory(null);
        } else if (editingCategory) {
          setEditingCategory(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, deletingCategory, editingCategory]);

  // Reset state on open/type switch
  useEffect(() => {
    setNewCatName('');
    setEditingCategory(null);
    setRenameValue('');
    setDeletingCategory(null);
    setReassignTarget('');
  }, [isOpen, activeType]);

  if (!isOpen) return null;

  const currentDefaults = DEFAULT_CATEGORIES[activeType] || [];
  const currentAll = categories[activeType] || [];
  const customCategories = currentAll.filter((c) => !currentDefaults.includes(c));

  // Count usage of a category across active transactions
  const getUsageCount = (catName: string): number => {
    const norm = catName.toLowerCase();
    return transactions.filter(
      (t) => t.type === activeType && t.category.toLowerCase() === norm && !t.deletedAt,
    ).length;
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      showToast('Please enter a category name.', 'error');
      return;
    }
    if (currentAll.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Category "${trimmed}" already exists.`, 'error');
      return;
    }

    try {
      setIsProcessing(true);
      const success = addCustomCategory ? await addCustomCategory(activeType, trimmed) : false;
      if (success) {
        showToast(`Created custom category "${trimmed}".`, 'success');
        setNewCatName('');
      } else {
        showToast('Failed to add category.', 'error');
      }
    } catch {
      showToast('Failed to add category.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartRename = (catName: string) => {
    setEditingCategory(catName);
    setRenameValue(catName);
  };

  const handleSaveRename = async (oldName: string) => {
    const trimmedNew = renameValue.trim();
    if (!trimmedNew) {
      showToast('Category name cannot be empty.', 'error');
      return;
    }
    if (trimmedNew.toLowerCase() === oldName.toLowerCase()) {
      setEditingCategory(null);
      return;
    }
    if (
      currentAll.some(
        (c) =>
          c.toLowerCase() === trimmedNew.toLowerCase() &&
          c.toLowerCase() !== oldName.toLowerCase(),
      )
    ) {
      showToast(`Category "${trimmedNew}" already exists.`, 'error');
      return;
    }

    try {
      setIsProcessing(true);
      if (renameCustomCategory) {
        const success = await renameCustomCategory(activeType, oldName, trimmedNew);
        if (success) {
          showToast(`Renamed "${oldName}" to "${trimmedNew}".`, 'success');
          setEditingCategory(null);
        } else {
          showToast('Failed to rename category.', 'error');
        }
      }
    } catch {
      showToast('Failed to rename category.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteClick = async (catName: string) => {
    const usage = getUsageCount(catName);
    if (usage > 0) {
      // Reassignment required
      setDeletingCategory(catName);
      // Pick first available other category as default target
      const otherCats = currentAll.filter(
        (c) => c.toLowerCase() !== catName.toLowerCase(),
      );
      setReassignTarget(otherCats[0] || currentDefaults[0] || '');
    } else {
      const confirmed = await showConfirm(
        `Are you sure you want to delete the category "${catName}"?`,
        {
          title: 'Delete Category?',
          confirmText: 'Delete Category',
          cancelText: 'Cancel',
          variant: 'danger',
        },
      );
      if (!confirmed) return;

      try {
        setIsProcessing(true);
        if (deleteCustomCategory) {
          const res = await deleteCustomCategory(activeType, catName);
          if (res.success) {
            showToast(`Deleted category "${catName}".`, 'success');
          } else {
            showToast(res.error || 'Failed to delete category.', 'error');
          }
        }
      } catch {
        showToast('Failed to delete category.', 'error');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleConfirmReassignDelete = async () => {
    if (!deletingCategory || !reassignTarget) return;

    try {
      setIsProcessing(true);
      if (deleteCustomCategory) {
        const res = await deleteCustomCategory(activeType, deletingCategory, reassignTarget);
        if (res.success) {
          showToast(
            `Deleted "${deletingCategory}" and reassigned ${res.reassignedCount} transaction(s) to "${reassignTarget}".`,
            'success',
          );
          setDeletingCategory(null);
          setReassignTarget('');
        } else {
          showToast(res.error || 'Failed to reassign and delete category.', 'error');
        }
      }
    } catch {
      showToast('Failed to reassign and delete category.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-settings-title"
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
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <TagIcon className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="category-settings-title"
                  className="text-lg font-bold text-slate-900 dark:text-slate-100"
                >
                  Manage Categories
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rename, add, or delete custom categories with transaction reassignment (CORE-19)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close category settings modal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Type Switcher */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <SegmentedControl
              options={[
                { value: 'expense', label: 'Expense Categories' },
                { value: 'income', label: 'Income Categories' },
              ]}
              value={activeType}
              onChange={(val) => setActiveType(val as TransactionType)}
            />
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto p-5 flex-1 space-y-6">
            {/* Reassignment Prompt Modal Overlay */}
            {deletingCategory && (
              <div
                className="p-4 rounded-xl border border-amber-300 dark:border-amber-600/40 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 space-y-3"
                role="alert"
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <AlertTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <span>Category in Active Use</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  The category <strong className="font-semibold">{deletingCategory}</strong> is
                  currently assigned to{' '}
                  <span className="font-semibold text-amber-700 dark:text-amber-300">
                    {getUsageCount(deletingCategory)} transaction(s)
                  </span>
                  . Select a replacement category before deleting:
                </p>

                <div>
                  <label
                    htmlFor="reassignCategorySelect"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Reassign all transactions to:
                  </label>
                  <select
                    id="reassignCategorySelect"
                    value={reassignTarget}
                    onChange={(e) => setReassignTarget(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {currentAll
                      .filter((c) => c.toLowerCase() !== deletingCategory.toLowerCase())
                      .map((c) => (
                        <option key={c} value={c}>
                          {c} {currentDefaults.includes(c) ? '(Default)' : '(Custom)'}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setDeletingCategory(null)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={handleConfirmReassignDelete}
                    disabled={isProcessing || !reassignTarget}
                  >
                    {isProcessing ? 'Reassigning...' : 'Reassign & Delete'}
                  </Button>
                </div>
              </div>
            )}

            {/* Add Custom Category Form */}
            <form onSubmit={handleAddCategory} className="space-y-2">
              <label
                htmlFor="newCategoryInput"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Add New {activeType === 'expense' ? 'Expense' : 'Income'} Category
              </label>
              <div className="flex gap-2">
                <TextInput
                  id="newCategoryInput"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Photography, Hobbies, Freelance"
                  className="flex-1"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isProcessing || !newCatName.trim()}
                  className="flex items-center gap-1.5"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add</span>
                </Button>
              </div>
            </form>

            {/* Custom Categories Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Custom Categories ({customCategories.length})
                </h3>
              </div>

              {customCategories.length === 0 ? (
                <div className="p-4 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 text-xs">
                  No custom {activeType} categories added yet. Add one above!
                </div>
              ) : (
                <div className="space-y-2">
                  {customCategories.map((cat) => {
                    const usage = getUsageCount(cat);
                    const isEditing = editingCategory === cat;

                    return (
                      <div
                        key={cat}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              className="flex-1 h-8 px-2 text-sm bg-white dark:bg-slate-900 border border-teal-500 rounded-md text-slate-900 dark:text-slate-100 focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(cat)}
                              aria-label={`Save rename for ${cat}`}
                              className="p-1.5 rounded-md bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCategory(null)}
                              aria-label="Cancel rename"
                              className="p-1.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {cat}
                            </span>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                usage > 0
                                  ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {usage} {usage === 1 ? 'transaction' : 'transactions'}
                            </span>
                          </div>
                        )}

                        {!isEditing && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartRename(cat)}
                              aria-label={`Rename ${cat} category`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(cat)}
                              aria-label={`Delete ${cat} category`}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Default System Categories (Read-Only) */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Standard System Categories ({currentDefaults.length})
                </h3>
                <span className="text-[11px] text-slate-400">Built-in defaults</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentDefaults.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  >
                    <span>{cat}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
          </div>
        </m.div>
      </div>
    </AnimatePresence>
  );
}

export default CategorySettingsModal;
