import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/TextInput';
import { SegmentedControl } from '../ui/SegmentedControl';
import {
  GoogleIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  WalletIcon,
  ArrowRightIcon,
  ShieldIcon,
} from '../icons';
import authWaveUrl from '../../assets/art/auth-wave.svg';

/**
 * AuthModal (Phase 8: Auth Redesign - SPEC Section 6)
 *
 * 1. Auth layout: on desktop a split screen. The left panel shows src/assets/art/auth-wave.svg
 *    over the --bg colour with the product name and one line taken from the PRD vision:
 *    "No trackers, no bank logins." On phones the panel shrinks to a header strip.
 * 2. Form: one form for sign in and sign up with a two-option SegmentedControl switching between them.
 *    Email and password TextInputs with labels above, a show and hide password button,
 *    inline errors with the existing shake, and a primary Button with the loading state.
 *    Google sign-in is a full-width secondary button with the standard Google mark.
 * 3. Password reset opens inline under the form (not a separate view), with the same input
 *    and button components, and success and error toasts as today.
 */
export function AuthModal() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordReset } = useAuth();
  const { showToast } = useToast();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Inline Password Reset state
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'error' | 'success';
  } | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const triggerError = (msg: string) => {
    setStatusMessage({ text: msg, type: 'error' });
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const triggerSuccess = (msg: string) => {
    setStatusMessage({ text: msg, type: 'success' });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      triggerError('Please enter both email and password');
      return;
    }

    try {
      setStatusMessage(null);
      setLoading(true);
      if (authMode === 'signup') {
        await signUpWithEmail(cleanEmail, password);
      } else {
        await signInWithEmail(cleanEmail, password);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      triggerError(
        e.message ||
          (authMode === 'signup' ? 'Registration failed' : 'Authentication failed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setStatusMessage(null);
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch (err: unknown) {
      const e = err as { message?: string };
      triggerError(e.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = (resetEmail || email).trim();
    if (!cleanEmail) {
      showToast('Please enter your email address for password reset', 'error');
      triggerError('Please enter your email address for password reset');
      return;
    }

    try {
      setStatusMessage(null);
      setResetLoading(true);
      await sendPasswordReset(cleanEmail);
      showToast('Password reset email sent! Check your inbox.', 'success');
      triggerSuccess('Password reset email sent! Check your inbox.');
      setIsResetOpen(false);
    } catch (err: unknown) {
      const e = err as { message?: string };
      const msg = e.message || 'Failed to send password reset email';
      showToast(msg, 'error');
      triggerError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      id="authModal"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-ink/50 backdrop-blur-sm overflow-y-auto"
    >
      {/* Split Layout Modal Card */}
      <div className="relative bg-surface rounded-card border border-line shadow-3 w-full max-w-4xl overflow-hidden flex flex-col md:flex-row my-auto">
        {/* Left Panel: Desktop Split Screen / Mobile Header Strip */}
        <div className="relative w-full md:w-5/12 bg-bg p-6 sm:p-8 md:p-10 flex flex-col justify-between shrink-0 border-b md:border-b-0 md:border-r border-line overflow-hidden">
          {/* Layered Wave SVG Art over --bg */}
          <img
            id="authWaveImg"
            src={authWaveUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85"
            aria-hidden="true"
          />

          {/* Product Name & Brand Icon */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-accent text-white flex items-center justify-center shadow-1 shrink-0">
              <WalletIcon size={22} />
            </div>
            <div>
              <span className="font-display text-lg font-bold block text-ink leading-tight">
                MoneyTracker
              </span>
              <span className="text-xs text-ink-3 block">Personal Finance</span>
            </div>
          </div>

          {/* PRD Vision Line: "No trackers, no bank logins." */}
          <div className="relative z-10 my-4 md:my-0">
            <p className="font-display text-base md:text-xl font-semibold text-ink leading-snug">
              No trackers, no bank logins.
            </p>
            <p className="text-xs text-ink-2 mt-1 hidden md:block">
              Privacy-first personal finance tracking that stays on your device.
            </p>
          </div>

          {/* Security footnote on desktop */}
          <div className="relative z-10 hidden md:flex items-center gap-2 text-xs text-ink-3">
            <ShieldIcon size={14} className="text-accent shrink-0" />
            <span>Client-side privacy & secure sync</span>
          </div>
        </div>

        {/* Right Panel: Form Area */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 md:p-10 bg-surface flex flex-col justify-center">
          {/* Mode Switch: SegmentedControl */}
          <SegmentedControl
            id="authModeControl"
            options={[
              { value: 'signin', label: 'Sign In' },
              { value: 'signup', label: 'Sign Up' },
            ]}
            value={authMode}
            onChange={(val) => {
              setAuthMode(val as 'signin' | 'signup');
              setStatusMessage(null);
            }}
            className="w-full mb-6"
          />

          {/* Mode Header */}
          <div className="mb-6">
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-ink mb-1">
              {authMode === 'signup' ? 'Create your account' : 'Sign in with email'}
            </h2>
            <p className="text-xs sm:text-sm text-ink-2">
              {authMode === 'signup'
                ? 'Start tracking your digital spending with zero trackers.'
                : 'Access your spending dashboard securely.'}
            </p>
          </div>

          {/* Status Alert with Shake */}
          {statusMessage && (
            <div
              id="authError"
              role={statusMessage.type === 'error' ? 'alert' : 'status'}
              className={`p-3.5 rounded-btn text-xs sm:text-sm mb-5 border flex items-center gap-2.5 transition-all duration-fast ${
                statusMessage.type === 'error'
                  ? 'bg-danger-tint text-danger border-danger/30'
                  : 'bg-income-tint text-income border-income/30'
              } ${isShaking ? 'animate-shake' : ''}`}
            >
              <div className="shrink-0">
                {statusMessage.type === 'error' ? (
                  <AlertCircleIcon size={18} />
                ) : (
                  <CheckCircleIcon size={18} />
                )}
              </div>
              <span id="authErrorMessage" className="font-medium">
                {statusMessage.text}
              </span>
            </div>
          )}

          {/* Main Auth Form */}
          <form id="authForm" onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <TextInput
              id="authEmail"
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              leftAddon={<MailIcon size={16} />}
              hasError={Boolean(statusMessage?.type === 'error')}
            />

            {/* Password Field */}
            <TextInput
              id="authPassword"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              leftAddon={<LockIcon size={16} />}
              rightAddon={
                <button
                  type="button"
                  id="togglePassword"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-ink-3 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded p-0.5"
                >
                  {showPassword ? (
                    <EyeOffIcon size={18} id="eyeIcon" />
                  ) : (
                    <EyeIcon size={18} id="eyeIcon" />
                  )}
                </button>
              }
              hasError={Boolean(statusMessage?.type === 'error')}
            />

            {/* Forgot Password Toggle (Sign in mode) */}
            {authMode === 'signin' && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  id="forgotPasswordBtn"
                  onClick={() => setIsResetOpen((prev) => !prev)}
                  className="text-xs text-accent hover:underline font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
                >
                  {isResetOpen ? 'Close password reset' : 'Forgot password?'}
                </button>
              </div>
            )}

            {/* Submit Primary Button */}
            <Button
              type="submit"
              id="signInBtn"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading || googleLoading}
              className="w-full justify-center text-sm font-semibold mt-2"
              icon={<ArrowRightIcon size={16} id="signInIcon" />}
              iconPosition="right"
            >
              <span id="signInText">
                {authMode === 'signup' ? 'Create Account' : 'Get Started'}
              </span>
            </Button>
          </form>

          {/* Password Reset Sub-panel (opens inline under the form) */}
          {isResetOpen && (
            <div
              id="resetPasswordSection"
              className="mt-4 p-4 rounded-card bg-surface-2 border border-line space-y-3 animate-fadeIn"
            >
              <p className="text-xs sm:text-sm text-ink-2 font-medium">
                Enter your email to receive a password reset link:
              </p>
              <form onSubmit={handleForgotPassword} className="flex flex-col sm:flex-row gap-2.5 items-end sm:items-center">
                <TextInput
                  id="resetEmailInput"
                  type="email"
                  placeholder="name@example.com"
                  value={resetEmail || email}
                  onChange={(e) => setResetEmail(e.target.value)}
                  leftAddon={<MailIcon size={16} />}
                  containerClassName="flex-1 w-full"
                />
                <Button
                  type="submit"
                  id="sendResetBtn"
                  variant="primary"
                  size="md"
                  loading={resetLoading}
                  className="w-full sm:w-auto shrink-0"
                >
                  Send Reset Link
                </Button>
              </form>
            </div>
          )}

          {/* Or Divider */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-line" />
            <span className="shrink-0 mx-3 text-xs text-ink-3">Or continue with</span>
            <div className="flex-grow border-t border-line" />
          </div>

          {/* Google Sign In Full-Width Button */}
          <Button
            type="button"
            id="googleSignInBtn"
            variant="secondary"
            size="lg"
            loading={googleLoading}
            disabled={loading || googleLoading}
            onClick={handleGoogleSignIn}
            className="w-full justify-center gap-2.5 font-medium"
            icon={<GoogleIcon size={18} id="googleIcon" />}
          >
            <span id="googleSignInText">Continue with Google</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
