import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { EASING } from '../../ui/motion';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { XIcon, MailIcon, CheckIcon, SparklesIcon } from '../icons';

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackType = 'feature' | 'bug' | 'general' | 'question';
type Satisfaction = 'positive' | 'neutral' | 'negative' | '';

const CONTACT_EMAIL = 'support@moneytracker.app';

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [type, setType] = useState<FeedbackType>('general');
  const [satisfaction, setSatisfaction] = useState<Satisfaction>('positive');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [copied, setCopied] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Pre-fill email when user is authenticated
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  // Accessibility: focus management on open/close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    } else {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
      // Reset form state when closed
      setMessage('');
      setCopied(false);
    }
  }, [isOpen]);

  // Accessibility: close on Escape key and trap tab focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getDiagnosticsString = (): string => {
    if (!includeDiagnostics) return '';
    const diag = [
      '--- System Diagnostics ---',
      `App Version: 3.0.0`,
      `User Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'}`,
      `Screen: ${typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Unknown'}`,
      `Online: ${typeof navigator !== 'undefined' && navigator.onLine ? 'Yes' : 'No'}`,
      `Timestamp: ${new Date().toISOString()}`,
    ];
    return diag.join('\n');
  };

  const constructFormattedBody = (): string => {
    const lines = [
      `Feedback Type: ${type.toUpperCase()}`,
      satisfaction ? `Satisfaction: ${satisfaction}` : '',
      email ? `From: ${email}` : '',
      '',
      '--- Message ---',
      message.trim(),
      '',
      getDiagnosticsString(),
    ].filter((line) => line !== undefined);

    return lines.join('\n');
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast('Please enter your feedback before submitting.', 'error');
      return;
    }

    const subject = encodeURIComponent(
      `[MoneyTracker Feedback] ${type.charAt(0).toUpperCase() + type.slice(1)} - ${message.slice(0, 40)}...`,
    );
    const body = encodeURIComponent(constructFormattedBody());
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    window.open(mailtoUrl, '_blank', 'noopener,noreferrer');
    showToast('Email client opened. Thank you for your feedback!', 'success');
    onClose();
  };

  const handleCopy = async () => {
    if (!message.trim()) {
      showToast('Please enter your feedback before copying.', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(constructFormattedBody());
      setCopied(true);
      showToast('Feedback copied to clipboard! You can paste it into your email.', 'success');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      showToast('Unable to copy to clipboard.', 'error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="feedback-dialog-backdrop"
          className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <m.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-dialog-title"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: EASING.standard }}
            className="w-full max-w-lg rounded-2xl bg-surface border border-line shadow-3 p-6 flex flex-col gap-5 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent">
                  <MailIcon size={20} />
                </div>
                <div>
                  <h2 id="feedback-dialog-title" className="font-display text-lg font-semibold text-ink">
                    Send Feedback
                  </h2>
                  <p className="text-xs text-ink-3">
                    Direct line to our engineering team at <span className="font-medium text-ink">{CONTACT_EMAIL}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close feedback modal"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
              {/* Category Segmented Control */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider">
                  Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-surface-2 rounded-xl border border-line">
                  {(
                    [
                      { id: 'general', label: 'Feedback' },
                      { id: 'bug', label: 'Bug Report' },
                      { id: 'feature', label: 'Idea / Feature' },
                      { id: 'question', label: 'Question' },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setType(cat.id)}
                      className={`h-8 rounded-lg text-xs font-medium transition-all ${
                        type === cat.id
                          ? 'bg-surface text-accent font-semibold shadow-1'
                          : 'text-ink-2 hover:text-ink hover:bg-surface/50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sentiment / Experience */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider">
                  How is your experience?
                </label>
                <div className="flex items-center gap-2">
                  {(
                    [
                      { id: 'positive', label: 'Loving it', emoji: '😍' },
                      { id: 'neutral', label: 'It is okay', emoji: '😐' },
                      { id: 'negative', label: 'Needs work', emoji: '😕' },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSatisfaction(s.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium transition-colors ${
                        satisfaction === s.id
                          ? 'border-accent bg-accent-tint text-accent font-semibold'
                          : 'border-line bg-surface text-ink-2 hover:bg-surface-2'
                      }`}
                    >
                      <span aria-hidden="true">{s.emoji}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Message */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="feedback-message" className="text-xs font-semibold text-ink uppercase tracking-wider">
                    Your Message <span className="text-danger">*</span>
                  </label>
                  <span className="text-[11px] text-ink-3">
                    {message.length} / 1000
                  </span>
                </div>
                <textarea
                  id="feedback-message"
                  ref={textareaRef}
                  required
                  rows={4}
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What happened? What would make MoneyTracker even better for your daily budgeting?"
                  className="w-full rounded-xl border border-line bg-surface p-3 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-tint resize-none"
                />
              </div>

              {/* Contact Email (Optional) */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="feedback-email" className="text-xs font-semibold text-ink uppercase tracking-wider">
                  Your Email (for replies)
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-tint"
                />
              </div>

              {/* Diagnostic Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="feedback-diag"
                  type="checkbox"
                  checked={includeDiagnostics}
                  onChange={(e) => setIncludeDiagnostics(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line text-accent focus:ring-accent"
                />
                <label htmlFor="feedback-diag" className="text-xs text-ink-2 cursor-pointer select-none">
                  Include anonymous system diagnostics (app version, browser, screen size) to help debug issues
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-line mt-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!message.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-ink-2 hover:text-ink hover:bg-surface-2 rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  {copied ? <CheckIcon size={14} className="text-emerald-500" /> : <SparklesIcon size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!message.trim()}
                  >
                    Send Email
                  </Button>
                </div>
              </div>
            </form>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default FeedbackModal;
