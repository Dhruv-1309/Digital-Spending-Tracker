import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ToastContext, type ToastContextValue } from '../context/toastContextDef';
import { BankImportModal } from '../components/transactions/BankImportModal';

describe('BankImportModal (DIFF-2)', () => {
  const showToast = vi.fn();
  const dismissToast = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnImportTransactions = vi.fn();

  const mockToastContext: ToastContextValue = {
    toasts: [],
    showToast,
    dismissToast,
  };

  const mockAvailableCategories = {
    income: ['Salary', 'Freelance', 'Investments', 'Other Income'],
    expense: ['Food & Dining', 'Groceries', 'Utilities', 'Transportation', 'Entertainment', 'Shopping', 'Other Expenses'],
  };

  const mockExistingTransactions = [
    {
      date: '2026-10-15',
      amount: 450,
      type: 'expense',
      category: 'Food & Dining',
      description: 'Swiggy Order',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderComponent = (props?: Partial<React.ComponentProps<typeof BankImportModal>>) => {
    return render(
      <ToastContext.Provider value={mockToastContext}>
        <BankImportModal
          isOpen={true}
          onClose={mockOnClose}
          onImportTransactions={mockOnImportTransactions}
          existingTransactions={mockExistingTransactions}
          availableCategories={mockAvailableCategories}
          {...props}
        />
      </ToastContext.Provider>,
    );
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ToastContext.Provider value={mockToastContext}>
        <BankImportModal
          isOpen={false}
          onClose={mockOnClose}
          onImportTransactions={mockOnImportTransactions}
          existingTransactions={mockExistingTransactions}
          availableCategories={mockAvailableCategories}
        />
      </ToastContext.Provider>,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders dropzone when opened without file', () => {
    renderComponent();
    expect(screen.getByText('Import Bank Statement')).toBeInTheDocument();
    expect(screen.getByText(/Upload your bank statement CSV/i)).toBeInTheDocument();
    expect(screen.getByText(/Compatible with HDFC, SBI, ICICI, Axis/i)).toBeInTheDocument();
  });

  it('handles CSV upload and detects bank template and merchant rules', async () => {
    renderComponent();

    // Indian HDFC format CSV
    const csvContent =
      'Date,Narration,Withdrawal Amt.,Deposit Amt.,Closing Balance\n' +
      '15/10/2026,UPI-SWIGGY-12345,450.00,,12000.00\n' +
      '16/10/2026,UBER RIDES MUMBAI,320.00,,11680.00\n' +
      '17/10/2026,SALARY CREDIT OCT 2026,,85000.00,96680.00\n';

    const file = new File([csvContent], 'hdfc_statement.csv', { type: 'text/csv' });
    file.text = async () => csvContent;
    const input = screen.getByLabelText(/Select CSV file to import/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      // Detected HDFC template
      expect(screen.getByDisplayValue('HDFC Bank')).toBeInTheDocument();
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(/Detected format: HDFC Bank/i),
        'info',
      );
    });

    // Uber recognized as Transportation
    expect(screen.getByText('UBER RIDES MUMBAI')).toBeInTheDocument();
    // Salary recognized as Salary
    expect(screen.getByText('SALARY CREDIT OCT 2026')).toBeInTheDocument();

    // Swiggy is duplicate with existing transaction (15/10/2026, 450, expense)
    expect(screen.getByText('Duplicate')).toBeInTheDocument();
  });

  it('allows customizing column mapping', async () => {
    renderComponent();

    const customCsv =
      'TxnDate,Description,Debit,Credit\n' +
      '2026-10-18,NETFLIX.COM,649.00,\n';

    const file = new File([customCsv], 'custom_statement.csv', { type: 'text/csv' });
    file.text = async () => customCsv;
    const input = screen.getByLabelText(/Select CSV file to import/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('NETFLIX.COM')).toBeInTheDocument();
    });

    // Open mapping customization
    const customizeBtn = screen.getByRole('button', { name: /Customize Columns/i });
    fireEvent.click(customizeBtn);

    expect(screen.getByText(/Date Column/i)).toBeInTheDocument();
    expect(screen.getByText(/Debit Column/i)).toBeInTheDocument();
  });

  it('imports selected non-duplicate transactions on button click', async () => {
    renderComponent();

    const csvContent =
      'Date,Narration,Withdrawal Amt.,Deposit Amt.\n' +
      '15/10/2026,UPI-SWIGGY-12345,450.00,\n' + // duplicate
      '16/10/2026,UBER TRIP,250.00,\n'; // fresh

    const file = new File([csvContent], 'bank.csv', { type: 'text/csv' });
    file.text = async () => csvContent;
    const input = screen.getByLabelText(/Select CSV file to import/i);

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('UBER TRIP')).toBeInTheDocument();
    });

    const importBtn = screen.getByRole('button', { name: /Import 1 Transaction/i });
    expect(importBtn).not.toBeDisabled();

    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(mockOnImportTransactions).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalled();
    });

    const importedRows = mockOnImportTransactions.mock.calls[0][0];
    expect(importedRows).toHaveLength(1);
    expect(importedRows[0].description).toBe('UBER TRIP');
    expect(importedRows[0].amount).toBe(250);
    expect(importedRows[0].category).toBe('Transportation');
  });

  it('rejects files larger than 5MB with warning toast', async () => {
    renderComponent();

    // Create a 6MB mock file
    const largeFile = new File(['a'.repeat(1024)], 'huge.csv', { type: 'text/csv' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

    const input = screen.getByLabelText(/Select CSV file to import/i);
    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(showToast).toHaveBeenCalledWith(
      expect.stringContaining('exceeds the 5MB limit'),
      'error',
    );
  });
});
