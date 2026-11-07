import { LegalLayout } from './LegalLayout';
import { CheckIcon, SparklesIcon } from '../icons';

export interface AccessibilityPageProps {
  onBack?: () => void;
}

export function AccessibilityPage({ onBack }: AccessibilityPageProps) {
  return (
    <LegalLayout
      title="Accessibility Statement"
      subtitle="Our formal commitment to digital inclusion, barrier-free access, and compliance with WCAG 2.1 Level AA guidelines."
      lastUpdated="November 8, 2026"
      onBack={onBack}
    >
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">1. Our Commitment</h2>
        <p>
          MoneyTracker is designed and engineered to ensure that digital financial management is usable by everyone,
          including individuals with visual, auditory, motor, or cognitive disabilities.
          We continually evaluate and enhance our user interfaces against the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong> standard.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">2. Key Accessibility Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-card border border-line bg-surface-2/50 space-y-1">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <CheckIcon size={14} className="text-positive" /> Full Keyboard Navigability
            </span>
            <p className="text-xs text-ink-3">
              All interactive controls, modals, tabs, dropdowns, and forms can be operated using standard keyboard navigation (<kbd className="px-1 py-0.5 bg-surface border border-line rounded text-[10px]">Tab</kbd>, <kbd className="px-1 py-0.5 bg-surface border border-line rounded text-[10px]">Enter</kbd>, <kbd className="px-1 py-0.5 bg-surface border border-line rounded text-[10px]">Space</kbd>, <kbd className="px-1 py-0.5 bg-surface border border-line rounded text-[10px]">Esc</kbd>).
            </p>
          </div>

          <div className="p-3.5 rounded-card border border-line bg-surface-2/50 space-y-1">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <CheckIcon size={14} className="text-positive" /> Focus Management & Rings
            </span>
            <p className="text-xs text-ink-3">
              High-visibility focus rings (<code className="text-[11px]">focus-visible:ring-2</code>) highlight active elements. Focus is trapped cleanly in modal dialogs and returned upon dismissal.
            </p>
          </div>

          <div className="p-3.5 rounded-card border border-line bg-surface-2/50 space-y-1">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <CheckIcon size={14} className="text-positive" /> Color Contrast & Typography
            </span>
            <p className="text-xs text-ink-3">
              Color palettes satisfy minimum contrast ratios of 4.5:1 for body copy and 3:1 for large display text and interface borders in both light and dark themes.
            </p>
          </div>

          <div className="p-3.5 rounded-card border border-line bg-surface-2/50 space-y-1">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <CheckIcon size={14} className="text-positive" /> Screen Reader Compatibility
            </span>
            <p className="text-xs text-ink-3">
              Semantic HTML5 landmark regions (<code className="text-[11px]">&lt;header&gt;</code>, <code className="text-[11px]">&lt;main&gt;</code>, <code className="text-[11px]">&lt;nav&gt;</code>), explicit ARIA live announcements for toasts, and descriptive form labels support NVDA, JAWS, VoiceOver, and TalkBack.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2">
          <SparklesIcon size={18} className="text-accent" />
          3. Automated Quality Gates in CI
        </h2>
        <p>
          To prevent accessibility regressions, our engineering pipeline executes automated <strong>axe-core</strong> assertions on every component during continuous integration builds.
          Pull requests that introduce accessibility violations are automatically blocked from merging.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">4. Feedback & Support</h2>
        <p>
          We welcome feedback on the accessibility of MoneyTracker. If you encounter any barriers or have suggestions for improvement, please contact our engineering team:
        </p>
        <div className="p-3.5 rounded-card border border-line bg-surface-2/40 text-xs text-ink-2 space-y-1">
          <p><strong>Email:</strong> accessibility@moneytracker.app</p>
          <p><strong>GitHub Issues:</strong> https://github.com/moneytracker/moneytracker/issues</p>
          <p className="text-ink-3 pt-1">We aim to respond to accessibility inquiries within 3 business days.</p>
        </div>
      </section>
    </LegalLayout>
  );
}
