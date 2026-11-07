# Changelog

All notable changes to MoneyTracker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2026-11-08

### Added
- **PWA Web App Manifest & Offline Service Worker (`PERF-9`, `PERF-14`)**: Standalone app manifest with standard and maskable icons (192x192, 512x512) and service worker precaching the application shell for instant offline access.
- **Dedicated Accessibility Gate in CI (`QA-10`)**: Automated `axe-core` accessibility test suite executed in GitHub Actions CI with zero tolerated violations.
- **Strict Code Coverage Threshold Gates (`QA-11`)**: Enforced 80% lines, 80% functions, and 70% branch coverage on `@moneytracker/shared` and `@moneytracker/api`.
- **Property-Based Randomized Testing (`QA-12`)**: Fast-check fuzz test suite executing 50,000 randomized property assertions across integer paise currency conversions, arithmetic associativity, and month-day clamping.
- **API Load & Concurrency Benchmark (`QA-13`)**: Automated load test simulating 50 concurrent users, achieving 1,469+ req/sec throughput with a p95 latency of 63.8 ms (< 300 ms SLA) documented in `docs/LOAD_TEST_REPORT.md`.
- **Dead Code & Dependency Hygiene (`QA-14`)**: Clean `knip` audit with zero dead files and zero unused dependencies.
- **Production Bundle Analysis Treemap (`QA-16`)**: Visual interactive HTML treemap (`docs/bundle-stats.html`) and architectural dependency justification in `docs/BUNDLE_ANALYSIS.md`.
- **Application Request Metrics Logging (`OPS-13`)**: Express metrics middleware recording request duration histograms and status code counters with `pino` redaction and health check exposure (`/readyz`).
- **Production Containerization & Compose Manifests (`OPS-14`)**: Multi-stage minimal Node 22-alpine `Dockerfile.api`, static Nginx `Dockerfile.web`, and full production `docker-compose.prod.yml` orchestration stack.
- **Dependabot Monorepo Configuration (`OPS-15`)**: Automated weekly dependency scanning across npm workspaces, GitHub Actions, and Docker base images.

---

## [3.0.0] - 2026-11-04

### Added
- **Monorepo Architecture**: Migrated monolithic repository into an npm workspaces monorepo containing `apps/web` (React 19 + Vite), `apps/api` (Express 5 + Prisma), and `packages/shared` (Zod schemas and core calculations).
- **PostgreSQL & Prisma Backend**: Replaced direct client Firebase Firestore with private, ACID-compliant PostgreSQL database managed via Prisma ORM.
- **Integer Paise Financial Engine (`CORE-2`)**: All currency represented internally as 64-bit integer paise (1 Rupee = 100 Paise) eliminating IEEE-754 floating-point drift across sums and budgets.
- **Offline Write Queue & Two-Way Sync (`PERF-6`)**: IndexedDB persistent client queue allowing fully functional offline operation with exponential backoff synchronization upon reconnection.
- **Differentiating Capabilities**:
  - **Safe to Spend Today (`DIFF-1`)**: Dynamic daily spending allowance deducting upcoming monthly autopay liabilities.
  - **Bank Statement CSV Import (`DIFF-2`)**: Client-side mapping engine supporting HDFC, ICICI, SBI, and custom templates with duplicate detection and merchant rule learning.
  - **Recurring Charge Detection (`DIFF-3`)**: Pattern detector surfacing repeating charges with one-click Autopay conversion.
  - **Explainable Insights (`DIFF-4`)**: Month-end burn pacing projections with interactive transparent formula breakdown modals.
  - **Trash Bin & Batch Undo (`DIFF-5`)**: 30-day soft-delete trash recovery and activity history for reversing bulk CSV imports.
  - **Passphrase-Encrypted Web Crypto Backups (`DIFF-6`)**: AES-256-GCM browser encryption with PBKDF2 key derivation (100,000 iterations).

### Security
- Added CSV formula injection neutralization (prepends single quote to `=`, `+`, `-`, `@`).
- Implemented authenticated user-level token bucket rate limiting.
- Hardened Content-Security-Policy, Permissions-Policy, and X-Content-Type-Options headers.
- Integrated Cloudflare Turnstile bot protection on registration.

---

## [2.0.0] - 2026-09-15

### Added
- Autopay and recurring bill tracking with monthly timeline previews.
- Z-score statistical anomaly detection for uncharacteristic transaction amounts.
- Simple Moving Average (SMA) 7-day spending trends and monthly forecast models.
- Capital runway calculator based on average burn velocity.
- Dark mode theme tokens and responsive navigation layout.

---

## [1.0.0] - 2026-05-10

### Initial Release
- Single-page vanilla JavaScript transaction logger with Firebase Firestore backend.
- Monthly expense breakdown by category with basic budget limit tracker.
- CSV export and import.
