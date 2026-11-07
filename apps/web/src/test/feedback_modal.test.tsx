/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { FeedbackModal } from '../components/common/FeedbackModal';

const mockShowToast = vi.fn();
vi.mock('../hooks/useToast', () => ({
  useToast: () => ({
    showToast: mockShowToast,
  }),
}));

const mockUser = {
  uid: 'user-123',
  email: 'tester@example.com',
  displayName: 'Test User',
};

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

describe('FeedbackModal Component (WEB-5)', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<FeedbackModal isOpen={false} onClose={mockOnClose} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders accessible dialog with pre-filled user email and diagnostic options when open', () => {
    render(<FeedbackModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Send Feedback')).toBeInTheDocument();
    expect(screen.getByText('support@moneytracker.app')).toBeInTheDocument();

    const emailInput = screen.getByLabelText(/your email/i) as HTMLInputElement;
    expect(emailInput.value).toBe('tester@example.com');

    const diagCheckbox = screen.getByLabelText(/system diagnostics/i) as HTMLInputElement;
    expect(diagCheckbox.checked).toBe(true);
  });

  it('updates category and satisfaction ratings on button clicks', () => {
    render(<FeedbackModal isOpen={true} onClose={mockOnClose} />);

    const bugButton = screen.getByRole('button', { name: /bug report/i });
    fireEvent.click(bugButton);
    expect(bugButton.className).toContain('text-accent');

    const needsWorkBtn = screen.getByRole('button', { name: /needs work/i });
    fireEvent.click(needsWorkBtn);
    expect(needsWorkBtn.className).toContain('border-accent');
  });

  it('blocks submission and copy when textarea message is empty', () => {
    render(<FeedbackModal isOpen={true} onClose={mockOnClose} />);

    const sendBtn = screen.getByRole('button', { name: /send email/i });
    expect(sendBtn).toBeDisabled();

    const copyBtn = screen.getByRole('button', { name: /copy text/i });
    expect(copyBtn).toBeDisabled();
  });

  it('opens mailto: URL with encoded diagnostics and message on submit', () => {
    render(<FeedbackModal isOpen={true} onClose={mockOnClose} />);

    const textarea = screen.getByPlaceholderText(/what happened\?/i);
    fireEvent.change(textarea, { target: { value: 'Transactions tab loads very fast!' } });

    const sendBtn = screen.getByRole('button', { name: /send email/i });
    expect(sendBtn).not.toBeDisabled();
    fireEvent.click(sendBtn);

    expect(window.open).toHaveBeenCalledTimes(1);
    const calledUrl = vi.mocked(window.open).mock.calls[0][0] as string;
    expect(calledUrl).toContain('mailto:support@moneytracker.app');
    expect(calledUrl).toContain('Transactions%20tab%20loads%20very%20fast!');
    expect(calledUrl).toContain('App%20Version%3A%203.0.0');

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('Email client opened'),
      'success',
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('copies formatted text to navigator.clipboard on Copy Text click', async () => {
    render(<FeedbackModal isOpen={true} onClose={mockOnClose} />);

    const textarea = screen.getByPlaceholderText(/what happened\?/i);
    fireEvent.change(textarea, { target: { value: 'Export works great with CSV' } });

    const copyBtn = screen.getByRole('button', { name: /copy text/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    });

    const writtenText = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
    expect(writtenText).toContain('Export works great with CSV');
    expect(writtenText).toContain('tester@example.com');
    expect(writtenText).toContain('App Version: 3.0.0');

    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('Feedback copied to clipboard'),
      'success',
    );
  });

  it('omits diagnostics when the diagnostics checkbox is unchecked', async () => {
    render(<FeedbackModal isOpen={true} onClose={mockOnClose} />);

    const diagCheckbox = screen.getByLabelText(/system diagnostics/i) as HTMLInputElement;
    fireEvent.click(diagCheckbox);
    expect(diagCheckbox.checked).toBe(false);

    const textarea = screen.getByPlaceholderText(/what happened\?/i);
    fireEvent.change(textarea, { target: { value: 'Feature suggestion without diagnostics' } });

    const copyBtn = screen.getByRole('button', { name: /copy text/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    });

    const writtenText = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0];
    expect(writtenText).toContain('Feature suggestion without diagnostics');
    expect(writtenText).not.toContain('--- System Diagnostics ---');
  });

  it('calls onClose when clicking close button or pressing Escape key', () => {
    render(<FeedbackModal isOpen={true} onClose={mockOnClose} />);

    const closeBtn = screen.getByLabelText(/close feedback modal/i);
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});
