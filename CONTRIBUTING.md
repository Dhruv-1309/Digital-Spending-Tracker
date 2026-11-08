# Contributing to MoneyTracker

Thank you for your interest in contributing to MoneyTracker! MoneyTracker is an offline-first, privacy-first personal finance application with integer-paise computational accuracy.

We welcome bug reports, feature suggestions, documentation enhancements, and pull requests from the community.

---

## 1. Code of Conduct

All contributors and maintainers are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all participants with respect, empathy, and professional courtesy.

---

## 2. Core Architectural Guarantees

Before writing code or opening pull requests, familiarize yourself with our three core architectural principles:

1. **Integer-Paise Precision:** All financial calculations, storage columns, and API schemas use integer paise (`1 INR = 100 paise`). Never perform direct currency math using JavaScript floating-point numbers without passing through `@moneytracker/shared`.
2. **Zero Invasiveness & Privacy First:** Zero third-party analytics pixels, tracking cookies, or credential aggregators are allowed. Passphrase backups must remain client-side encrypted via Web Crypto (PBKDF2 + AES-GCM).
3. **Offline & Sync Resilience:** Any mutating client operations must be queued in local IndexedDB before background sync to ensure full functionality without network access.

---

## 3. Getting Started

### Prerequisites

- **Node.js:** `>= 22.0.0`
- **npm:** `>= 10.0.0`
- **PostgreSQL:** `>= 16.0` (or Docker for local containerized Postgres)

### Local Setup

```bash
# Clone repository
git clone https://github.com/moneytracker/moneytracker.git
cd moneytracker

# Install all workspace dependencies
npm ci

# Set up local environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env

# Generate Prisma client artifacts
npm run prisma:generate

# Apply local database migrations
npm --workspace=@moneytracker/api run prisma:migrate
```

### Running Locally

```bash
# Start backend API (port 4000) and frontend SPA (port 5173) concurrently
npm run dev
```

---

## 4. Quality Gates & Verification

Every pull request must pass all automated verification checks before merging:

```bash
# 1. Lint all workspaces (zero errors tolerated)
npm run lint

# 2. Typecheck all project references strictly
npx tsc -b apps/web apps/api packages/shared

# 3. Execute unit, component, property, and integration test suites
npm test

# 4. Verify production bundle build
npm run build
```

---

## 5. Branching & Commit Conventions

- **Branch naming:**
  - Features: `feature/<description>` (e.g. `feature/savings-goals`)
  - Bug fixes: `fix/<issue-name>` (e.g. `fix/currency-rounding`)
  - Documentation/Ops: `docs/<topic>` or `ops/<topic>`
- **Commit messages:** Follow Conventional Commits format:
  ```
  feat(web): add category budget breakdown chart
  fix(shared): prevent negative due day clamping on leap year
  docs(adr): record decision on client-side Web Crypto
  ```

---

## 6. Submitting a Pull Request

1. Fork the repository and create your branch from `main`.
2. Ensure new features include corresponding Vitest tests in the relevant workspace.
3. Verify that `npm run lint`, `npx tsc -b`, `npm test`, and `npm run build` exit with code 0.
4. Open a pull request using the provided [Pull Request Template](.github/pull_request_template.md).
