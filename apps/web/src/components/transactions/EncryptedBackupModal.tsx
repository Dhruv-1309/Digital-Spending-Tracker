import { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { EASING } from '../../ui/motion';
import { useToast } from '../../hooks/useToast';
import { exportTransactionsJson } from '../../lib/transactions';
import { importBackupFromJson } from '../../lib/transactions';
import { getLocalDateString } from '../../lib/formatters';
import { toUserFriendlyError } from '../../lib/errorMessages';
import { encryptBackup, decryptBackup } from '@moneytracker/shared';
import type { Transaction, AutopayPlan, BudgetGoal } from '../../types';
import { Button, TextInput, SegmentedControl } from '../ui';
import {
  XIcon,
  LockIcon,
  DownloadIcon,
  UploadIcon,
  EyeIcon,
  EyeOffIcon,
  ShieldIcon,
  CheckCircleIcon,
} from '../icons';

export interface EncryptedBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  autopays: AutopayPlan[];
  budgetGoal: BudgetGoal;
  onRestoreTransactions: (newTxs: Transaction[]) => Promise<boolean>;
  onRestoreAutopays?: (newAutopays: AutopayPlan[]) => Promise<void>;
  onRestoreBudgetGoal?: (newBudgetGoal: BudgetGoal) => Promise<boolean>;
}

