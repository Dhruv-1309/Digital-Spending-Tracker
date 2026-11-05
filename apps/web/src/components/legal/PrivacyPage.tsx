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
          MoneyTracker does not sell, rent, monetize, or broker your personal financial
          records. We do not use third-party advertising cookies or cross-site tracking.
          Your data is used solely to calculate your balances, budgets, and spending charts.
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
        <p>We only collect the information necessary to provide the service to you:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Account Details:</strong> Your email address and optional display name,
            managed securely via Firebase Authentication (Email/Password or Google Sign-In).
          </li>
          <li>
            <strong>Financial Records:</strong> The transactions you enter (dates, amounts,
            categories, payment methods, and optional descriptions), recurring autopay
            plans, and monthly budget limits.
          </li>
          <li>
            <strong>Device Storage:</strong> Local cache records in your browser (IndexedDB
            and localStorage) to enable offline usage.
          </li>
        </ul>
      </section>

      {/* Section 2: How We Use Your Data */}
      <section className="space-y-2">
        <h2 className="text-base sm:text-lg font-semibold text-ink flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surface-2 text-ink-2 text-xs flex items-center justify-center font-bold">
            2
          </span>
          How We Use Your Data
        </h2>
        <p>Your data is used strictly for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Calculating your daily spending averages, balances, and monthly budget pacing.</li>
          <li>Generating spending category analytics and visual charts.</li>
          <li>Synchronizing records between your offline cache and the cloud database.</li>
          <li>Preventing spam and abusive registrations via rate limiting.</li>
        </ul>
        <p>
          We do not use your financial data for machine learning profiling, behavioral advertising,
          or credit scoring.
        </p>
      </section>

      {/* Section 3: Third-Party Services & Trackers */}
      <section className="space-y-2">
        <h2 className="text-base sm:text-lg font-semibold text-ink flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surface-2 text-ink-2 text-xs flex items-center justify-center font-bold">
            3
          </span>
          Third-Party Services
        </h2>
        <p>
          MoneyTracker relies only on essential backend infrastructure to authenticate users
          and store data securely:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Firebase Authentication:</strong> Industry-standard authentication token
            management and identity verification.
          </li>
          <li>
            <strong>PostgreSQL Database:</strong> Secure encrypted cloud storage for your
            financial records.
          </li>
        </ul>
        <p>
          We do not load third-party social media trackers, ad pixels, or analytics telemetry
          libraries.
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
          You retain complete control of your financial records. You can download an export
          copy (in CSV or JSON format) whenever you want.
        </p>
        <p>
          When you delete your account via <strong>Profile Settings &rarr; Delete Account</strong>,
          all your transactions, custom categories, autopay commitments, and profile records
          are immediately and permanently purged from the database and your local browser
          cache.
        </p>
      </section>

      {/* Section 5: Questions & Contact */}
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
