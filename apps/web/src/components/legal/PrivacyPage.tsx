import { LegalLayout } from './LegalLayout';
import { ShieldIcon } from '../icons';

export interface PrivacyPageProps {
  onBack?: () => void;
}

export function PrivacyPage({ onBack }: PrivacyPageProps) {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How MoneyTracker safeguards your financial information, handles data storage, and respects your privacy."
      lastUpdated="November 2026"
      onBack={onBack}
    >
      {/* Overview Card */}
      <div className="p-4 rounded-btn bg-income-tint/40 border border-income/20 flex items-start gap-3 text-ink">
        <ShieldIcon size={20} className="text-income shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <strong className="block text-ink font-semibold mb-1">
            Privacy First — No Trackers, No Data Selling
          </strong>
          MoneyTracker (Digital Spending Tracker) does not sell, rent, monetize, or broker your
          personal financial records. We do not use third-party advertising cookies, marketing
          pixels, or cross-site tracking. Your data is used solely to calculate your balances,
          budgets, spending charts, and recurring commitments.
        </div>
      </div>

      {/* Section 1: Information We Collect */}
      <section className="space-y-2">
        <h2 className="text-base sm:text-lg font-semibold text-ink flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surface-2 text-ink-2 text-xs flex items-center justify-center font-bold">
            1
          </span>
          Information We Collect
        </h2>
        <p>
          MoneyTracker operates on a principle of data minimization. We only collect the
          information necessary to calculate and display your personal finances:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Account Details:</strong> Your email address and optional display name,
            managed securely via Firebase Authentication (Email/Password or Google Sign-In).
          </li>
          <li>
            <strong>Financial Records:</strong> The transactions you enter (dates, amounts in
            rupees/paise, categories, payment methods, and optional descriptions), recurring
            autopay schedules, and monthly budget limits.
          </li>
          <li>
            <strong>Device Storage:</strong> Local cache records stored directly in your browser
            (IndexedDB and localStorage) to provide offline-first resilience and instant optimistic
            updates.
          </li>
          <li>
            <strong>Abuse Prevention Data:</strong> Standard IP addresses for rate limiting on
            registration and login endpoints to protect the service against automated spam.
          </li>
        </ul>
        <p>
          <strong>What We Never Collect:</strong> We never collect, request, or store your bank
          account numbers, internet banking passwords, credit card numbers, CVVs, or UPI PINs.
          MoneyTracker has no access to your banking accounts.
        </p>
      </section>

      {/* Section 2: How We Use Your Data */}
      <section className="space-y-2">
        <h2 className="text-base sm:text-lg font-semibold text-ink flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surface-2 text-ink-2 text-xs flex items-center justify-center font-bold">
            2
          </span>
          How We Use Your Data
        </h2>
        <p>Your data is used strictly to provide you with your personal spending dashboard:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Calculating current balances, monthly income vs. expense totals, and daily burn rate.
          </li>
          <li>
            Tracking monthly budget targets and alerting you when spending approaches or exceeds
            your configured thresholds.
          </li>
          <li>
            Detecting statistical anomalies (such as an expense exceeding 2 standard deviations
            above your category average) to help you catch unexpected charges.
          </li>
          <li>
            Running scheduled recurring commitments (autopay) exactly once per month.
          </li>
          <li>
            Generating 7-day Simple Moving Average (SMA) trends and money runway projections.
          </li>
          <li>
            Synchronizing data between your offline browser cache and the cloud database.
          </li>
        </ul>
        <p>
          We do not use your financial data for commercial AI training, credit scoring, behavioral
          profiling, or targeted advertisements.
        </p>
      </section>

      {/* Section 3: Third-Party Services & Infrastructure */}
      <section className="space-y-2">
        <h2 className="text-base sm:text-lg font-semibold text-ink flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surface-2 text-ink-2 text-xs flex items-center justify-center font-bold">
            3
          </span>
          Third-Party Services &amp; Infrastructure
        </h2>
        <p>
          MoneyTracker relies only on trusted infrastructure providers essential to service
          delivery:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Firebase Authentication (Google Cloud):</strong> Handles secure sign-in,
            password hashing, and JSON Web Token (JWT) verification.
          </li>
          <li>
            <strong>PostgreSQL Database &amp; API:</strong> Secure, encrypted cloud storage for your
            synchronized financial entries.
          </li>
          <li>
            <strong>Cloudflare Turnstile (when enabled):</strong> Privacy-preserving spam protection
            on signup forms without invasive CAPTCHA challenges or tracking cookies.
          </li>
        </ul>
        <p>
          We do not embed third-party advertising SDKs, tracking pixels, or third-party behavioral
          analytics scripts.
        </p>
      </section>

      {/* Section 4: Data Retention & Permanent Deletion */}
      <section className="space-y-2">
        <h2 className="text-base sm:text-lg font-semibold text-ink flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surface-2 text-ink-2 text-xs flex items-center justify-center font-bold">
            4
          </span>
          Data Retention &amp; Permanent Deletion
        </h2>
        <p>
          You retain complete ownership and portability over your financial records. You can
          export your complete transaction history to CSV or JSON anytime via the Transactions
          view.
        </p>
        <p>
          When you delete your account via <strong>Profile Settings &rarr; Delete Account</strong>,
          all your transactions, custom categories, autopay commitments, and profile records are
          immediately and permanently purged from our database and cleared from your browser&apos;s
          local storage.
        </p>
      </section>

      {/* Section 5: Contact */}
      <section className="space-y-2">
        <h2 className="text-base sm:text-lg font-semibold text-ink flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surface-2 text-ink-2 text-xs flex items-center justify-center font-bold">
            5
          </span>
          Contact
        </h2>
        <p>
          If you have questions about this policy or wish to submit a privacy inquiry or
          deletion request, please contact the project administrator.
        </p>
      </section>
    </LegalLayout>
  );
}

export default PrivacyPage;
