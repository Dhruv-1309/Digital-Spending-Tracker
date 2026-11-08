import { LegalLayout } from './LegalLayout';
import { ShieldIcon, LockIcon, LaptopIcon, CheckIcon } from '../icons';

export interface AboutPageProps {
  onBack?: () => void;
}

export function AboutPage({ onBack }: AboutPageProps) {
  return (
    <LegalLayout
      title="About MoneyTracker"
      subtitle="The privacy-first, owned personal finance engine built for clarity, control, and computational integrity."
      lastUpdated="November 8, 2026"
      onBack={onBack}
    >
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2">
          <ShieldIcon size={18} className="text-accent" />
          1. Mission & Philosophy
        </h2>
        <p>
          MoneyTracker was engineered as an antidote to proprietary personal finance apps that compromise user privacy
          through bank account scrapers, invasive SMS screen-reading permissions, and targeted financial marketing.
        </p>
        <p>
          We believe personal financial data should remain strictly confidential, verifiable, and within your direct control.
          MoneyTracker operates on three non-negotiable principles:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-ink-2">
          <li><strong>Zero Credential Access:</strong> We never request your net banking credentials, OTPs, or debit card pins.</li>
          <li><strong>Integer-Paise Precision:</strong> All currency math is computed in whole integer paise (1/100th rupee) to eliminate floating-point drift and rounding errors.</li>
          <li><strong>Offline-First & Local Sovereignty:</strong> You can record expenses, evaluate budgets, and export encrypted archives offline. Data synchronizes silently when network connectivity resumes.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2">
          <LockIcon size={18} className="text-accent" />
          2. Privacy & Zero-Knowledge Architecture
        </h2>
        <p>
          Traditional trackers store your plaintext statements on central corporate servers where employees or third-party advertisers can inspect them.
          MoneyTracker leverages standard client-side Web Crypto algorithms:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-card border border-line bg-surface-2/50 space-y-1">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <CheckIcon size={14} className="text-positive" /> AES-GCM 256-Bit Encryption
            </span>
            <p className="text-xs text-ink-3">
              Client backups are encrypted locally with PBKDF2 (100,000 iterations) and 256-bit AES-GCM before ever leaving your device.
            </p>
          </div>
          <div className="p-3.5 rounded-card border border-line bg-surface-2/50 space-y-1">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <CheckIcon size={14} className="text-positive" /> Zero Tracking Telemetry
            </span>
            <p className="text-xs text-ink-3">
              Zero Google Analytics, Facebook Pixels, marketing cookies, or user fingerprinting scripts are loaded in our production bundles.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink flex items-center gap-2">
          <LaptopIcon size={18} className="text-accent" />
          3. Open Technology Stack
        </h2>
        <p>
          MoneyTracker is built on modern, open, and audit-friendly web technologies:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-line rounded-card">
            <thead className="bg-surface-2 text-ink font-semibold border-b border-line">
              <tr>
                <th className="p-2.5">Layer</th>
                <th className="p-2.5">Technology</th>
                <th className="p-2.5">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink-2">
              <tr>
                <td className="p-2.5 font-medium text-ink">Frontend SPA</td>
                <td className="p-2.5">React 19, Vite, Tailwind CSS</td>
                <td className="p-2.5">Instant UI interactions, accessible design tokens</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-ink">Client Storage</td>
                <td className="p-2.5">IndexedDB & Web Storage</td>
                <td className="p-2.5">Offline transaction queue and local cached state</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-ink">Backend API</td>
                <td className="p-2.5">Node.js 22, Express 5, Prisma ORM</td>
                <td className="p-2.5">Authenticated multi-tenant synchronization and backup</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-ink">Database</td>
                <td className="p-2.5">PostgreSQL 16</td>
                <td className="p-2.5">ACID compliance, bigint paise columns, row-level isolation</td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium text-ink">Cryptography</td>
                <td className="p-2.5">Web Crypto API (FIPS 180-4 SHA-256 & AES-GCM)</td>
                <td className="p-2.5">Client-side zero-knowledge passphrase encryption</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">4. Licensing & Source Code</h2>
        <p>
          MoneyTracker is free and open-source software distributed under the permissive <strong>MIT License</strong>.
          Users are free to run personal instances, audit all client/server algorithms, or export their data at any time without vendor lock-in.
        </p>
      </section>
    </LegalLayout>
  );
}
