import React from 'react';
import { WalletIcon, ChevronLeftIcon } from '../icons';
import { Button } from '../ui/Button';

export interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  onBack?: () => void;
  children: React.ReactNode;
}

export function LegalLayout({
  title,
  subtitle,
  lastUpdated,
  onBack,
  children,
}: LegalLayoutProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    }
  };

  const navigateTo = (path: string, hash: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      window.location.hash = hash;
      try {
        window.history.pushState({}, '', path);
      } catch {
        // Fallback for environments without pushState
      }
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-card bg-accent-tint flex items-center justify-center text-accent">
              <WalletIcon size={20} />
            </div>
            <div>
              <span className="font-display font-semibold text-base sm:text-lg text-ink tracking-tight block leading-tight">
                MoneyTracker
              </span>
              <span className="text-[11px] text-ink-3 hidden sm:block">
                Personal Finance & Budgeting
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleBack}
            icon={<ChevronLeftIcon size={14} />}
            className="text-xs"
          >
            Back to App
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-surface rounded-card border border-line shadow-1 p-6 sm:p-10 space-y-8 animate-fadeIn">
          {/* Header Banner */}
          <div className="border-b border-line pb-6 space-y-2">
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-chip text-xs font-medium bg-accent-tint text-accent">
              Plain-Language Policy
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-ink-2 max-w-2xl">{subtitle}</p>
            <p className="text-xs text-ink-3 pt-1">Last updated: {lastUpdated}</p>
          </div>

          {/* Document Content */}
          <div className="prose prose-sm max-w-none text-ink-2 space-y-6 text-sm leading-relaxed">
            {children}
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="w-full border-t border-line py-6 bg-surface mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-3">
          <span>© {new Date().getFullYear()} MoneyTracker. Built for personal use.</span>
          <div className="flex items-center gap-4">
            <a
              href="/terms"
              onClick={navigateTo('/terms', 'terms')}
              className="hover:text-ink hover:underline transition-colors"
            >
              Terms and Conditions
            </a>
            <span>•</span>
            <a
              href="/privacy"
              onClick={navigateTo('/privacy', 'privacy')}
              className="hover:text-ink hover:underline transition-colors"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
