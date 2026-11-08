import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { HelpPage } from '../components/help/HelpPage';
import { resolveAppRoute } from '../lib/routes';

describe('HelpPage Component & Future-Dated Transactions Policy (CORE-21, WEB-12)', () => {
  it('renders the header, title, and search bar', () => {
    render(<HelpPage />);
    expect(screen.getByText('MoneyTracker')).toBeInTheDocument();
    expect(screen.getByText('Help & Knowledge Base')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /How Can We Help You\?/i })).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('prominently features the Policy on Future-Dated Transactions vs. Recurring Schedules (CORE-21)', () => {
    render(<HelpPage />);
    expect(
      screen.getByText('Policy on Future-Dated Transactions vs. Recurring Schedules'),
    ).toBeInTheDocument();
    expect(screen.getByText('Core Policy')).toBeInTheDocument();

    // Verify intra-month policy
    expect(screen.getByText(/1\. Intra-Month Future Entries/i)).toBeInTheDocument();
    expect(screen.getByText(/counted immediately in your active month totals and monthly budget limit/i)).toBeInTheDocument();

    // Verify future-month policy
    expect(screen.getByText(/2\. Future-Month Entries/i)).toBeInTheDocument();
    expect(screen.getByText(/Transactions dated in/i)).toBeInTheDocument();

    // Verify Autopay guidance
    expect(screen.getByText(/3\. Scheduling vs\. Manual Forward Entries/i)).toBeInTheDocument();
    expect(screen.getByText(/Instead, set up an/i)).toBeInTheDocument();
    expect(screen.getByText(/Autopay automatically records the transaction/i)).toBeInTheDocument();

    // Verify Retroactive policy
    expect(screen.getByText(/4\. Retroactive \(Past-Dated\) Entries/i)).toBeInTheDocument();
  });

  it('filters help topics live based on search query', () => {
    render(<HelpPage />);
    const searchInput = screen.getByRole('searchbox');

    // Search for Z-score
    fireEvent.change(searchInput, { target: { value: 'z-score' } });
    expect(screen.getByText(/Statistical Anomaly Detection \(Z-Score\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Policy on Future-Dated Transactions/i)).not.toBeInTheDocument();

    // Clear search
    const clearBtn = screen.getByRole('button', { name: /Clear search/i });
    fireEvent.click(clearBtn);
    expect(screen.getByText(/Policy on Future-Dated Transactions/i)).toBeInTheDocument();
  });

  it('filters topics by clicking category filter pills', () => {
    render(<HelpPage />);
    const autopayPill = screen.getByRole('button', { name: 'Autopay' });
    fireEvent.click(autopayPill);

    expect(screen.getByText(/Recurring Autopay Execution & Month-End Clamping/i)).toBeInTheDocument();
    expect(screen.queryByText(/Spending Forecasts & Capital Runway/i)).not.toBeInTheDocument();
  });

  it('toggles expansion of accordion items', () => {
    render(<HelpPage />);
    const anomalyButton = screen.getByRole('button', {
      name: /Statistical Anomaly Detection \(Z-Score\)/i,
    });

    // Anomaly section is initially collapsed
    expect(screen.queryByText(/Minimum Sample Requirement:/i)).not.toBeInTheDocument();

    // Expand
    fireEvent.click(anomalyButton);
    expect(screen.getByText(/Minimum Sample Requirement:/i)).toBeInTheDocument();

    // Collapse
    fireEvent.click(anomalyButton);
    expect(screen.queryByText(/Minimum Sample Requirement:/i)).not.toBeInTheDocument();
  });

  it('invokes onBack callback when clicking Back to App button', () => {
    const onBackMock = vi.fn();
    render(<HelpPage onBack={onBackMock} />);

    const backBtn = screen.getByRole('button', { name: /Back to App/i });
    fireEvent.click(backBtn);
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it('documents desktop keyboard shortcuts', () => {
    render(<HelpPage />);
    // Select Shortcuts pill
    const shortcutsPill = screen.getByRole('button', { name: 'Shortcuts' });
    fireEvent.click(shortcutsPill);

    const shortcutsHeader = screen.getByRole('button', { name: /Keyboard Shortcuts Reference/i });
    expect(shortcutsHeader).toBeInTheDocument();

    // Expand shortcuts accordion
    fireEvent.click(shortcutsHeader);

    expect(screen.getByText('Add New Transaction')).toBeInTheDocument();
    expect(screen.getByText('N')).toBeInTheDocument();
    expect(screen.getByText('Toggle Desktop Sidebar (Expand / Collapse)')).toBeInTheDocument();
    expect(screen.getByText('Ctrl')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('Close Modal, Drawer, or Slide-Over')).toBeInTheDocument();
    expect(screen.getByText('Escape')).toBeInTheDocument();
  });

  describe('resolveAppRoute Route Parsing', () => {
    it('correctly resolves /help and #help to route "help"', () => {
      expect(resolveAppRoute('/help', '')).toBe('help');
      expect(resolveAppRoute('/', '#help')).toBe('help');
      expect(resolveAppRoute('/help/', '')).toBe('help');
      expect(resolveAppRoute('/', 'help')).toBe('help');
    });

    it('correctly resolves /faq and #faq aliases to route "help"', () => {
      expect(resolveAppRoute('/faq', '')).toBe('help');
      expect(resolveAppRoute('/', '#faq')).toBe('help');
    });
  });
});
