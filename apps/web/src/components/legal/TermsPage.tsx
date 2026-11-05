import { LegalLayout } from './LegalLayout';
import { AlertTriangleIcon, InfoIcon } from '../icons';

export interface TermsPageProps {
  onBack?: () => void;
}

export function TermsPage({ onBack }: TermsPageProps) {
  return (
    <LegalLayout
      title="Terms and Conditions"
      subtitle="Simple, transparent terms outlining how MoneyTracker operates, user responsibilities, and acceptable use."
      lastUpdated="November 2026"
      onBack={onBack}
    >
      {/* Overview Card */}
      <div className="p-4 rounded-btn bg-accent-tint/40 border border-accent/20 flex items-start gap-3 text-ink">
        <InfoIcon size={20} className="text-accent shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <strong className="block text-ink font-semibold mb-1">
            Summary in Plain English
          </strong>
          MoneyTracker is a personal project created to help track daily spending. It is
          provided free of charge on an &ldquo;as-is&rdquo; basis. You own your data, you
          are responsible for your account, friend-sharing features must not be abused or
          used to spam others, and you may delete your account and data whenever you wish.
        </div>
      </div>

      {/* Section 1: Personal Project & As-Is Service */}
      <section className="space-y-2">
        <h2 className="text-base sm:text-lg font-semibold text-ink flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surface-2 text-ink-2 text-xs flex items-center justify-center font-bold">
            1
          </span>
          Personal Project &amp; &ldquo;As-Is&rdquo; Availability
        </h2>
        <p>
          MoneyTracker is developed and maintained as an independent personal project. The
          service is provided on an <strong>&ldquo;as-is&rdquo;</strong> and{' '}
          <strong>&ldquo;as-available&rdquo;</strong> basis without warranties of any
          kind, express or implied.
        </p>
        <p>
          Because this is a personal project, there is no uptime guarantee, service level
          agreement (SLA), or promise of uninterrupted service. While we strive to maintain
          high availability and data integrity, we are not liable for any temporary downtime,
          service interruptions, or connectivity delays. We encourage you to make periodic
          backups of your transactions using the built-in CSV or JSON export feature.
        </p>
      </section>

      {/* Section 2: Account Responsibilities */}
      <section className="space-y-2">
        <h2 className="text-base sm:text-lg font-semibold text-ink flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surface-2 text-ink-2 text-xs flex items-center justify-center font-bold">
            2
          </span>
          Your Account &amp; What You Log
        </h2>
        <p>
          You are solely responsible for keeping your login credentials confidential and for
          all activities that occur under your account.
        </p>
        <p>
          You have full control over what financial figures, notes, and descriptions you log.
          MoneyTracker does <em>not</em> connect to banking APIs or require banking
          passwords. For your security, you should never enter highly sensitive credentials
          (such as payment card PINs, CVVs, or online banking passwords) into notes or
          transaction descriptions.
        </p>
      </section>

      {/* Section 3: Friend-Sharing & Anti-Spam / Anti-Harassment Rules */}
      <section className="space-y-2">
        <h2 className="text-base sm:text-lg font-semibold text-ink flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surface-2 text-ink-2 text-xs flex items-center justify-center font-bold">
            3
          </span>
          Friend-Sharing &amp; Anti-Spam Rules
        </h2>
        <div className="p-3.5 rounded-btn bg-danger-tint/50 border border-danger/20 flex items-start gap-2.5 my-2">
          <AlertTriangleIcon size={18} className="text-danger shrink-0 mt-0.5" />
          <p className="text-xs text-ink leading-relaxed">
            <strong>Zero tolerance for spam or harassment:</strong> The friend-sharing,
            collaborative expense tracking, and invitation features are intended solely for
            mutual household budgeting and shared expenses among consenting users.
          </p>
        </div>
        <p>You agree not to use MoneyTracker or any of its communication features to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Harass, intimidate, stalk, threaten, or defame any individual.</li>
          <li>Send unsolicited invitations, promotional messages, or spam.</li>
          <li>Impersonate another person, entity, or email address.</li>
          <li>Engage in abusive, fraudulent, or automated bot activities.</li>
        </ul>
        <p className="font-medium text-ink">
          Misuse of sharing features or violation of these rules can and will result in
          immediate, permanent account removal and blacklisting without prior notice.
        </p>
      </section>

      {/* Section 4: Account Deletion on Request */}
      <section className="space-y-2">
        <h2 className="text-base sm:text-lg font-semibold text-ink flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surface-2 text-ink-2 text-xs flex items-center justify-center font-bold">
            4
          </span>
          Account Deletion on Request
        </h2>
        <p>
          We respect your autonomy. You have the right to close your account and permanently
          delete all data associated with it at any time.
        </p>
        <p>
          You can delete your account instantly at any time from within the app: open your{' '}
          <strong>Profile Settings</strong>, click <strong>Delete Account</strong>, and
          confirm. This permanently erases your account, profile, transactions, custom
          categories, and autopay plans from our database. You may also request account
          deletion by contacting the administrator, and we will fulfill your request promptly.
        </p>
      </section>

      {/* Section 5: Changes to Terms */}
      <section className="space-y-2">
        <h2 className="text-base sm:text-lg font-semibold text-ink flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-surface-2 text-ink-2 text-xs flex items-center justify-center font-bold">
            5
          </span>
          Updates to These Terms
        </h2>
        <p>
          As MoneyTracker evolves, we may update these terms to reflect new features or
          legal requirements. When updates occur, the &ldquo;Last updated&rdquo; date at the
          top of this page will be revised. Continued use of the application constitutes
          acceptance of the updated terms.
        </p>
      </section>
    </LegalLayout>
  );
}

export default TermsPage;
