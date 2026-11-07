import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { EncryptedBackupModal } from '../components/transactions/EncryptedBackupModal';
import { ToastContext } from '../context/toastContextDef';
import type { Transaction, AutopayPlan, BudgetGoal } from '../types';
import { encryptBackup } from '@moneytracker/shared';

const showToast = vi.fn();

describe('Encrypted Backup & Restore Modal (DIFF-6)', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx_enc_1',
      amount: 150000,
      type: 'expense',
      category: 'Electronics',
      description: 'Noise Cancelling Headphones',
      date: '2026-11-05',
      paymentMethod: 'credit_card',
    },
    {
      id: 'tx_enc_2',
      amount: 750000,
      type: 'income',
      category: 'Salary',
      description: 'Monthly Salary',
      date: '2026-11-01',
      paymentMethod: 'bank_transfer',
    },
  ];

  const sampleAutopays: AutopayPlan[] = [
    {
      id: 'auto_1',
      name: 'Broadband',
      amount: 99900,
      type: 'expense',
      category: 'Utilities',
      day: 15,
      paymentMethod: 'upi',
      active: true,
    },
  ];

  const sampleBudgetGoal: BudgetGoal = {
    monthlyExpenseLimit: 5000000,
    thresholdPercent: 80,
  };

  const mockOnRestoreTransactions = vi.fn().mockResolvedValue(true);
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (isOpen = true) => {
    return render(
      <ToastContext.Provider value={{ toasts: [], showToast, dismissToast: vi.fn() }}>
        <EncryptedBackupModal
          isOpen={isOpen}
          onClose={mockOnClose}
          transactions={sampleTransactions}
          autopays={sampleAutopays}
          budgetGoal={sampleBudgetGoal}
          onRestoreTransactions={mockOnRestoreTransactions}
        />
      </ToastContext.Provider>,
    );
  };

  it('does not render when isOpen is false', () => {
    renderModal(false);
    expect(screen.queryByText('Encrypted Backup & Restore')).not.toBeInTheDocument();
  });

  it('renders correctly with export tab active by default', () => {
    renderModal(true);
    expect(screen.getByText('Encrypted Backup & Restore')).toBeInTheDocument();
    expect(screen.getByText('Zero-Knowledge Encryption')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter a strong passphrase/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Re-enter your passphrase/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Download Encrypted Backup/i }),
    ).toBeInTheDocument();
  });

  it('switches between Export and Restore tabs', () => {
    renderModal(true);
    const restoreTab = screen.getByRole('radio', { name: 'Restore from Backup' });
    fireEvent.click(restoreTab);

    expect(screen.getByText('Restoring from Encrypted Backup')).toBeInTheDocument();
    expect(screen.getByText(/Click to select \.enc backup file/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Decrypt & Restore Data/i }),
    ).toBeInTheDocument();

    const exportTab = screen.getByRole('radio', { name: 'Export Encrypted Backup' });
    fireEvent.click(exportTab);
    expect(screen.getByText('Zero-Knowledge Encryption')).toBeInTheDocument();
  });

  it('shows password matching indicator when confirm password matches', () => {
    renderModal(true);
    const passwordInput = screen.getByPlaceholderText(/Enter a strong passphrase/i);
    const confirmInput = screen.getByPlaceholderText(/Re-enter your passphrase/i);

    fireEvent.change(passwordInput, { target: { value: 'SuperSecret123!' } });
    fireEvent.change(confirmInput, { target: { value: 'SuperSecret123!' } });

    expect(screen.getByText('Passphrases match')).toBeInTheDocument();
  });

  it('exports encrypted backup file and triggers download', async () => {
    // Mock URL methods
    const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const mockRevokeObjectURL = vi.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    renderModal(true);
    const passwordInput = screen.getByPlaceholderText(/Enter a strong passphrase/i);
    const confirmInput = screen.getByPlaceholderText(/Re-enter your passphrase/i);

    fireEvent.change(passwordInput, { target: { value: 'StrongPassphrase!2026' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPassphrase!2026' } });

    const downloadButton = screen.getByRole('button', { name: /Download Encrypted Backup/i });
    expect(downloadButton).not.toBeDisabled();

    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/Encrypted backup saved as .*store your passphrase safely!/i),
        'success',
        6000,
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('restores transactions from an encrypted backup successfully', async () => {
    // Prepare valid encrypted backup envelope
    const rawBackup = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions: [
        {
          id: 'tx_restored_1',
          amount: 250000,
          type: 'expense',
          category: 'Food & Dining',
          description: 'Restored Gourmet Dinner',
          date: '2026-11-06',
          paymentMethod: 'upi',
        },
      ],
      autopays: [],
      budgetGoal: { monthlyLimit: 5000000, categoryLimits: {} },
    });

    const encryptedEnvelope = await encryptBackup(rawBackup, 'CorrectPassphrase456!');
    const file = new File([JSON.stringify(encryptedEnvelope)], 'backup.enc', {
      type: 'application/json',
    });

    renderModal(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Restore from Backup' }));

    const fileInput = document.getElementById('encryptedBackupFileInput') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    const passwordInput = screen.getByPlaceholderText(/Enter passphrase used to encrypt/i);
    fireEvent.change(passwordInput, { target: { value: 'CorrectPassphrase456!' } });

    const decryptButton = screen.getByRole('button', { name: /Decrypt & Restore Data/i });
    fireEvent.click(decryptButton);

    await waitFor(() => {
      expect(mockOnRestoreTransactions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            description: 'Restored Gourmet Dinner',
          }),
        ]),
      );
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/Successfully restored 1 transactions/i),
        'success',
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles wrong passphrase during restore with a friendly error toast', async () => {
    const rawBackup = JSON.stringify({
      version: 1,
      transactions: [],
      autopays: [],
      budgetGoal: { monthlyLimit: 0, categoryLimits: {} },
    });

    const encryptedEnvelope = await encryptBackup(rawBackup, 'ValidPassword123!');
    const file = new File([JSON.stringify(encryptedEnvelope)], 'backup.enc', {
      type: 'application/json',
    });

    renderModal(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Restore from Backup' }));

    const fileInput = document.getElementById('encryptedBackupFileInput') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    const passwordInput = screen.getByPlaceholderText(/Enter passphrase used to encrypt/i);
    fireEvent.change(passwordInput, { target: { value: 'WrongPasswordGuess!' } });

    const decryptButton = screen.getByRole('button', { name: /Decrypt & Restore Data/i });
    fireEvent.click(decryptButton);

    await waitFor(() => {
      expect(mockOnRestoreTransactions).not.toHaveBeenCalled();
      expect(showToast).toHaveBeenCalledWith(
        'Incorrect passphrase or corrupted backup file. Please try again.',
        'error',
      );
    });
  });
});
