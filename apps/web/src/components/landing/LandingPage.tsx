import React from 'react';
import { m } from 'motion/react';
import { EASING } from '../../ui/motion';
import {
  WalletIcon,
  ShieldIcon,
  LockIcon,
  CheckIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  ZapIcon,
  RefreshCwIcon,
  DownloadIcon,
  PieChartIcon,
  CalendarDaysIcon,
} from '../icons';

export interface LandingPageProps {
  onGetStarted: () => void;
  onNavigateLegal: (path: '/terms' | '/privacy') => (e: React.MouseEvent) => void;
}

export function LandingPage({ onGetStarted, onNavigateLegal }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-surface-1 text-ink flex flex-col font-sans selection:bg-accent-tint selection:text-accent">
      {/* ====================================================================
          Top Navigation Bar
          ==================================================================== */}
      <header className="sticky top-0 z-30 w-full border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-1">
              <WalletIcon size={22} />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-ink block leading-none">
                MoneyTracker
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-accent block mt-0.5">
                Privacy-First Finance
              </span>
            </div>
          </div>

          <nav aria-label="Landing Navigation" className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-2">
            <a href="#features" className="hover:text-ink transition-colors">Features</a>
            <a href="#privacy" className="hover:text-ink transition-colors">Privacy Stance</a>
            <a href="#architecture" className="hover:text-ink transition-colors">Architecture</a>
            <a href="/terms" onClick={onNavigateLegal('/terms')} className="hover:text-ink transition-colors">Terms</a>
            <a href="/privacy" onClick={onNavigateLegal('/privacy')} className="hover:text-ink transition-colors">Privacy</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              id="landingSignInBtn"
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-all shadow-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span>Sign In / Launch</span>
              <ArrowRightIcon size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================
          Hero Section
          ==================================================================== */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-6">
            {/* Pill */}
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASING.standard }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-tint border border-accent/20 text-xs font-semibold text-accent shadow-sm"
            >
              <ShieldIcon size={14} className="text-accent" />
              <span>Zero Account Aggregators • 100% Data Sovereignty</span>
            </m.div>

            {/* Headline */}
            <m.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: EASING.standard }}
              className="font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink leading-[1.12]"
            >
              Master your cashflow. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-indigo-600 to-emerald-600">
                Without selling your financial data.
              </span>
            </m.h1>

            {/* Subhead */}
            <m.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: EASING.standard }}
              className="text-base sm:text-xl text-ink-2 leading-relaxed max-w-2xl"
            >
              MoneyTracker is an owned, integer-precise personal finance engine engineered for privacy.
              No bank logins, no SMS scrapers, and instant offline-first IndexedDB synchronization.
            </m.p>

            {/* CTA Buttons */}
            <m.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: EASING.standard }}
              className="flex flex-col sm:flex-row items-center gap-3.5 pt-2 w-full sm:w-auto"
            >
              <button
                id="heroGetStartedBtn"
                type="button"
                onClick={onGetStarted}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-accent text-white text-base font-semibold hover:bg-accent-hover transition-all shadow-2 hover:shadow-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span>Get Started Free</span>
                <ArrowRightIcon size={18} />
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-surface-2 text-ink text-base font-medium hover:bg-surface-3 transition-colors border border-line"
              >
                <span>Explore Features</span>
              </a>
            </m.div>

            {/* Micro Trust Proof */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-3 text-xs text-ink-3">
              <span className="flex items-center gap-1.5">
                <CheckIcon size={14} className="text-emerald-500" /> Integer Paise Precision
              </span>
              <span className="flex items-center gap-1.5">
                <LockIcon size={14} className="text-accent" /> Strict Tenant Isolation
              </span>
              <span className="flex items-center gap-1.5">
                <RefreshCwIcon size={14} className="text-indigo-500" /> Offline Write Queue
              </span>
            </div>
          </div>

          {/* Interactive Hero Showcase Card */}
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: EASING.standard }}
            className="mt-14 max-w-4xl mx-auto rounded-3xl bg-surface border border-line shadow-3 p-6 sm:p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-line gap-4">
              <div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wider block">
                  Live Dashboard Preview
                </span>
                <h3 className="font-display text-xl font-bold text-ink mt-0.5">
                  Monthly Financial Summary
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Budget on Track (68%)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="p-4 rounded-2xl bg-surface-2 border border-line">
                <span className="text-xs text-ink-3 font-medium">Monthly Outflow</span>
                <p className="font-display text-2xl font-bold text-ink mt-1 tabular-nums">
                  ₹42,850.00
                </p>
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                  <TrendingUpIcon size={12} /> Within ₹60,000 budget cap
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-2 border border-line">
                <span className="text-xs text-ink-3 font-medium">Safe Daily Spending</span>
                <p className="font-display text-2xl font-bold text-accent mt-1 tabular-nums">
                  ₹1,225.00
                </p>
                <span className="text-[11px] text-ink-3 mt-1 block">
                  14 days remaining in month
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-2 border border-line">
                <span className="text-xs text-ink-3 font-medium">Autopay Obligations</span>
                <p className="font-display text-2xl font-bold text-ink mt-1 tabular-nums">
                  ₹8,499.00
                </p>
                <span className="text-[11px] text-indigo-600 font-medium block mt-1">
                  4 active recurring plans
                </span>
              </div>
            </div>
          </m.div>
        </div>
      </section>

      {/* ====================================================================
          Core Features Grid (WEB-3)
          ==================================================================== */}
      <section id="features" className="py-20 sm:py-28 bg-surface-2/40 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Built for speed, accuracy, and absolute privacy.
            </h2>
            <p className="text-base text-ink-2 mt-3">
              Every detail engineered from scratch with integer math, offline resilience, and zero third-party telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-surface border border-line shadow-1 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-tint text-accent flex items-center justify-center">
                <ZapIcon size={20} />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">
                Integer Paise Exactness
              </h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                Money is stored and calculated in whole integer paise. Eliminates binary floating-point drift,
                ensuring <code className="text-xs font-mono bg-surface-2 px-1 py-0.5 rounded">0.1 + 0.2 = 0.3</code> precision across all views.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-surface border border-line shadow-1 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <RefreshCwIcon size={20} />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">
                Offline-First IndexedDB
              </h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                Log expenses on airplanes or spotty mobile connections. Mutations queue locally in IndexedDB
                and sync automatically with exponential backoff when connection resumes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-surface border border-line shadow-1 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CalendarDaysIcon size={20} />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">
                Clamped Autopay Engine
              </h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                Recurring bills clamp safely to calendar month boundaries (28, 29, 30, or 31 days) including
                leap years and Last Day execution, with idempotency keys preventing duplicates.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-surface border border-line shadow-1 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <PieChartIcon size={20} />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">
                Statistical Anomaly Alerts
              </h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                Unusual transactions are flagged using local standard deviation and 2-sigma thresholds without
                transmitting your transaction history to third-party AI models.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-surface border border-line shadow-1 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <DownloadIcon size={20} />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">
                Zero Vendor Lock-in
              </h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                Full bi-directional portability. Export your entire history to RFC 4180 CSV or structured JSON
                with SHA-256 integrity checksums whenever you choose.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-surface border border-line shadow-1 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <LockIcon size={20} />
              </div>
              <h3 className="font-display text-lg font-bold text-ink">
                1-Click Account Obliteration
              </h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                Permanently purge your account, database records, and local offline queue with a single click.
                No retained shadow copies or delayed deletion queues.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          Privacy & Security Manifesto (WEB-3)
          ==================================================================== */}
      <section id="privacy" className="py-20 sm:py-28 border-b border-line">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-accent-tint text-accent flex items-center justify-center">
            <ShieldIcon size={26} />
          </div>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-ink tracking-tight">
            Our Privacy Stance: You are the owner, not the product.
          </h2>
          <p className="text-base sm:text-lg text-ink-2 leading-relaxed text-left sm:text-center">
            Most finance apps monetize by harvesting your transaction history, aggregating your net worth,
            or marketing credit cards to you. MoneyTracker is designed to be the exact opposite: an owned
            personal tool with strict zero-knowledge architecture.
          </p>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-6">
            <div className="p-4 rounded-xl bg-surface-2 border border-line flex items-start gap-3">
              <CheckIcon size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm text-ink">No bank credential requests, account aggregators, or read SMS permissions.</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-2 border border-line flex items-start gap-3">
              <CheckIcon size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm text-ink">Strict tenant isolation backed by PostgreSQL user-scoped row queries.</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-2 border border-line flex items-start gap-3">
              <CheckIcon size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm text-ink">Zero advertising cookies, tracking beacons, or telemetry SDKs.</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-2 border border-line flex items-start gap-3">
              <CheckIcon size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm text-ink">Aligned with India DPDP Act 2023: explicit purpose and right to erasure.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          Call to Action Banner
          ==================================================================== */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-surface to-accent-tint/30 border-b border-line">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center gap-6">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
            Start tracking with clarity today.
          </h2>
          <p className="text-base text-ink-2 max-w-xl">
            Free, fast, and private. Takes less than 30 seconds to get started.
          </p>
          <button
            id="bottomCtaBtn"
            type="button"
            onClick={onGetStarted}
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-accent text-white text-base font-semibold hover:bg-accent-hover transition-all shadow-2 hover:shadow-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span>Launch MoneyTracker</span>
            <ArrowRightIcon size={18} />
          </button>
        </div>
      </section>

      {/* ====================================================================
          Footer
          ==================================================================== */}
      <footer className="py-12 bg-surface text-xs text-ink-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-semibold text-ink">MoneyTracker</span>
            <span>•</span>
            <span>Licensed under MIT License</span>
          </div>

          <div className="flex items-center gap-6 font-medium text-ink-2">
            <a href="/terms" onClick={onNavigateLegal('/terms')} className="hover:text-ink transition-colors">
              Terms of Use
            </a>
            <a href="/privacy" onClick={onNavigateLegal('/privacy')} className="hover:text-ink transition-colors">
              Privacy Policy
            </a>
            <a href="/api/docs" className="hover:text-ink transition-colors">
              API Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
