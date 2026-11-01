import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export function AuthModal() {
  const { signInWithEmail, signInWithGoogle, sendPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
      await signInWithEmail(cleanEmail, password);
    } catch (err: unknown) {
      const e = err as { message?: string };
      triggerError(e.message || 'Authentication failed');
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

  const handleForgotPassword = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      triggerError('Please enter your email address first');
      return;
    }

    try {
      setStatusMessage(null);
      await sendPasswordReset(cleanEmail);
      triggerSuccess('Password reset email sent! Check your inbox.');
    } catch (err: unknown) {
      const e = err as { message?: string };
      triggerError(e.message || 'Failed to send password reset email');
    }
  };

  return (
    <div id="authModal" className="fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden">
      {/* Animated Background with colorful blobs */}
      <div className="absolute inset-0 bg-slate-100/80">
        <div className="absolute top-[-10%] left-[-5%] w-80 h-80 bg-purple-300/60 rounded-full filter blur-3xl animate-blob" />
        <div className="absolute top-[-5%] right-[-5%] w-96 h-96 bg-yellow-300/60 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-[10%] left-[5%] w-80 h-80 bg-pink-300/60 rounded-full filter blur-3xl animate-blob animation-delay-4000" />
        <div className="absolute bottom-[20%] right-[5%] w-72 h-72 bg-blue-300/60 rounded-full filter blur-3xl animate-blob animation-delay-6000" />
      </div>

      {/* Auth Card */}
      <div className="relative bg-white p-8 md:p-10 rounded-3xl shadow-xl w-full max-w-md mx-4 animate-fadeInUp">
        {/* Header with icon */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <i className="fas fa-arrow-right text-white text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign in with email</h2>
          <p className="text-slate-500 text-sm">Access your spending dashboard securely.</p>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div
            id="authError"
            className={`p-4 rounded-xl text-sm mb-6 border flex items-center gap-3 ${
              statusMessage.type === 'error'
                ? 'bg-red-50 text-red-600 border-red-100'
                : 'bg-green-50 text-green-600 border-green-100'
            } ${isShaking ? 'animate-shake' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                statusMessage.type === 'error' ? 'bg-red-100' : 'bg-green-100'
              }`}
            >
              <i
                className={`fas ${
                  statusMessage.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'
                }`}
              />
            </div>
            <span id="authErrorMessage" className="font-medium">
              {statusMessage.text}
            </span>
          </div>
        )}

        {/* Form */}
        <form id="authForm" className="space-y-5" onSubmit={handleEmailSubmit}>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <i className="fas fa-envelope text-sm" />
              </div>
              <input
                type="email"
                id="authEmail"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all duration-200"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <button
                type="button"
                id="forgotPasswordBtn"
                onClick={handleForgotPassword}
                className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <i className="fas fa-lock text-sm" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="authPassword"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all duration-200"
                placeholder="••••••••"
              />
              <button
                type="button"
                id="togglePassword"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`} id="eyeIcon" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="signInBtn"
            disabled={loading || googleLoading}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span>Signing in...</span>
                <svg
                  id="signInSpinner"
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </>
            ) : (
              <>
                <span id="signInText">Get Started</span>
                <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform" id="signInIcon" />
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-slate-200" />
          <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">Or sign in with</span>
          <div className="flex-grow border-t border-slate-200" />
        </div>

        {/* Google Sign In Button */}
        <button
          type="button"
          id="googleSignInBtn"
          disabled={loading || googleLoading}
          onClick={handleGoogleSignIn}
          className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <>
              <span>Signing in...</span>
              <svg
                id="googleSpinner"
                className="animate-spin h-5 w-5 text-slate-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </>
          ) : (
            <>
              <svg id="googleIcon" className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span id="googleSignInText">Continue with Google</span>
            </>
          )}
        </button>

        <p className="mt-6 text-xs text-slate-400 text-center flex items-center justify-center gap-2">
          <i className="fas fa-shield-alt text-blue-400" />
          <span>Your data is encrypted & secure</span>
        </p>
      </div>
    </div>
  );
}
