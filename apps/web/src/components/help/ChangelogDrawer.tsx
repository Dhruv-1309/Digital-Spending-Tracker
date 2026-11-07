import { useEffect, useRef } from 'react';
import { XIcon, SparklesIcon, ShieldIcon, ZapIcon, CheckCircleIcon } from '../icons';
import { Button } from '../ui/Button';

export interface ChangelogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  badge?: string;
  highlights: Array<{
    type: 'feature' | 'security' | 'perf' | 'improvement';
    text: string;
  }>;
}

const RELEASES: ChangelogEntry[] = [
  {
    version: '3.0.0',
    date: 'November 2026',
    title: 'Enterprise Architecture & Differentiating Intelligence',
    badge: 'Latest',
    highlights: [
      {
        type: 'feature',
        text: 'Safe to Spend Today (DIFF-1): Live dynamic daily spending allowance deducting upcoming autopay liabilities.',
      },
      {
        type: 'feature',
        text: 'Bank Statement CSV Import (DIFF-2): Offline statement parser supporting HDFC, ICICI, SBI with automated merchant learning.',
      },
      {
        type: 'feature',
        text: 'Recurring Charge Detector (DIFF-3): Algorithmic detection of subscription changes and one-click Autopay conversion.',
      },
      {
        type: 'feature',
        text: 'Explainable Insights (DIFF-4): Transparent mathematical breakdown cards for all forecasting models.',
      },
      {
        type: 'feature',
        text: '30-Day Trash & Batch Undo (DIFF-5): Soft-delete recovery and 1-click reversal of entire CSV import batches.',
      },
      {
        type: 'security',
        text: 'Passphrase-Encrypted Backups (DIFF-6): Browser Web Crypto AES-256-GCM zero-knowledge exported backups.',
      },
      {
        type: 'perf',
        text: 'Integer Paise Engine (CORE-2): Full elimination of binary floating-point drift across calculations and reports.',
      },
      {
        type: 'security',
        text: 'Cloudflare Turnstile Bot Protection (SEC-19) & CSV injection formula sanitization (SEC-6).',
      },
    ],
  },
  {
    version: '2.0.0',
    date: 'September 2026',
    title: 'Autopay Automation & Statistical Analytics',
    highlights: [
      {
        type: 'feature',
        text: 'Autopay Schedule Engine: Monthly recurring bill tracking with calendar timeline visualization.',
      },
      {
        type: 'improvement',
        text: 'Statistical Anomaly Detection: Z-score evaluation identifying uncharacteristic transaction outliers.',
      },
      {
        type: 'improvement',
        text: '7-Day Simple Moving Average (SMA) and Capital Runway forecast metrics.',
      },
      {
        type: 'perf',
        text: 'Offline-First Write Queue: Persistent IndexedDB synchronization with exponential retry backoff.',
      },
    ],
  },
  {
    version: '1.0.0',
    date: 'May 2026',
    title: 'Initial MoneyTracker Launch',
    highlights: [
      {
        type: 'feature',
        text: 'Personal Finance Tracking: Categorized expense logging with Indian rupee formatting.',
      },
      {
        type: 'feature',
        text: 'Monthly Budget Caps with progressive warning thresholds and visual progress meters.',
      },
      {
        type: 'improvement',
        text: 'Portable Data Export: Full CSV data export and backup restoration.',
      },
    ],
  },
];

export function ChangelogDrawer({ isOpen, onClose }: ChangelogDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Record latest release version viewed (WEB-17)
    try {
      localStorage.setItem('mt_last_seen_changelog', RELEASES[0].version);
    } catch {
      // ignore storage error
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="changelogDrawerTitle"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          ref={drawerRef}
          className="w-screen max-w-md bg-surface text-ink shadow-3 border-l border-line flex flex-col animate-slideInRight"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-tint text-accent">
                <SparklesIcon size={20} />
              </div>
              <div>
                <h2
                  id="changelogDrawerTitle"
                  className="font-display font-semibold text-lg text-ink"
                >
                  What&apos;s New
                </h2>
                <p className="text-xs text-ink-3">Recent releases & product updates</p>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              aria-label="Close what's new drawer"
              className="p-1.5 text-ink-3 hover:text-ink"
              icon={<XIcon size={18} />}
            />
          </div>

          {/* Release list */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 divide-y divide-line/60">
            {RELEASES.map((release, idx) => (
              <div key={release.version} className={idx > 0 ? 'pt-8' : ''}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-base text-ink">
                      v{release.version}
                    </span>
                    {release.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-chip text-[11px] font-semibold bg-accent-tint text-accent">
                        {release.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium text-ink-3">{release.date}</span>
                </div>

                <h3 className="text-sm font-semibold text-ink-2 mb-3">{release.title}</h3>

                <ul className="space-y-2.5">
                  {release.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-ink-2 leading-relaxed">
                      <span className="mt-0.5 shrink-0">
                        {h.type === 'feature' && <CheckCircleIcon size={14} className="text-income" />}
                        {h.type === 'security' && <ShieldIcon size={14} className="text-accent" />}
                        {h.type === 'perf' && <ZapIcon size={14} className="text-warning" />}
                        {h.type === 'improvement' && <SparklesIcon size={14} className="text-accent" />}
                      </span>
                      <span>{h.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-line bg-surface-2/40 flex items-center justify-between text-xs text-ink-3">
            <span>MoneyTracker v3.0 &bull; Privacy-first</span>
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
