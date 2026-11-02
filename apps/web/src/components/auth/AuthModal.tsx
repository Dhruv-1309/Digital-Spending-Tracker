import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../common/Button';
import { SegmentedControl } from '../common/SegmentedControl';
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
} from '../common/icons';

export function AuthModal() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordReset } = useAuth();

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
      triggerError(e.message || (authMode === 'signup' ? 'Registration failed' : 'Authentication failed'));
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (resetEmail || email).trim();
    if (!cleanEmail) {
      triggerError('Please enter your email address for password reset');
      return;
    }

    try {
      setStatusMessage(null);
      setResetLoading(true);
      await sendPasswordReset(cleanEmail);
      triggerSuccess('Password reset email sent! Check your inbox.');
      setIsResetOpen(false);
    } catch (err: unknown) {
      const e = err as { message?: string };
      triggerError(e.message || 'Failed to send password reset email');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div
      id="authModal"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm overflow-y-auto"
    >
      {/* Split Layout Modal Card */}
      <div className="relative bg-surface rounded-card border border-line shadow-warm-3 w-full max-w-4xl overflow-hidden flex flex-col md:flex-row my-auto">
        {/* Left Side: Warm Brand Panel with SVG Wave */}
        <div className="relative w-full md:w-5/12 bg-accent text-white p-6 md:p-10 flex flex-col justify-between overflow-hidden shrink-0">
          {/* Subtle Warm Wave Graphic */}
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 500 500"
              preserveAspectRatio="none"
            >
              <path
                d="M0,100 C150,200 350,0 500,100 L500,00 L0,0 Z"
                fill="currentColor"
              />
              <path
                d="M0,250 C200,350 300,150 500,250 L500,500 L0,500 Z"
                fill="currentColor"
              />
            </svg>
          </div>

          {/* Top Brand Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-btn bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
              <WalletIcon size={22} />
            </div>
            <div>
              <span className="font-display text-body font-semibold block leading-tight text-white">
                MoneyTracker
              </span>
              <span className="text-[11px] text-white/80 block leading-tight">
                Personal Finance
              </span>
            </div>
          </div>

          {/* PRD Vision Statement */}
          <div className="relative z-10 my-6 md:my-12 space-y-3">
            <h2 className="font-display text-section-title md:text-title font-semibold text-white leading-snug">
              No trackers, no bank logins.
            </h2>
            <p className="text-body-sm text-white/90 leading-relaxed">
              Your money, private and organized your way with local-first offline syncing and complete data ownership.
            </p>
          </div>

          {/* Security note */}
          <div className="relative z-10 text-caption text-white/75 flex items-center gap-2">
            <span>Direct Firestore synchronization</span>
          </div>
        </div>

        {/* Right Side: Auth Form Panel */}
        <div className="w-full md:w-7/12 p-6 md:p-10 flex flex-col justify-center bg-surface">
          {/* Sliding Mode Switcher (Sign In vs Sign Up) */}
          <div className="mb-6">
            <SegmentedControl
              options={[
                { value: 'signin', label: 'Sign In' },
                { value: 'signup', label: 'Sign Up' },
              ]}
              value={authMode}
              onChange={(val) => {
                setAuthMode(val as 'signin' | 'signup');
                setStatusMessage(null);
              }}
              size="sm"
            />
          </div>

          <div className="mb-6">
            <h1 className="font-display text-section-title font-semibold text-ink">
              {authMode === 'signup' ? 'Create an account' : 'Sign in with email'}
            </h1>
            <p className="text-body-sm text-ink-3 mt-1">
              {authMode === 'signup'
                ? 'Start tracking your spending securely with complete privacy'
                : 'Access your personal spending ledger and forecasts'}
            </p>
          </div>

          {/* Status Alert with Shake animation */}
          {statusMessage && (
            <div
              id="authError"
              className={`p-3.5 rounded-btn text-body-sm mb-5 border flex items-center gap-2.5 transition-all ${
                statusMessage.type === 'error'
                  ? 'bg-danger-tint/30 text-danger border-danger/30'
                  : 'bg-income-tint/40 text-income border-income/30'
              } ${isShaking ? 'animate-shake' : ''}`}
            >
              <div className="shrink-0">
                {statusMessage.type === 'error' ? (
                  <AlertCircleIcon size={18} />
                ) : (
                  <CheckCircleIcon size={18} />
                )}
              </div>
              <span id="authErrorMessage" className="font-medium text-caption">
                {statusMessage.text}
              </span>
            </div>
          )}

          {/* Main Form */}
          <form id="authForm" className="space-y-4" onSubmit={handleEmailSubmit}>
            {/* Email Input */}
            <div className="space-y-1.5">
              <label htmlFor="authEmail" className="block text-caption font-semibold text-ink-2">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-3">
                  <MailIcon size={16} />
                </span>
                <input
                  type="email"
                  id="authEmail"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-3 text-body-sm bg-surface border border-line-strong rounded-btn text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="authPassword" className="block text-caption font-semibold text-ink-2">
                  Password
                </label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    id="forgotPasswordBtn"
                    onClick={() => setIsResetOpen((prev) => !prev)}
                    className="text-caption text-accent hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-3">
                  <LockIcon size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="authPassword"
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 text-body-sm bg-surface border border-line-strong rounded-btn text-ink placeholder:text-ink-3 focus:outline-none focus:border-accent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  id="togglePassword"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-3 hover:text-ink"
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            {/* Inline Password Reset Sub-panel */}
            {isResetOpen && (
              <div className="p-3 bg-surface-2 rounded-btn border border-line space-y-2 animate-fadeIn text-body-sm">
                <p className="text-caption text-ink-2 font-medium">
                  Enter your email to receive a password reset link:
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={resetEmail || email}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="flex-1 h-9 px-3 text-caption bg-surface border border-line rounded-btn focus:outline-none focus:border-accent"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={resetLoading}
                    onClick={handleForgotPassword}
                  >
                    Send
                  </Button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              id="signInBtn"
              variant="primary"
              size="lg"
              isLoading={loading}
              disabled={loading || googleLoading}
              className="w-full justify-center text-body font-semibold mt-2"
            >
              <span id="signInText">
                {authMode === 'signup' ? 'Create Account' : 'Get Started'}
              </span>
              <ArrowRightIcon size={16} />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-line" />
            <span className="shrink-0 mx-3 text-caption text-ink-3">Or continue with</span>
            <div className="flex-grow border-t border-line" />
          </div>

          {/* Google Sign In Full-Width Button */}
          <Button
            type="button"
            id="googleSignInBtn"
            variant="secondary"
            size="lg"
            isLoading={googleLoading}
            disabled={loading || googleLoading}
            onClick={handleGoogleSignIn}
            className="w-full justify-center gap-2.5 font-medium"
          >
            <GoogleIcon size={18} />
            <span id="googleSignInText">Continue with Google</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
