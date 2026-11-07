import React, { useState, useMemo } from 'react';
import { m } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { toUserFriendlyError } from '../../lib/errorMessages';
import { validatePassword } from '../../lib/validation';
import { navigateTo } from '../../lib/routes';
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
  CheckIcon,
} from '../icons';
import authWaveUrl from '../../assets/art/auth-wave.svg';

/**
 * Self-contained Haikei SVG Wave + Geometric Mesh Data URI.
 * Guarantees 100% instant rendering with zero network requests, zero broken image icons,
 * and high-contrast visual depth across all browsers and headless screenshot environments.
 */
const HAIKEI_WAVE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 900" fill="none" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F19" />
      <stop offset="45%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#1E1B4B" />
    </linearGradient>
    <linearGradient id="wave-indigo" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#4F46E5" stop-opacity="0.38" />
      <stop offset="50%" stop-color="#3B82F6" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#06B6D4" stop-opacity="0.1" />
    </linearGradient>
    <linearGradient id="wave-cobalt" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563EB" stop-opacity="0.45" />
      <stop offset="70%" stop-color="#1D4ED8" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#0F172A" stop-opacity="0.0" />
    </linearGradient>
    <linearGradient id="wave-emerald" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.22" />
      <stop offset="50%" stop-color="#059669" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#047857" stop-opacity="0.02" />
    </linearGradient>
    <radialGradient id="radial-glow" cx="30%" cy="20%" r="60%">
      <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.28" />
      <stop offset="60%" stop-color="#6366F1" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#0B0F19" stop-opacity="0" />
    </radialGradient>
    <pattern id="dot-grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.2" fill="#64748B" fill-opacity="0.22" />
    </pattern>
  </defs>
  <rect width="800" height="900" fill="url(#bg-grad)" />
  <rect width="800" height="900" fill="url(#radial-glow)" />
  <rect width="800" height="900" fill="url(#dot-grid)" />
  <path d="M0,320 C180,240 320,420 540,340 C700,280 760,370 800,350 L800,900 L0,900 Z" fill="url(#wave-indigo)" />
  <path d="M0,480 C160,400 280,560 500,480 C680,410 740,520 800,490 L800,900 L0,900 Z" fill="url(#wave-cobalt)" />
  <path d="M0,640 C220,580 340,710 580,630 C720,580 760,670 800,640 L800,900 L0,900 Z" fill="url(#wave-emerald)" />
  <path d="M0,320 C180,240 320,420 540,340 C700,280 760,370 800,350" stroke="#60A5FA" stroke-width="1.5" stroke-opacity="0.3" fill="none" />
  <path d="M0,480 C160,400 280,560 500,480 C680,410 740,520 800,490" stroke="#818CF8" stroke-width="1.2" stroke-opacity="0.25" fill="none" />
  <path d="M0,640 C220,580 340,710 580,630 C720,580 760,670 800,640" stroke="#34D399" stroke-width="1" stroke-opacity="0.2" fill="none" />
</svg>`;

const AUTH_WAVE_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(HAIKEI_WAVE_SVG)}`;

