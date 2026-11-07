import { useState, useEffect, useRef, useContext } from 'react';
import {
  ShieldIcon,
  LockIcon,
  KeyIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  XIcon,
  DownloadIcon,
} from '../icons';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/TextInput';
import { ToastContext } from '../../context/toastContextDef';
import {
  generateTotpSecret,
  generateRecoveryCodes,
  generateTotpUri,
  verifyTotpCode,
} from '@moneytracker/shared';

export interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onStatusChange?: (enabled: boolean) => void;
}

interface Stored2FAConfig {
  enabled: boolean;
  secret: string;
  recoveryCodes: string[];
  enabledAt?: string;
}

export function TwoFactorModal({
  isOpen,
  onClose,
  userEmail = 'user@moneytracker.local',
  onStatusChange,
}: TwoFactorModalProps) {
  const toastContext = useContext(ToastContext);
  const showToast = toastContext?.showToast || (() => {});
  const modalRef = useRef<HTMLDivElement>(null);
  const storageKey = `mt_2fa_${userEmail.toLowerCase()}`;

  // Current saved 2FA configuration
  const [config, setConfig] = useState<Stored2FAConfig | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage error
    }
    return null;
  });

  // Setup wizard state
  const [step, setStep] = useState<'intro' | 'scan' | 'verify' | 'recovery'>('intro');
  const [tempSecret, setTempSecret] = useState<string>('');
  const [tempRecoveryCodes, setTempRecoveryCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [verifyError, setVerifyError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [disableConfirm, setDisableConfirm] = useState<boolean>(false);

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setConfig(parsed);
          setStep('intro');
        } else {
          setConfig(null);
          setStep('intro');
        }
      } catch {
        setConfig(null);
      }
      setDisableConfirm(false);
      setVerifyError('');
      setVerificationCode('');
    }
  }, [isOpen, storageKey]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleStartSetup = () => {
    const newSecret = generateTotpSecret(20);
    const codes = generateRecoveryCodes(8);
    setTempSecret(newSecret);
    setTempRecoveryCodes(codes);
    setStep('scan');
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(verificationCode.trim())) {
      setVerifyError('Please enter a 6-digit numeric verification code.');
      return;
    }

    setIsVerifying(true);
    setVerifyError('');

    try {
      const result = await verifyTotpCode(tempSecret, verificationCode.trim());
      if (result.valid) {
        const newConfig: Stored2FAConfig = {
          enabled: true,
          secret: tempSecret,
          recoveryCodes: tempRecoveryCodes,
          enabledAt: new Date().toISOString(),
        };

        setConfig(newConfig);
        try {
          localStorage.setItem(storageKey, JSON.stringify(newConfig));
        } catch {
          // ignore storage error
        }

        onStatusChange?.(true);
        setStep('recovery');
        showToast('Two-factor authentication successfully verified!', 'success');
      } else {
        setVerifyError('Invalid code. Ensure your device time is synchronized and try again.');
      }
    } catch {
      setVerifyError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable2FA = () => {
    setConfig(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore storage error
    }
    onStatusChange?.(false);
    setDisableConfirm(false);
    setStep('intro');
    showToast('Two-factor authentication has been disabled.', 'info');
  };

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(tempSecret);
      showToast('Secret key copied to clipboard!', 'success');
    } catch {
      showToast('Could not access clipboard', 'error');
    }
  };

  const handleCopyRecoveryCodes = async (codes: string[]) => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      showToast('Recovery codes copied to clipboard!', 'success');
    } catch {
      showToast('Could not access clipboard', 'error');
    }
  };

  const handleDownloadRecoveryCodes = (codes: string[]) => {
    const text = [
      'MoneyTracker Two-Factor Authentication Recovery Backup Codes',
      `Account: ${userEmail}`,
      `Created: ${new Date().toISOString()}`,
      '',
      'Each recovery code can only be used once if you lose access to your authenticator app:',
      '',
      ...codes.map((c, i) => `${i + 1}. ${c}`),
      '',
      'Keep these codes secure. Do not share them with anyone.',
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moneytracker-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Recovery codes downloaded as .txt', 'success');
  };

  if (!isOpen) return null;

  const totpUri = tempSecret ? generateTotpUri(tempSecret, userEmail) : '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="twoFactorModalTitle"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-surface text-ink rounded-modal shadow-3 border border-line flex flex-col max-h-[90vh] overflow-hidden animate-scaleIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-btn bg-accent-tint text-accent">
              <ShieldIcon size={20} />
            </div>
            <div>
              <h2 id="twoFactorModalTitle" className="font-display font-semibold text-lg text-ink">
                Two-Factor Authentication (2FA)
              </h2>
              <p className="text-xs text-ink-3">Protect your account with a time-based authenticator (TOTP)</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            aria-label="Close two-factor authentication dialog"
            className="p-1.5 text-ink-3 hover:text-ink"
            icon={<XIcon size={18} />}
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {step === 'recovery' ? (
            /* Step 4: Backup recovery codes (post-verification) */
            <div className="space-y-4">
              <div className="p-3.5 rounded-card bg-warning-tint/30 border border-warning/30 space-y-1.5">
                <div className="flex items-center gap-2 text-warning font-semibold text-xs">
                  <LockIcon size={16} />
                  <span>Save Your Recovery Backup Codes</span>
                </div>
                <p className="text-xs text-ink-2">
                  If you ever lose access to your authenticator phone or app, these one-time codes are the only way to recover your account. Each code can be used once.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {tempRecoveryCodes.map((code, idx) => (
                  <div
                    key={idx}
                    className="px-2 py-1.5 rounded bg-surface border border-line text-center font-mono text-xs text-ink font-semibold select-all"
                  >
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => handleCopyRecoveryCodes(tempRecoveryCodes)}
                >
                  Copy All Codes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => handleDownloadRecoveryCodes(tempRecoveryCodes)}
                  icon={<DownloadIcon size={16} />}
                >
                  Download .txt
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setStep('intro')}
                >
                  I Have Saved My Codes
                </Button>
              </div>
            </div>
          ) : config?.enabled ? (
            /* 2FA Active State */
            <div className="space-y-4">
              <div className="p-4 rounded-card bg-income-tint/30 border border-income/30 flex items-start gap-3">
                <CheckCircleIcon size={20} className="text-income shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-ink">Two-Factor Authentication is Enabled</h3>
                  <p className="text-xs text-ink-2 mt-1">
                    Your account is secured with a Time-Based One-Time Password (TOTP). You will be prompted for a 6-digit code when logging in on new devices.
                  </p>
                  {config.enabledAt && (
                    <p className="text-[11px] text-ink-3 mt-1">
                      Enabled on: {new Date(config.enabledAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Recovery Codes Section */}
              <div className="p-4 rounded-card bg-surface-2/40 border border-line space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyIcon size={16} className="text-accent" />
                    <h4 className="text-xs font-semibold text-ink uppercase tracking-wider">
                      Backup Recovery Codes ({config.recoveryCodes.length})
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => handleCopyRecoveryCodes(config.recoveryCodes)}
                      className="text-xs h-7 px-2"
                    >
                      Copy All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => handleDownloadRecoveryCodes(config.recoveryCodes)}
                      className="text-xs h-7 px-2"
                      icon={<DownloadIcon size={14} />}
                    >
                      Download
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {config.recoveryCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-1.5 rounded bg-surface border border-line text-center font-mono text-xs text-ink select-all"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger / Disable Section */}
              {!disableConfirm ? (
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-xs text-ink-3">Need to change your authenticator device?</span>
                  <Button
                    type="button"
                    variant="danger"
                    size="md"
                    onClick={() => setDisableConfirm(true)}
                  >
                    Disable 2FA
                  </Button>
                </div>
              ) : (
                <div className="p-3.5 rounded-card border border-danger/40 bg-danger-tint/20 space-y-2.5">
                  <p className="text-xs text-danger font-medium">
                    Are you sure you want to disable two-factor authentication? Your account will only be protected by your password.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={() => setDisableConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      onClick={handleDisable2FA}
                    >
                      Confirm Disable 2FA
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : step === 'intro' ? (
            /* Step 1: Intro / Explanation */
            <div className="space-y-4">
              <div className="p-4 rounded-card bg-surface-2/40 border border-line space-y-2 text-xs text-ink-2">
                <p>
                  Two-factor authentication adds an extra layer of defense to your financial data. In addition to your password, you will enter a 6-digit verification code generated by an authenticator application.
                </p>
                <div className="pt-1 flex flex-wrap gap-2 text-[11px] font-medium text-ink-3">
                  <span className="px-2 py-0.5 rounded-chip bg-surface border border-line">Google Authenticator</span>
                  <span className="px-2 py-0.5 rounded-chip bg-surface border border-line">Microsoft Authenticator</span>
                  <span className="px-2 py-0.5 rounded-chip bg-surface border border-line">1Password</span>
                  <span className="px-2 py-0.5 rounded-chip bg-surface border border-line">Bitwarden</span>
                  <span className="px-2 py-0.5 rounded-chip bg-surface border border-line">Authy</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleStartSetup}
                  icon={<ShieldIcon size={16} />}
                >
                  Set Up Authenticator App
                </Button>
              </div>
            </div>
          ) : step === 'scan' ? (
            /* Step 2: Secret Key & Manual Entry */
            <div className="space-y-4">
              <div className="p-3.5 rounded-card bg-accent-tint/20 border border-accent/20 text-xs text-ink-2 space-y-2">
                <p className="font-semibold text-accent">1. Add MoneyTracker to your authenticator</p>
                <p>
                  Open your authenticator app and choose &ldquo;Add Account&rdquo; &rarr; &ldquo;Enter a setup key&rdquo; (or open the URI link below).
                </p>
              </div>

              {/* Secret Key Display */}
              <div className="p-4 rounded-card bg-surface border border-line space-y-2">
                <label className="text-xs font-medium text-ink-3 block">Your Secret Key (Base32)</label>
                <div className="flex items-center justify-between gap-2 p-2 rounded bg-surface-2 font-mono text-sm tracking-wider text-ink font-semibold select-all">
                  <span>{tempSecret.match(/.{1,4}/g)?.join(' ')}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={handleCopySecret}
                    className="h-7 text-xs px-2 shrink-0"
                  >
                    Copy Key
                  </Button>
                </div>
                <div className="pt-1 text-[11px] text-ink-3 flex items-center justify-between">
                  <span>Account: {userEmail}</span>
                  <a
                    href={totpUri}
                    className="text-accent underline hover:opacity-80 transition-opacity"
                    title="Open directly in compatible desktop authenticators"
                  >
                    Open otpauth link
                  </a>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setStep('intro')}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setStep('verify')}
                >
                  Next: Verify Code
                </Button>
              </div>
            </div>
          ) : step === 'verify' ? (
            /* Step 3: Enter 6-digit code to confirm */
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="p-3.5 rounded-card bg-accent-tint/20 border border-accent/20 text-xs text-ink-2">
                <p className="font-semibold text-accent">2. Enter the 6-digit code</p>
                <p className="mt-1">
                  Type the code currently shown in your authenticator app to verify that setup was completed correctly.
                </p>
              </div>

              <div className="max-w-xs mx-auto text-center space-y-2">
                <TextInput
                  id="totpVerificationInput"
                  label="6-Digit Verification Code"
                  placeholder="123456"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setVerifyError('');
                  }}
                  className="text-center font-mono text-lg tracking-widest"
                  autoFocus
                />
              </div>

              {verifyError && (
                <div className="p-2.5 rounded bg-danger-tint border border-danger/30 text-xs text-danger flex items-center gap-2">
                  <AlertCircleIcon size={16} className="shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setStep('scan')}
                  disabled={isVerifying}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isVerifying || verificationCode.length !== 6}
                  loading={isVerifying}
                >
                  Verify & Enable 2FA
                </Button>
              </div>
            </form>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-line bg-surface-2/40 flex justify-end">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
