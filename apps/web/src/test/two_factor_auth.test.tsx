import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { TwoFactorModal } from '../components/profile/TwoFactorModal';
import { generateTotpCode } from '@moneytracker/shared';

describe('Two-Factor Authentication (AUTH-14)', () => {
  const testEmail = 'alice@example.com';
  const storageKey = `mt_2fa_${testEmail.toLowerCase()}`;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders 2FA setup intro modal with authenticator app options', () => {
    const onClose = vi.fn();
    render(<TwoFactorModal isOpen={true} onClose={onClose} userEmail={testEmail} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Two-Factor Authentication \(2FA\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Authenticator/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Set Up Authenticator App/i })).toBeInTheDocument();
  });

  it('generates secret key and advances to scan step', () => {
    render(<TwoFactorModal isOpen={true} onClose={vi.fn()} userEmail={testEmail} />);

    fireEvent.click(screen.getByRole('button', { name: /Set Up Authenticator App/i }));

    expect(screen.getByText(/Your Secret Key \(Base32\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Key/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open otpauth link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next: Verify Code/i })).toBeInTheDocument();
  });

  it('rejects invalid verification code with error message', async () => {
    render(<TwoFactorModal isOpen={true} onClose={vi.fn()} userEmail={testEmail} />);

    fireEvent.click(screen.getByRole('button', { name: /Set Up Authenticator App/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next: Verify Code/i }));

    const input = screen.getByLabelText(/6-Digit Verification Code/i);
    fireEvent.change(input, { target: { value: '000000' } });

    fireEvent.click(screen.getByRole('button', { name: /Verify & Enable 2FA/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid code/i)).toBeInTheDocument();
    });
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('verifies valid TOTP code and displays recovery codes', async () => {
    const onStatusChange = vi.fn();
    render(
      <TwoFactorModal
        isOpen={true}
        onClose={vi.fn()}
        userEmail={testEmail}
        onStatusChange={onStatusChange}
      />,
    );

    // Advance to scan step
    fireEvent.click(screen.getByRole('button', { name: /Set Up Authenticator App/i }));

    // Extract secret from the DOM
    const link = screen.getByRole('link', { name: /Open otpauth link/i }) as HTMLAnchorElement;
    const url = new URL(link.href);
    const secret = url.searchParams.get('secret')!;
    expect(secret).toBeTruthy();

    // Advance to verify step
    fireEvent.click(screen.getByRole('button', { name: /Next: Verify Code/i }));

    // Compute real valid TOTP code
    const validCode = await generateTotpCode(secret);

    const input = screen.getByLabelText(/6-Digit Verification Code/i);
    fireEvent.change(input, { target: { value: validCode } });

    fireEvent.click(screen.getByRole('button', { name: /Verify & Enable 2FA/i }));

    await waitFor(() => {
      expect(screen.getByText(/Save Your Recovery Backup Codes/i)).toBeInTheDocument();
    });

    expect(onStatusChange).toHaveBeenCalledWith(true);
    expect(localStorage.getItem(storageKey)).toContain('"enabled":true');
    expect(screen.getByRole('button', { name: /Copy All Codes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download \.txt/i })).toBeInTheDocument();
  });

  it('displays active state when 2FA is already enabled and allows disabling', async () => {
    // Pre-populate enabled 2FA
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        enabled: true,
        secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
        recoveryCodes: ['A1B2-C3D4', 'E5F6-G7H8'],
        enabledAt: new Date().toISOString(),
      }),
    );

    const onStatusChange = vi.fn();
    render(
      <TwoFactorModal
        isOpen={true}
        onClose={vi.fn()}
        userEmail={testEmail}
        onStatusChange={onStatusChange}
      />,
    );

    expect(screen.getByText(/Two-Factor Authentication is Enabled/i)).toBeInTheDocument();
    expect(screen.getByText('A1B2-C3D4')).toBeInTheDocument();
    expect(screen.getByText('E5F6-G7H8')).toBeInTheDocument();

    // Click Disable 2FA
    fireEvent.click(screen.getByRole('button', { name: /Disable 2FA/i }));
    expect(screen.getByText(/Are you sure you want to disable two-factor authentication\?/i)).toBeInTheDocument();

    // Confirm disable
    fireEvent.click(screen.getByRole('button', { name: /Confirm Disable 2FA/i }));

    expect(onStatusChange).toHaveBeenCalledWith(false);
    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(screen.getByRole('button', { name: /Set Up Authenticator App/i })).toBeInTheDocument();
  });
});