export function EncryptedBackupModal({
  isOpen,
  onClose,
  transactions,
  autopays,
  budgetGoal,
  onRestoreTransactions,
}: EncryptedBackupModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'export' | 'restore'>('export');
  const [isProcessing, setIsProcessing] = useState(false);

  // Export State
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showExportPassword, setShowExportPassword] = useState(false);

  // Restore State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [showRestorePassword, setShowRestorePassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset state on modal open/close
  useEffect(() => {
    if (!isOpen) {
      setExportPassphrase('');
      setConfirmPassphrase('');
      setRestorePassphrase('');
      setSelectedFile(null);
    }
  }, [isOpen]);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportPassphrase) {
      showToast('Please enter an encryption passphrase.', 'error');
      return;
    }
    if (exportPassphrase.length < 6) {
      showToast('Passphrase must be at least 6 characters long.', 'error');
      return;
    }
    if (exportPassphrase !== confirmPassphrase) {
      showToast('Passphrases do not match. Please re-enter.', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      const jsonContent = exportTransactionsJson({ transactions, autopays, budgetGoal });
      const encryptedEnvelope = await encryptBackup(jsonContent, exportPassphrase);

      const blob = new Blob([JSON.stringify(encryptedEnvelope, null, 2)], {
        type: 'application/json;charset=utf-8',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const datePart = getLocalDateString();
      const filename = `moneytracker_encrypted_backup_${datePart}.enc`;

      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      showToast(
        `Encrypted backup saved as ${filename}. Store your passphrase safely!`,
        'success',
        6000,
      );
      onClose();
    } catch (err: unknown) {
      showToast(toUserFriendlyError(err, 'Failed to create encrypted backup.'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select an encrypted backup file (.enc).', 'error');
      return;
    }
    if (!restorePassphrase) {
      showToast('Please enter the decryption passphrase.', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      const fileText = await selectedFile.text();
      const decryptedJson = await decryptBackup(fileText, restorePassphrase);

      const result = importBackupFromJson(decryptedJson, transactions);
      if (result.error) {
        showToast(result.error, 'error');
        return;
      }

      if (result.newTransactions.length > 0) {
        await onRestoreTransactions(result.newTransactions);
        showToast(
          `Successfully restored ${result.newTransactions.length} transactions (${result.skippedCount} duplicates skipped).`,
          'success',
        );
      } else {
        showToast(
          result.skippedCount > 0
            ? `All transactions in backup already exist (${result.skippedCount} duplicates skipped).`
            : 'No valid transaction records found in backup.',
          'info',
        );
      }

      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.includes('Incorrect passphrase')
          ? 'Incorrect passphrase or corrupted backup file. Please try again.'
          : 'Failed to decrypt backup. Make sure the file and password are correct.';
      showToast(msg, 'error');
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
        aria-labelledby="encrypted-backup-title"
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
                <LockIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 id="encrypted-backup-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Encrypted Backup & Restore
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Web Crypto AES-GCM (PBKDF2 100k iterations) • Client-side only
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Encrypted Backup modal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <SegmentedControl
              options={[
                { value: 'export', label: 'Export Encrypted Backup' },
                { value: 'restore', label: 'Restore from Backup' },
              ]}
              value={activeTab}
              onChange={(val) => setActiveTab(val as 'export' | 'restore')}
            />
          </div>

          {/* Body Content */}
          <div className="overflow-y-auto p-5 flex-1">
            {activeTab === 'export' ? (
              <form onSubmit={handleExport} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/20 text-xs text-teal-900 dark:text-teal-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <ShieldIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>Zero-Knowledge Encryption</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    Your backup is encrypted directly in your browser. Without your passphrase, no one (not
                    even MoneyTracker) can recover your data.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <TextInput
                      label="Encryption Passphrase"
                      type={showExportPassword ? 'text' : 'password'}
                      placeholder="Enter a strong passphrase (min. 6 characters)"
                      value={exportPassphrase}
                      onChange={(e) => setExportPassphrase(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowExportPassword((prev) => !prev)}
                      className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      aria-label={showExportPassword ? 'Hide password' : 'Show password'}
                    >
                      {showExportPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>

                  <div>
                    <TextInput
                      label="Confirm Passphrase"
                      type={showExportPassword ? 'text' : 'password'}
                      placeholder="Re-enter your passphrase"
                      value={confirmPassphrase}
                      onChange={(e) => setConfirmPassphrase(e.target.value)}
                      required
                    />
                    {exportPassphrase && confirmPassphrase && exportPassphrase === confirmPassphrase && (
                      <p className="flex items-center gap-1 mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        <span>Passphrases match</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isProcessing || !exportPassphrase || exportPassphrase !== confirmPassphrase}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <DownloadIcon className="w-4 h-4" />
                    <span>{isProcessing ? 'Encrypting...' : 'Download Encrypted Backup (.enc)'}</span>
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRestore} className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Restoring from Encrypted Backup
                  </p>
                  <p>
                    Upload your <code className="font-mono text-teal-600 dark:text-teal-400">.enc</code> file and
                    enter the passphrase used during export. Duplicate records will be automatically merged.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Encrypted Backup File (.enc)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".enc,.json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSelectedFile(file);
                      }}
                      className="hidden"
                      id="encryptedBackupFileInput"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 rounded-xl cursor-pointer text-center bg-slate-50/50 dark:bg-slate-800/40 transition-colors"
                    >
                      <UploadIcon className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {selectedFile ? selectedFile.name : 'Click to select .enc backup file'}
                      </p>
                      <p className="text-[11px] text-slate-400">Max file size 5MB</p>
                    </div>
                  </div>

                  <div className="relative">
                    <TextInput
                      label="Decryption Passphrase"
                      type={showRestorePassword ? 'text' : 'password'}
                      placeholder="Enter passphrase used to encrypt this file"
                      value={restorePassphrase}
                      onChange={(e) => setRestorePassphrase(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRestorePassword((prev) => !prev)}
                      className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      aria-label={showRestorePassword ? 'Hide restore password' : 'Show restore password'}
                    >
                      {showRestorePassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isProcessing || !selectedFile || !restorePassphrase}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <LockIcon className="w-4 h-4" />
                    <span>{isProcessing ? 'Decrypting...' : 'Decrypt & Restore Data'}</span>
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </m.div>
      </div>
    </AnimatePresence>
  );
}
export default EncryptedBackupModal;
