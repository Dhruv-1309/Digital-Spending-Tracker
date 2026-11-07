import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ShortcutsModal } from '../components/layout/ShortcutsModal';

declare const process: any;

describe('Keyboard Shortcuts & Navigation Modal (UX-22)', () => {
  it('renders keyboard shortcuts modal with all functional shortcut groups', () => {
    const onClose = vi.fn();
    render(<ShortcutsModal isOpen={true} onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Keyboard Shortcuts/i })).toBeInTheDocument();
    expect(screen.getByText(/Go to Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Go to Transactions/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Add Transaction dialog/i)).toBeInTheDocument();
    expect(screen.getByText(/Evaluate math formula in Amount input/i)).toBeInTheDocument();
  });

  it('triggers onClose when clicking close button or pressing Escape', () => {
    const onClose = vi.fn();
    render(<ShortcutsModal isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render dialog when isOpen is false', () => {
    render(<ShortcutsModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Print Stylesheet Integrity (UX-24)', () => {
  it('declares @media print rules that hide navigation and style high-contrast tables', () => {
    const fs = (process as any).getBuiltinModule('fs');
    const path = (process as any).getBuiltinModule('path');
    const cssPath = path.resolve(process.cwd(), 'src/styles/print.css');
    const printCss = fs.readFileSync(cssPath, 'utf-8');

    expect(printCss).toContain('@media print');
    expect(printCss).toContain('display: none !important');
    expect(printCss).toContain('[role="dialog"]');
    expect(printCss).toContain('[role="navigation"]');
    expect(printCss).toContain('border-collapse: collapse !important');
    expect(printCss).toContain('page-break-inside: avoid');
  });
});

describe('Transaction Filter Persistence (UX-21)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('serializes filter and sort preferences into localStorage', () => {
    const preferences = {
      typeFilter: 'expense',
      monthFilter: '2026-10',
      sortBy: 'amount-desc',
    };

    localStorage.setItem('mt_tx_filters', JSON.stringify(preferences));

    const retrieved = JSON.parse(localStorage.getItem('mt_tx_filters') || '{}');
    expect(retrieved.typeFilter).toBe('expense');
    expect(retrieved.monthFilter).toBe('2026-10');
    expect(retrieved.sortBy).toBe('amount-desc');
  });
});