/**
 * AuthModal (Modernized Phase 8: Auth Screen)
 *
 * Built with:
 * - Motion Primitives (spring physics modal entrance, tab indicator, interactive feedback)
 * - Haikei Geometric SVG Wave & Mesh Pattern (crisp contrast, zero broken images)
 * - Realtime Colors Principles (clear visual hierarchy, high contrast surfaces, cohesive tones)
 * - Skiper UI & Animata Patterns (live transaction preview card, trust pills, password strength meter)
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

  // Password strength calculation and common password rejection for sign up (AUTH-5)
  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const passwordLength = password.length;
  const strengthScore = passwordLength === 0 ? 0 : passwordValidation.score;

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
        if (!passwordValidation.isValid) {
          triggerError(passwordValidation.error || 'Password does not meet requirements');
          return;
        }
        await signUpWithEmail(cleanEmail, password);
        showToast(
          'Account created! A verification link has been sent to your email.',
          'success',
          5000,
        );
      } else {
        await signInWithEmail(cleanEmail, password);
      }
    } catch (err: unknown) {
      triggerError(
        toUserFriendlyError(
          err,
          authMode === 'signup'
            ? 'Unable to create account. Please check your details and try again.'
            : 'Unable to sign in. Please check your email and password.',
        ),
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
      triggerError(
        toUserFriendlyError(
          err,
          'Google sign-in was unsuccessful. Please try again or sign in with email.',
        ),
      );
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
      const msg = toUserFriendlyError(
        err,
        'Unable to send password reset email. Please try again.',
      );
      showToast(msg, 'error');
      triggerError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  // Quick fill helper for development testing
  const handleQuickDemoFill = () => {
    setEmail('dhruv@example.com');
    setPassword('demoPass123!');
  };

  return (
    <div
      id="authModal"
      className="fixed inset-0 z-[10000] min-h-screen w-full flex flex-col justify-between items-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto overscroll-contain"
    >
      {/* Top spacer to balance layout */}
      <div className="w-full shrink-0 h-1 sm:h-2" aria-hidden="true" />

      {/* Split Layout Modal Card with spring entrance animation */}
      <m.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative bg-surface rounded-card border border-line/90 shadow-3 w-full max-w-4xl overflow-hidden flex flex-col md:flex-row my-auto transition-all shrink-0"
      >
        {/* Left Panel: Desktop Split Screen / Mobile Header Strip (High Contrast Brand Experience) */}
        <div className="relative w-full md:w-5/12 p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-between shrink-0 border-b md:border-b-0 md:border-r border-line/80 overflow-hidden bg-slate-950 text-white">
          {/* Layered Wave SVG Art (Direct Data URI ensures 100% reliable load with zero 404s) */}
          <img
            id="authWaveImg"
            src={AUTH_WAVE_DATA_URI || authWaveUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none opacity-90"
            aria-hidden="true"
          />

          {/* Ambient Lighting Accents */}
          <div
            className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/25 rounded-full blur-2xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          {/* Top Section: Brand Identity */}
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-btn bg-accent text-white flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.45)] border border-blue-400/30 shrink-0">
                <WalletIcon size={20} />
              </div>
              <div>
                <span className="font-display text-lg sm:text-xl font-bold block text-white leading-tight tracking-tight">
                  MoneyTracker
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium text-blue-200/80 block uppercase tracking-wider">
                  Personal Finance
                </span>
              </div>
            </div>

            {/* PRD Vision Statement */}
            <div className="mt-3 sm:mt-6 md:mt-8">
              <p className="font-display text-base sm:text-xl md:text-2xl font-bold text-white leading-snug tracking-tight">
                No trackers, no bank logins.
              </p>
              <p className="text-xs sm:text-sm text-slate-300/90 mt-1.5 hidden md:block leading-relaxed">
                Privacy-first personal finance tracking that stays on your device.
              </p>
              {/* Mobile Trust Badges (ensures mobile users get the full feature visibility) */}
              <div className="flex md:hidden items-center gap-2 mt-2.5 pt-2 border-t border-white/10 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <CheckIcon size={12} className="text-emerald-400" /> Zero Trackers
                </span>
                <span className="text-white/30">•</span>
                <span className="inline-flex items-center gap-1">
                  <LockIcon size={11} className="text-blue-300" /> 100% On-Device
                </span>
              </div>
            </div>
          </div>

          {/* Middle Section: Skiper UI Live Component Preview Card (Desktop & Tablet only) */}
          <div className="relative z-10 my-4 sm:my-6 hidden md:block">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 sm:p-3.5 shadow-2 text-white">
              <div className="flex items-center justify-between text-xs mb-2.5 pb-2 border-b border-white/10 gap-2">
                <span className="flex items-center gap-1.5 text-blue-200 font-medium truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  Live Sync Active
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-pill text-slate-300 font-mono whitespace-nowrap shrink-0">
                  100% On-Device
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">Grocery & Supplies</p>
                  <p className="text-[11px] text-slate-300 truncate">Today • 4:15 PM • UPI</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-emerald-300 tabular-nums">
                    ₹1,450.00
                  </span>
                  <p className="text-[10px] text-slate-400">Verified</p>
                </div>
              </div>
            </div>

            {/* Trust feature pills */}
            <div className="mt-2.5 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-300 bg-white/5 border border-white/10 px-2 sm:px-2.5 py-1 rounded-pill whitespace-nowrap">
                <CheckIcon size={12} className="text-emerald-400 shrink-0" /> Zero Trackers
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-300 bg-white/5 border border-white/10 px-2 sm:px-2.5 py-1 rounded-pill whitespace-nowrap">
                <LockIcon size={11} className="text-blue-300 shrink-0" /> AES-256 Encrypted
              </span>
            </div>
          </div>

          {/* Bottom Security Footnote */}
          <div className="relative z-10 flex items-center gap-2 text-xs text-slate-300/90 pt-2 sm:pt-3 md:pt-0">
            <ShieldIcon size={14} className="text-blue-400 shrink-0" />
            <span className="font-medium text-[11px] sm:text-xs">Client-side privacy & secure sync</span>
          </div>
        </div>

        {/* Right Panel: Clean, High-Contrast Interactive Form Area */}
        <div className="w-full md:w-7/12 p-4 sm:p-6 md:p-8 lg:p-10 bg-surface flex flex-col justify-center">
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
            className="w-full mb-4 sm:mb-6"
          />

          {/* Mode Header */}
          <div className="mb-4 sm:mb-6">
            <h2 className="font-display text-lg sm:text-2xl font-bold text-ink mb-1 tracking-tight">
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
              className={`p-3 sm:p-3.5 rounded-btn text-xs sm:text-sm mb-4 sm:mb-5 border flex items-center gap-2.5 transition-all duration-fast ${
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
          <form id="authForm" onSubmit={handleEmailSubmit} className="space-y-3.5 sm:space-y-4" noValidate>
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
                  className="text-ink-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded p-1.5 transition-colors touch-manipulation min-w-[32px] min-h-[32px] flex items-center justify-center"
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

            {/* Animata Interactive Password Strength Indicator (Sign Up Mode) */}
            {authMode === 'signup' && passwordLength > 0 && (
              <div className="p-2 sm:p-2.5 rounded-btn bg-surface-2 border border-line text-xs space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between text-[11px] text-ink-2 font-medium">
                  <span>Password strength:</span>
                  <span
                    id="passwordStrengthLabel"
                    className={
                      passwordValidation.isBlacklisted
                        ? 'text-danger font-semibold'
                        : strengthScore >= 4
                        ? 'text-income font-semibold'
                        : strengthScore >= 3
                        ? 'text-accent font-semibold'
                        : strengthScore >= 2
                        ? 'text-warning font-semibold'
                        : 'text-danger font-semibold'
                    }
                  >
                    {passwordValidation.isBlacklisted
                      ? 'Common / Insecure'
                      : passwordValidation.strengthLabel}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  <div
                    className={`rounded-full transition-all duration-base ${
                      strengthScore >= 1 ? 'bg-danger' : 'bg-line'
                    }`}
                  />
                  <div
                    className={`rounded-full transition-all duration-base ${
                      strengthScore >= 2 && !passwordValidation.isBlacklisted ? 'bg-warning' : 'bg-line'
                    }`}
                  />
                  <div
                    className={`rounded-full transition-all duration-base ${
                      strengthScore >= 3 && !passwordValidation.isBlacklisted ? 'bg-accent' : 'bg-line'
                    }`}
                  />
                  <div
                    className={`rounded-full transition-all duration-base ${
                      strengthScore >= 4 && !passwordValidation.isBlacklisted ? 'bg-income' : 'bg-line'
                    }`}
                  />
                </div>
                {passwordValidation.isBlacklisted ? (
                  <p id="passwordBlacklistWarning" className="text-[11px] text-danger font-medium">
                    ⚠️ This password is too common and easily guessed.
                  </p>
                ) : !passwordValidation.isValid ? (
                  <p id="passwordRequirementHint" className="text-[11px] text-ink-3">
                    {passwordValidation.error}
                  </p>
                ) : null}
              </div>
            )}

            {/* Forgot Password Toggle (Sign in mode) */}
            {authMode === 'signin' && (
              <div className="flex items-center justify-between -mt-1 gap-2">
                {import.meta.env.DEV ? (
                  <button
                    type="button"
                    onClick={handleQuickDemoFill}
                    className="text-[11px] text-ink-3 hover:text-accent font-medium transition-colors"
                    title="Fill test credentials"
                  >
                    ⚡ Quick fill demo
                  </button>
                ) : (
                  <div />
                )}
                <button
                  type="button"
                  id="forgotPasswordBtn"
                  onClick={() => setIsResetOpen((prev) => !prev)}
                  className="text-xs text-accent hover:underline font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded transition-colors whitespace-nowrap ml-auto"
                >
                  {isResetOpen ? 'Close password reset' : 'Forgot password?'}
                </button>
              </div>
            )}

            {/* Submit Primary Button with Motion spring feedback */}
            <Button
              type="submit"
              id="signInBtn"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading || googleLoading}
              className="w-full justify-center text-sm font-semibold mt-2 shadow-1 hover:shadow-2 active:scale-[0.99] transition-all min-h-[44px]"
              icon={<ArrowRightIcon size={16} id="signInIcon" />}
              iconPosition="right"
            >
              <span id="signInText">
                {authMode === 'signup' ? 'Create Account' : 'Get Started'}
              </span>
            </Button>

            {/* Terms and Privacy agreement line for signup mode */}
            {authMode === 'signup' && (
              <p className="text-center text-[11px] sm:text-xs text-ink-3 pt-1">
                By creating an account, you agree to our{' '}
                <a
                  href="/terms"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/terms');
                  }}
                  className="text-accent underline hover:text-accent-hover font-medium"
                >
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/privacy');
                  }}
                  className="text-accent underline hover:text-accent-hover font-medium"
                >
                  Privacy Policy
                </a>
                .
              </p>
            )}
          </form>

          {/* Password Reset Sub-panel (opens inline under the form) */}
          {isResetOpen && (
            <div
              id="resetPasswordSection"
              className="mt-3.5 sm:mt-4 p-3.5 sm:p-4 rounded-card bg-surface-2 border border-line space-y-3 animate-fadeIn"
            >
              <p className="text-xs sm:text-sm text-ink-2 font-medium">
                Enter your email to receive a password reset link:
              </p>
              <form
                onSubmit={handleForgotPassword}
                className="flex flex-col sm:flex-row gap-2.5 items-end sm:items-center"
              >
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
                  className="w-full sm:w-auto shrink-0 min-h-[40px]"
                >
                  Send Reset Link
                </Button>
              </form>
            </div>
          )}

          {/* Or Divider */}
          <div className="relative flex py-3.5 sm:py-5 items-center">
            <div className="flex-grow border-t border-line" />
            <span className="shrink-0 mx-3 text-xs text-ink-3 font-medium">
              Or continue with
            </span>
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
            className="w-full justify-center gap-2.5 font-medium border-line hover:border-line-strong hover:bg-surface-2 active:scale-[0.99] transition-all min-h-[44px]"
            icon={<GoogleIcon size={18} id="googleIcon" />}
          >
            <span id="googleSignInText">Continue with Google</span>
          </Button>

          {/* Auth Card Footer with Trust Note & Legal Links */}
          <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-3">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldIcon size={13} className="text-accent shrink-0" />
              <span>Client-side encrypted</span>
            </span>
            <div className="flex items-center gap-2.5">
              <a
                href="/terms"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/terms');
                }}
                className="hover:text-ink hover:underline transition-colors"
              >
                Terms
              </a>
              <span>•</span>
              <a
                href="/privacy"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/privacy');
                }}
                className="hover:text-ink hover:underline transition-colors"
              >
                Privacy
              </a>
            </div>
          </div>
        </div>
      </m.div>

      {/* Website Footer at the Bottom of the Website */}
      <footer
        id="authWebsiteFooter"
        aria-label="Website Footer"
        className="w-full max-w-4xl pt-4 pb-2 mt-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-400 shrink-0 border-t border-white/10"
      >
        <span className="font-medium text-slate-400">MoneyTracker • Personal Finance Manager</span>
        <div className="flex items-center gap-4">
          <a
            href="/landing"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/landing');
            }}
            className="text-slate-300 hover:text-white transition-colors hover:underline font-medium"
          >
            About & Features
          </a>
          <span className="text-slate-600">•</span>
          <a
            href="/terms"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/terms');
            }}
            className="text-slate-300 hover:text-white transition-colors hover:underline font-medium"
          >
            Terms and Conditions
          </a>
          <span className="text-slate-600">•</span>
          <a
            href="/privacy"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/privacy');
            }}
            className="text-slate-300 hover:text-white transition-colors hover:underline font-medium"
          >
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  );
}

export default AuthModal;
