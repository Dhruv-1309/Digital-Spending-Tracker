import { useEffect, useRef } from 'react';
import { XIcon, HelpCircleIcon } from '../icons';
import { Button } from '../ui/Button';

export interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  key: string;
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutItem[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { key: '1', description: 'Go to Dashboard' },
      { key: '2', description: 'Go to Transactions' },
      { key: '3', description: 'Go to Autopay' },
      { key: '4', description: 'Go to Analytics' },
    ],
  },
  {
    title: 'Actions & Quick Capture',
    shortcuts: [
      { key: 'N or +', description: 'Open Add Transaction dialog' },
      { key: '/', description: 'Focus search bar (in Transactions)' },
      { key: 'Esc', description: 'Close active modal or slide-over' },
      { key: '?', description: 'Open this keyboard shortcuts guide' },
    ],
  },
  {
    title: 'Form & Calculation Shortcuts',
    shortcuts: [
      { key: 'Enter', description: 'Evaluate math formula in Amount input' },
      { key: 'Tab', description: 'Navigate forward between interactive inputs' },
      { key: 'Shift + Tab', description: 'Navigate backward between inputs' },
    ],
  },
];

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap / auto-focus
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-lg bg-surface rounded-card border border-line shadow-3 p-6 space-y-6 focus:outline-none animate-scaleIn"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-accent-tint flex items-center justify-center text-accent">
              <HelpCircleIcon size={18} />
            </div>
            <div>
              <h2
                id="shortcuts-dialog-title"
                className="font-display font-semibold text-lg text-ink"
              >
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-ink-3">Speed up your financial workflow</p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
            className="p-1.5 text-ink-3 hover:text-ink"
            icon={<XIcon size={18} />}
          />
        </div>

        {/* Shortcut Groups */}
        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <h3 className="text-xs font-semibold text-ink-2 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="rounded-card border border-line bg-surface-2/40 divide-y divide-line">
                {group.shortcuts.map((sc) => (
                  <div
                    key={sc.key}
                    className="flex items-center justify-between px-3 py-2 text-xs"
                  >
                    <span className="text-ink-2">{sc.description}</span>
                    <kbd className="px-2 py-0.5 rounded bg-surface border border-line font-mono text-[11px] font-semibold text-ink shadow-sm">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-line flex items-center justify-between text-xs text-ink-3">
          <span>Press <kbd className="px-1 py-0.5 bg-surface-2 rounded text-[10px]">?</kbd> anywhere to view shortcuts</span>
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
}
