# MoneyTracker Production Readiness: Prioritised Backlog

**Document Version:** 1.0  
**Generated:** November 6, 2026  
**Auditor:** Antigravity Senior Full-Stack Engineer  
**Source Document:** `docs/readiness/AUDIT.md`  
**Target Branch:** `readiness/hardening`  

---

## 1. Executive Summary & Backlog Overview

This backlog gathers all **124 items** identified during Stage 1 (Audit) that are not currently `DONE` or `NOT-APPLICABLE`. Every entry includes exact dependencies, estimated effort, files likely touched, concrete acceptance criteria, and specific testing procedures.

### 1.1 Priority Distribution
| Priority | Tier Name | Focus | Count |
| :--- | :--- | :--- | :--- |
| **P0** | **Launch Blockers** | Security vulnerabilities, data loss or math errors, broken auth/deletion flows, missing legal policies, production deploy | **21** |
| **P1** | **Professional Product** | Reliability, automated CI, core UX, essential docs, accessibility foundations | **38** |
| **P2** | **Quality & Polish** | Performance tuning, SEO, onboarding, extra docs, differentiating features (DIFF-1 to DIFF-6) | **44** |
| **P3** | **Minor & Optional** | Advanced optional extensions (DIFF-7 to DIFF-9, dark theme, 2FA, print stylesheet) | **21** |
| **Total** | | | **124** |

### 1.2 Action Summary for Stage 3 (Build)
- **Immediate Work (Engineering):** Stage 3 will execute P0 and P1 items systematically in dependency order.
- **User Actions Required (`NEEDS-USER`):** 16 items require owner action (cloud hosting, database provisioning, API key restrictions, physical device checks).
- **Quality Gates:** Before every commit, `tsc -b`, `eslint .`, the full test suite, and the production build must pass with zero failures.

---

## 2. P0: Launch Blockers (21 items)

Launch blockers must be 100% resolved before MoneyTracker can be publicly launched. These eliminate security risks, prevent financial rounding drift, fix auth flaws, and establish deployment.

### 1. [QA-1] TypeScript strict compilation with zero errors across all workspaces [DONE]

- **Priority:** `P0` | **Effort:** `S` | **Category:** `QA`
- **Dependencies:** None
- **Files Likely Touched:**
  - `packages/shared/test/mathEvaluator.test.ts`
  - `packages/shared/tsconfig.json`
  - `apps/web/src/types/index.ts`
- **Acceptance Criteria:**
  - [x] npx tsc -b packages/shared passes with 0 errors (fix .js import extension in mathEvaluator.test.ts)
  - [x] npx tsc -b apps/api passes with 0 errors
  - [x] npx tsc -b apps/web passes with 0 errors
  - [x] Root tsconfig.json coordinates monorepo build mode (tsc -b passes with 0 errors across all workspaces)
- **How It Will Be Tested:** Run `npx tsc -b apps/web apps/api packages/shared` and assert exit code 0.

### 2. [CORE-2] Integer paise summation and zero floating-point drift in frontend totals [DONE]

- **Priority:** `P0` | **Effort:** `S` | **Category:** `CORE`
- **Dependencies:** `QA-1`
- **Files Likely Touched:**
  - `packages/shared/src/calculations/transactions.ts`
  - `packages/shared/src/calculations/analytics.ts`
  - `packages/shared/src/currency/paise.ts`
- **Acceptance Criteria:**
  - [x] Transaction sums convert amounts to integer paise (rupeesToPaise) before summation
  - [x] Division back to rupees (paiseToRupees) occurs only at presentation boundary
  - [x] Summing 0.10 + 0.20 returns exactly 0.30 with zero binary floating-point drift (e.g. 0.30000000000000004 prevented)
  - [x] All calculation tests assert exact rupee and paise outputs
- **How It Will Be Tested:** Run `npm --workspace=@moneytracker/shared test` with tests asserting precise decimal addition.

### 3. [CORE-3] Amount validation caps, decimal precision, and exponent notation rejection [DONE]

- **Priority:** `P0` | **Effort:** `S` | **Category:** `CORE`
- **Dependencies:** `CORE-2`
- **Files Likely Touched:**
  - `packages/shared/src/schemas/transactions.ts`
  - `packages/shared/src/calculations/validation.ts`
  - `apps/web/src/components/ui/AmountInput.tsx`
- **Acceptance Criteria:**
  - [x] Validation schema rejects NaN, negative values, and exponent string formats (e.g. "1e5")
  - [x] Enforces maximum amount cap of ₹10,00,00,000 (10 Crore / 1,000,000,000 paise)
  - [x] Enforces at most 2 decimal places for fractional rupee amounts
  - [x] AmountInput UI displays inline error and prevents submission when amount exceeds limits
- **How It Will Be Tested:** Unit tests in validation.test.ts and schemas.test.ts verifying rejection of 1e6, -50, 10000000001, and 12.345.

### 4. [SEC-6] CSV export formula injection (CSV injection / DDE) neutralization [DONE]

- **Priority:** `P0` | **Effort:** `S` | **Category:** `SEC`
- **Dependencies:** None
- **Files Likely Touched:**
  - `packages/shared/src/calculations/transactions.ts`
- **Acceptance Criteria:**
  - [x] Cells starting with formula trigger characters (=, +, -, @, \t, \r) are sanitized with a leading single quote (')
  - [x] Prevents spreadsheet formula execution when exported CSV is opened in Excel, Google Sheets, or LibreOffice
  - [x] Normal text values remain uncorrupted
- **How It Will Be Tested:** Unit test verifying that descriptions like "=cmd|...", "+2+5", "-10", "@SUM" are exported as "'=cmd|...", etc.

### 5. [AUTH-1] Decouple Sign In and Sign Up to prevent silent account creation on typos [DONE]

- **Priority:** `P0` | **Effort:** `S` | **Category:** `AUTH`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/services/auth.ts`
  - `apps/web/src/components/auth/AuthModal.tsx`
  - `apps/web/src/test/authService.test.ts`
- **Acceptance Criteria:**
  - [x] signInWithEmail strictly signs in; if user does not exist or credentials fail, throws "Incorrect email or password"
  - [x] signInWithEmail NEVER calls createUserWithEmailAndPassword on invalid-credential or user-not-found
  - [x] Account creation only occurs when user explicitly submits in "signup" mode
  - [x] User cannot accidentally create an orphaned account by mistyping their password
- **How It Will Be Tested:** Unit test in auth_profile_redesign.test.tsx ensuring signInWithEmail with non-existent user throws error without creating account.

### 6. [AUTH-2] Comprehensive account deletion: wipe DB, clear local IndexedDB syncQueue, inform user [DONE]

- **Priority:** `P0` | **Effort:** `S` | **Category:** `AUTH`
- **Dependencies:** `AUTH-1`
- **Files Likely Touched:**
  - `apps/web/src/services/auth.ts`
  - `apps/web/src/services/syncQueue.ts`
  - `apps/web/src/components/profile/ProfileModal.tsx`
- **Acceptance Criteria:**
  - [ ] Calling deleteUserAccount calls backend API to delete user rows, drops Firebase user, and calls syncQueue.clearQueue()
  - [ ] All cached IndexedDB data and localStorage tokens are cleared
  - [ ] Confirmation modal states specifically what was purged (transactions, plans, budget, local cache)
- **How It Will Be Tested:** Component test in auth_profile_redesign.test.tsx asserting clearQueue() and storage cleanup on account deletion.

### 7. [AUTH-3] Sign out data purge: zero residue in memory, localStorage, or IndexedDB offline queue [DONE]

- **Priority:** `P0` | **Effort:** `S` | **Category:** `AUTH`
- **Dependencies:** `AUTH-2`
- **Files Likely Touched:**
  - `apps/web/src/services/auth.ts`
  - `apps/web/src/context/TrackerContext.tsx`
  - `apps/web/src/services/syncQueue.ts`
- **Acceptance Criteria:**
  - [ ] Signing out completely clears React context state, cached transactions, autopay plans, and syncQueue storage
  - [ ] A subsequent sign-in by a different user on the same browser device never sees previous user data
- **How It Will Be Tested:** Unit test asserting that after signOutUser(), syncQueue.getCachedData returns null and queue count is 0.

### 8. [CORE-1] End-to-end functional requirements FR-1.1 to FR-6.3 verification & edge-case closure [DONE]

- **Priority:** `P0` | **Effort:** `M` | **Category:** `CORE`
- **Dependencies:** `AUTH-1`, `CORE-2`, `CORE-3`
- **Files Likely Touched:**
  - `apps/web/src/context/TrackerContext.tsx`
  - `apps/web/src/services/apiClient.ts`
- **Acceptance Criteria:**
  - [ ] All modules FR-1 through FR-6 work end-to-end with verified parity against PRD specifications
  - [ ] Fix any lingering silent-create or unhandled network errors across the context pipeline
- **How It Will Be Tested:** Run full suite of 261 component and integration tests in apps/web.

### 9. [CORE-4] Timezone-consistent date conversions and midnight boundary verification [DONE]

- **Priority:** `P0` | **Effort:** `S` | **Category:** `CORE`
- **Dependencies:** `CORE-1`
- **Files Likely Touched:**
  - `packages/shared/src/calculations/transactions.ts`
  - `apps/api/src/repositories/transactionRepository.ts`
- **Acceptance Criteria:**
  - [ ] Calendar dates (YYYY-MM-DD) do not shift +/- 1 day when viewed across international timezones or at midnight UTC
  - [ ] Unit tests assert consistent parsing and display across UTC-11, UTC+0, and UTC+14
- **How It Will Be Tested:** Vitest unit tests asserting date preservation across simulated timezone offsets.

### 10. [CORE-5] Month boundaries and leap year handling for 28, 29, 30, 31 day months and Last Day autopay [DONE]

- **Priority:** `P0` | **Effort:** `S` | **Category:** `CORE`
- **Dependencies:** `CORE-1`
- **Files Likely Touched:**
  - `packages/shared/src/calculations/autopay.ts`
  - `packages/shared/test/autopay.test.ts`
- **Acceptance Criteria:**
  - [ ] getClampedDueDay correctly returns 29 for February in leap years (e.g. 2024, 2028)
  - [ ] getClampedDueDay returns 28 for February in non-leap years (e.g. 2025, 2026)
  - [ ] getClampedDueDay returns 30 for 30-day months (April, June, Sept, Nov) when day=31
  - [ ] Comprehensive unit tests assert all 12 month boundaries and leap year cases
- **How It Will Be Tested:** Add parameterized unit test cases to autopay.test.ts testing days 28, 29, 30, 31 across leap and non-leap years.

### 11. [CORE-7] Eliminate Infinity / NaN from money runway and forecast on zero spend and negative balance [DONE]

- **Priority:** `P0` | **Effort:** `S` | **Category:** `CORE`
- **Dependencies:** `CORE-2`
- **Files Likely Touched:**
  - `packages/shared/src/calculations/analytics.ts`
  - `apps/web/src/components/analytics/AnalyticsTab.tsx`
- **Acceptance Criteria:**
  - [ ] calculateMoneyRunway returns daysRemaining: null (or bounded sentinel) instead of Infinity when daily spend is 0
  - [ ] Accessible runway table (AnalyticsTab.tsx:1113) renders "N/A (Sustainable)" or "0" instead of raw "Infinity"
  - [ ] Zero spending, negative balance, and single-day history never render "NaN" or "Infinity" anywhere on screen
- **How It Will Be Tested:** Unit test in analytics.test.ts and component test in analytics_redesign.test.tsx with zero transactions and negative balance.

### 12. [BE-7] Authenticated user-level token bucket rate limiting in API middleware [DONE]

- **Priority:** `P0` | **Effort:** `S` | **Category:** `BE`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/api/src/middleware/rateLimiter.ts`
- **Acceptance Criteria:**
  - [ ] rateLimiter keys on authenticated user ID (req.user.uid) when present, falling back to IP
  - [ ] Prevents a malicious authenticated client from flooding API routes while staying within shared IP limits
- **How It Will Be Tested:** Supertest integration test in apps/api/test/auth.test.ts simulating rate limit exceeded for a specific user ID.

### 13. [SEC-4] Security headers configuration (CSP, X-Content-Type-Options, Permissions-Policy, frame-ancestors) [DONE]

- **Priority:** `P0` | **Effort:** `S` | **Category:** `SEC`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/vercel.json`
  - `apps/web/public/_headers`
  - `apps/api/src/app.ts`
- **Acceptance Criteria:**
  - [ ] Static frontend hosting configuration defines Content-Security-Policy with strict script/style directives
  - [ ] Includes X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, frame-ancestors 'none'
  - [ ] Permissions-Policy disables camera, microphone, geolocation
- **How It Will Be Tested:** Inspect vercel.json and run response header assertions on API and build artifacts.

### 14. [QA-2] Unit test coverage for pure calculation edge cases (CORE boundaries) [DONE]

- **Priority:** `P0` | **Effort:** `M` | **Category:** `QA`
- **Dependencies:** `CORE-2`, `CORE-3`, `CORE-5`, `CORE-7`
- **Files Likely Touched:**
  - `packages/shared/test/*.test.ts`
- **Acceptance Criteria:**
  - [x] 100% test coverage on pure calculation logic including zero balances, negative balances, and edge cases
  - [x] All new test cases assert exact numerical and string properties
- **How It Will Be Tested:** Run `npm test` and assert all unit test suites pass.

### 15. [OPS-3] Hardened GitHub Actions CI workflow (lint, typecheck, test, build, audit) [DONE]

- **Priority:** `P0` | **Effort:** `S` | **Category:** `OPS`
- **Dependencies:** `QA-1`
- **Files Likely Touched:**
  - `.github/workflows/ci.yml`
- **Acceptance Criteria:**
  - [x] CI runs on all PRs and pushes to main, readiness/*, and feature branches
  - [x] Executes: npm ci, prisma:generate, npm run lint, npx tsc -b, npm test, npm run build
  - [x] Fails PR if linting, typechecking, tests, or build fails
- **How It Will Be Tested:** Validate workflow YAML syntax and verify local test commands replicate CI pipeline.

### 16. [WEB-1] Modern comprehensive README rewrite reflecting monorepo and v3.0 full-stack architecture [DONE]

- **Priority:** `P0` | **Effort:** `M` | **Category:** `WEB`
- **Dependencies:** None
- **Files Likely Touched:**
  - `README.md`
- **Acceptance Criteria:**
  - [x] Replaces legacy v1.0 HTML5/vanilla JS descriptions with current React 19, TypeScript strict, Postgres, and Express 5 architecture
  - [x] Includes architecture diagram, setup instructions, scripts reference, environment variables, and testing guide
  - [x] No placeholder or outdated marketing text
- **How It Will Be Tested:** Manual review of README.md for complete accuracy and link integrity.

### 17. [SEC-1] Rotate and restrict historical Firebase API key in Google Cloud Console `[NEEDS-USER]`

- **Priority:** `P0` | **Effort:** `S` | **Category:** `SEC`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/.env.example`
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] Owner restricts Firebase Web API key in GCP Console (HTTP referrers, Identity Toolkit only)
  - [ ] Historical commit exposure mitigated via Google Cloud API restrictions
  - [ ] Preparation instructions documented for owner
- **How It Will Be Tested:** Owner checks GCP Credentials dashboard and verifies restricted scope.

### 18. [SEC-3] Enforce HTTPS everywhere with HSTS preload headers on public domain `[NEEDS-USER]`

- **Priority:** `P0` | **Effort:** `S` | **Category:** `SEC`
- **Dependencies:** `SEC-4`
- **Files Likely Touched:**
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] Public domain serves traffic exclusively over HTTPS
  - [ ] HSTS header max-age >= 31536000 with includeSubDomains enabled
- **How It Will Be Tested:** SecurityHeaders.com external scan upon live deployment.

### 19. [OPS-1] Public HTTPS production deployment (Vercel web + Render API + Neon Postgres) `[NEEDS-USER]`

- **Priority:** `P0` | **Effort:** `M` | **Category:** `OPS`
- **Dependencies:** `OPS-3`, `SEC-3`
- **Files Likely Touched:**
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] App is publicly accessible via live HTTPS URL
  - [ ] Owner deploys frontend to Vercel/similar and backend to Render/similar
- **How It Will Be Tested:** Curl health endpoint and load web app in browser.

### 20. [OPS-2] Provision separate staging and production databases and credentials `[NEEDS-USER]`

- **Priority:** `P0` | **Effort:** `M` | **Category:** `OPS`
- **Dependencies:** `OPS-1`
- **Files Likely Touched:**
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] Separate database connection URLs for staging and production
  - [ ] Staging migrations can be validated before applying to production
- **How It Will Be Tested:** Verify database separation in host dashboards.

### 21. [OPS-4] Configure automated database backups, retention schedule, and restore rehearsal `[NEEDS-USER]`

- **Priority:** `P0` | **Effort:** `M` | **Category:** `OPS`
- **Dependencies:** `OPS-2`
- **Files Likely Touched:**
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] Automated daily backups enabled in managed database dashboard
  - [ ] Owner executes and rehearses a test restore into a temporary database
- **How It Will Be Tested:** Documented restore test output in owner launch checklist.

---

## 3. P1: Professional Product Standards (38 items)

Expected of a production-grade personal financial application. These ensure robust offline recovery, thorough testing, graceful error boundaries, and essential documentation.

### 1. [X-1] Build & Lint Hygiene: resolve React Compiler setState in effect error and clean warnings [DONE]

- **Priority:** `P1` | **Effort:** `S` | **Category:** `X`
- **Dependencies:** `QA-1`
- **Files Likely Touched:**
  - `apps/web/src/components/analytics/AnalyticsTab.tsx`
  - `apps/web/vite.config.ts`
- **Acceptance Criteria:**
  - [x] Fix AnalyticsTab.tsx:118:5 setState-in-effect error by computing initial month/year without cascading render
  - [x] npm run lint passes with 0 errors across apps/web
  - [x] Configure manualChunks or dynamic imports in vite.config.ts to resolve >500kB chunk size warning
- **How It Will Be Tested:** Run `npm run lint` and `npm --workspace=apps/web run build` with zero errors or warnings.

### 2. [QA-4] ESLint and Prettier configuration with pre-commit check script [DONE]

- **Priority:** `P1` | **Effort:** `S` | **Category:** `QA`
- **Dependencies:** `X-1`
- **Files Likely Touched:**
  - `package.json`
  - `apps/api/package.json`
  - `packages/shared/package.json`
- **Acceptance Criteria:**
  - [x] npm run lint executes across all workspaces with 0 errors
  - [x] Configure linting scripts in apps/api and packages/shared
- **How It Will Be Tested:** Run `npm run lint` in monorepo root.

### 3. [UX-3] React ErrorBoundary with friendly fallback and reload action [DONE]

- **Priority:** `P1` | **Effort:** `S` | **Category:** `UX`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/components/common/ErrorBoundary.tsx`
  - `apps/web/src/App.tsx`
- **Acceptance Criteria:**
  - [x] ErrorBoundary catches unhandled component rendering exceptions without crashing whole application
  - [x] Displays empathetic, editorial fallback card with "Reload Application" button and support email
  - [x] Logs error to console or telemetry
- **How It Will Be Tested:** Component test throwing simulated render error and verifying friendly fallback appearance.

### 4. [UX-4] Dedicated 404 page, unknown-route handling, and standalone offline page [DONE]

- **Priority:** `P1` | **Effort:** `S` | **Category:** `UX`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/components/common/NotFoundPage.tsx`
  - `apps/web/src/lib/routes.ts`
  - `apps/web/public/offline.html`
  - `apps/web/src/App.tsx`
- **Acceptance Criteria:**
  - [x] Navigating to unrecognized URL route renders clear 404 Not Found screen with "Return to Dashboard" action
  - [x] Provides offline fallback view if user opens app disconnected without cached shell
- **How It Will Be Tested:** Component tests in legal_routes.test.tsx and not_found.test.tsx verifying 404 page on unknown paths.

### 5. [CORE-9] Recoverable transaction deletion (Undo toast action and soft-delete state) [DONE]

- **Priority:** `P1` | **Effort:** `M` | **Category:** `CORE`
- **Dependencies:** `CORE-1`
- **Files Likely Touched:**
  - `apps/web/src/context/TrackerContext.tsx`
  - `apps/web/src/components/transactions/TransactionsTab.tsx`
- **Acceptance Criteria:**
  - [x] Deleting a transaction displays a toast notification with an interactive "Undo" action
  - [x] Clicking Undo within 5 seconds restores the transaction in local state and cancels pending server deletion
  - [x] If not undone, transaction proceeds to soft-delete
- **How It Will Be Tested:** Component test simulating delete, clicking Undo in toast, and asserting transaction reappears.

### 6. [CORE-10] Exact boundary evaluations for budget thresholds (just below, at threshold, at limit, over limit) `[DONE]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `CORE`
- **Dependencies:** `CORE-2`
- **Files Likely Touched:**
  - `packages/shared/src/calculations/budget.ts`
  - `packages/shared/test/budget.test.ts`
- **Acceptance Criteria:**
  - [ ] When currentSpent === limit, statusChip is "At limit" with remaining: 0 and alertLevel: "critical"
  - [ ] When currentSpent is just below threshold, statusChip is "On track"
  - [ ] When currentSpent is exactly at threshold (e.g. 80.0%), statusChip is "Near limit"
  - [ ] When currentSpent > limit, statusChip is "Over budget"
  - [ ] Unit tests assert each exact boundary point
- **How It Will Be Tested:** Unit tests in budget.test.ts asserting behavior at 79.99%, 80.00%, 99.99%, 100.00%, and 100.01% of limit.

### 7. [CORE-12] Robust CSV parser: UTF-8 BOM stripping, large file protection, and malformed row recovery `[DONE]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `CORE`
- **Dependencies:** `CORE-3`
- **Files Likely Touched:**
  - `packages/shared/src/calculations/transactions.ts`
  - `packages/shared/test/transactions.test.ts`
- **Acceptance Criteria:**
  - [ ] Strips UTF-8 Byte Order Mark (\uFEFF) from CSV headers so "Date" column matches reliably
  - [ ] Provides clear error messages on missing required columns without crashing
  - [ ] Recovers gracefully from quoted multiline fields and uneven column counts
- **How It Will Be Tested:** Unit test parsing CSV string containing UTF-8 BOM (\uFEFFDate,Type,Amount...).

### 8. [CORE-13] Bidirectional JSON backup import and round-trip data fidelity `[DONE]`

- **Priority:** `P1` | **Effort:** `M` | **Category:** `CORE`
- **Dependencies:** `CORE-12`
- **Files Likely Touched:**
  - `packages/shared/src/calculations/transactions.ts`
  - `apps/web/src/components/transactions/TransactionsTab.tsx`
- **Acceptance Criteria:**
  - [ ] TransactionsTab More Menu includes "Import JSON Backup"
  - [ ] Validates backup JSON schema and restores transactions, categories, and autopay plans
  - [ ] Exporting then importing gives identical transaction counts, dates, and amounts
- **How It Will Be Tested:** Unit test exporting sample dataset to JSON and restoring it, verifying 100% record equality.

### 9. [CORE-14] 10,000 transaction performance benchmark and responsiveness test `[DONE]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `CORE`
- **Dependencies:** `CORE-2`
- **Files Likely Touched:**
  - `packages/shared/test/performance.test.ts`
- **Acceptance Criteria:**
  - [ ] Automated benchmark test processes 10,000 transactions through filtering, pagination, and analytics
  - [ ] Total execution time for calculation pipeline is < 25ms
  - [ ] Proves app UI remains responsive with 10k items
- **How It Will Be Tested:** Vitest performance benchmark test generating 10,000 mock transactions and asserting execution time.

### 10. [AUTH-4] Post-signup email verification flow with resend option `[DONE]`

- **Priority:** `P1` | **Effort:** `M` | **Category:** `AUTH`
- **Dependencies:** `AUTH-1`
- **Files Likely Touched:**
  - `apps/web/src/services/auth.ts`
  - `apps/web/src/components/auth/AuthModal.tsx`
  - `apps/web/src/components/layout/AppShell.tsx`
- **Acceptance Criteria:**
  - [ ] signUpWithEmail triggers sendEmailVerification via Firebase Auth
  - [ ] Unverified users see a polite banner in AppShell offering a "Resend verification email" button
  - [ ] Reloading after clicking verification link removes the reminder banner
- **How It Will Be Tested:** Mock Firebase Auth sendEmailVerification in tests and assert banner appearance.

### 11. [AUTH-5] Password validation rules with common password rejection blacklist `[DONE]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `AUTH`
- **Dependencies:** `AUTH-1`
- **Files Likely Touched:**
  - `packages/shared/src/calculations/validation.ts`
  - `apps/web/src/components/auth/AuthModal.tsx`
- **Acceptance Criteria:**
  - [ ] Checks against top common passwords (e.g. password, 123456, qwerty, moneytracker)
  - [ ] Requires minimum 8 characters with at least one number or special symbol for new registrations
  - [ ] Displays inline feedback if a common password is entered
- **How It Will Be Tested:** Unit test in validation.test.ts verifying rejection of common password strings.

### 12. [AUTH-6] Generic error messages that do not disclose user registration status `[DONE]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `AUTH`
- **Dependencies:** `AUTH-1`
- **Files Likely Touched:**
  - `apps/web/src/services/auth.ts`
- **Acceptance Criteria:**
  - [ ] Password reset error message returns "If an account exists with this email, a reset link has been sent."
  - [ ] Never returns "No account found with this email" to unauthenticated visitors
- **How It Will Be Tested:** Unit test asserting generic response for auth/user-not-found in sendPasswordReset.

### 13. [AUTH-10] Re-authentication prompt for sensitive actions (change password, delete account) `[DONE]`

- **Priority:** `P1` | **Effort:** `M` | **Category:** `AUTH`
- **Dependencies:** `AUTH-2`
- **Files Likely Touched:**
  - `apps/web/src/services/auth.ts`
  - `apps/web/src/components/profile/ProfileModal.tsx`
- **Acceptance Criteria:**
  - [ ] Updating password or deleting account prompts user for current password if session requires recent login
  - [ ] Handles auth/requires-recent-login by presenting inline re-auth modal without unmounting settings
- **How It Will Be Tested:** Component test in auth_profile_redesign.test.tsx testing re-authentication prompt.

### 14. [BE-9] Pagination on autopay plans list API endpoint `[DONE]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `BE`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/api/src/repositories/autopayRepository.ts`
  - `apps/api/src/routes/autopayRoutes.ts`
- **Acceptance Criteria:**
  - [x] GET /api/v1/autopay supports page and pageSize query parameters (default 50, max 100)
  - [x] Returns paginated structure { items, total, page, pageSize, totalPages } matching transaction endpoints
- **How It Will Be Tested:** Supertest in apps/api/test/autopay.test.ts asserting paginated response structure.

### 15. [BE-12] Prisma database connection pool sizing and query timeout configuration `[DONE]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `BE`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/api/src/config/index.ts`
  - `apps/api/src/db/prisma.ts`
- **Acceptance Criteria:**
  - [x] Appends connection_limit and pool_timeout parameters to DATABASE_URL if absent
  - [x] Configures Prisma query execution timeout to prevent hanging connections during network latency
- **How It Will Be Tested:** Unit test verifying Prisma client instantiation options and connection parameters.

### 16. [SEC-10] Dependency vulnerability remediation (npm audit fix) and automated Dependabot updates `[DONE]`

- **Priority:** `P1` | **Effort:** `M` | **Category:** `SEC`
- **Dependencies:** `QA-1`
- **Files Likely Touched:**
  - `package.json`
  - `package-lock.json`
  - `.github/dependabot.yml`
- **Acceptance Criteria:**
  - [x] Remediate high/critical vulnerabilities reported in npm audit without breaking runtime dependencies
  - [x] Add .github/dependabot.yml configured for weekly npm workspace updates
  - [x] npm audit reports 0 high or critical vulnerabilities
- **How It Will Be Tested:** Run `npm audit` and assert 0 high/critical issues.

### 17. [SEC-12] Server and client length limits on all text fields (descriptions, names, categories) `[DONE]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `SEC`
- **Dependencies:** None
- **Files Likely Touched:**
  - `packages/shared/src/schemas/transactions.ts`
  - `packages/shared/src/schemas/autopay.ts`
  - `apps/web/src/components/ui/TextInput.tsx`
- **Acceptance Criteria:**
  - [x] CreateTransactionSchema.description has .max(255)
  - [x] CreateAutopaySchema.name has .max(100) and description has .max(255)
  - [x] TextInput UI component enforces maxLength and displays character count when nearing limit
- **How It Will Be Tested:** Unit tests in schemas.test.ts verifying rejection of overly long strings.

### 18. [SEC-13] CSV import file size limit (5MB) and type validation `[DONE]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `SEC`
- **Dependencies:** `CORE-12`
- **Files Likely Touched:**
  - `apps/web/src/components/transactions/TransactionsTab.tsx`
- **Acceptance Criteria:**
  - [x] Files larger than 5MB are rejected before reading into browser memory with a friendly error toast
  - [x] Only .csv and text/csv MIME types are accepted
- **How It Will Be Tested:** Component test in transactions_redesign.test.tsx attempting to upload file > 5MB and asserting toast error.

### 19. [SEC-14] Formal third-party service requests documentation and SRI pinning policy `[DONE]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `SEC`
- **Dependencies:** None
- **Files Likely Touched:**
  - `docs/security/THIRD_PARTY_SERVICES.md`
- **Acceptance Criteria:**
  - [x] Documents all outbound network requests (Firebase Auth domains, Google Fonts self-hosted)
  - [x] Affirms zero tracking pixels, zero analytics scripts, and zero advertising SDKs
- **How It Will Be Tested:** Review documentation against network observer logs.

### 20. [PERF-2] Bundle code splitting: route-level lazy loading and lazy-loaded Chart.js [DONE]

- **Priority:** `P1` | **Effort:** `M` | **Category:** `PERF`
- **Dependencies:** `X-1`
- **Files Likely Touched:**
  - `apps/web/src/App.tsx`
  - `apps/web/src/components/layout/AppLayout.tsx`
  - `apps/web/vite.config.ts`
- **Acceptance Criteria:**
  - [x] Route tabs (Analytics, Autopay, Transactions) and heavy libraries (Chart.js) are code-split using React.lazy()
  - [x] Initial main bundle size decreases significantly below 200 kB gzipped (index.js is 90.71 kB gzip)
  - [x] Emits no chunks larger than 500 kB after minification
- **How It Will Be Tested:** Run `npm --workspace=@moneytracker/web run build` and inspect chunk sizes.

### 21. [PERF-4] Search input debouncing (300ms) to eliminate redundant filtering cycles [DONE]

- **Priority:** `P1` | **Effort:** `S` | **Category:** `PERF`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/hooks/useDebounce.ts`
  - `apps/web/src/components/transactions/TransactionsTab.tsx`
  - `apps/web/src/test/useDebounce.test.ts`
  - `apps/web/src/test/transactions_redesign.test.tsx`
- **Acceptance Criteria:**
  - [x] Typing in the search input debounces filtering by 300ms
  - [x] Prevents UI stutter on large transaction histories while maintaining snappy typing feel
  - [x] Immediate reset on clear/empty string
- **How It Will Be Tested:** Component test asserting filterTransactions is invoked only once after typing burst.

### 22. [QA-6] End-to-end (E2E) testing suite with Playwright covering critical user journeys [DONE]

- **Priority:** `P1` | **Effort:** `L` | **Category:** `QA`
- **Dependencies:** `CORE-1`, `AUTH-1`
- **Files Touched:**
  - `playwright.config.ts`
  - `package.json`
  - `apps/web/src/context/AuthContext.tsx`
  - `apps/web/src/components/ui/ConfirmDialog.tsx`
  - `e2e/helpers.ts`
  - `e2e/auth.spec.ts`
  - `e2e/navigation.spec.ts`
  - `e2e/transactions.spec.ts`
  - `e2e/autopay.spec.ts`
  - `e2e/portability.spec.ts`
  - `e2e/profile.spec.ts`
- **Acceptance Criteria:**
  - [x] Playwright tests cover: sign up, add transaction, autopay plan, CSV export, upload limit rejection, delete account cancel
  - [x] Runs headlessly and deterministically with Vite dev webServer
- **How It Was Tested:** Ran `npx playwright test`, 19 passing tests across 6 specs.

### 23. [QA-9] Eliminate silent catch blocks and ensure typed error logging [DONE]

- **Priority:** `P1` | **Effort:** `S` | **Category:** `QA`
- **Dependencies:** None
- **Files Touched:**
  - `apps/web/src/lib/logger.ts`
  - `apps/web/src/lib/routes.ts`
  - `apps/web/src/test/logger.test.ts`
  - `apps/web/src/context/TrackerContext.tsx`
  - `apps/web/src/context/AuthContext.tsx`
  - `apps/web/src/App.tsx`
  - `apps/web/src/services/apiClient.ts`
  - `apps/web/src/services/auth.ts`
  - `apps/web/src/services/syncQueue.ts`
  - `apps/web/src/components/auth/AuthModal.tsx`
  - `apps/web/src/components/layout/AppShell.tsx`
  - `apps/web/src/components/legal/LegalLayout.tsx`
  - `apps/web/src/components/profile/ProfileModal.tsx`
  - `apps/web/src/components/transactions/AddTransactionTab.tsx`
  - `apps/web/src/components/transactions/TransactionSlideOver.tsx`
  - `apps/web/src/lib/transactions.ts`
  - `packages/shared/src/calculations/transactions.ts`
  - `apps/api/src/config/index.ts`
  - `apps/api/src/middleware/idempotency.ts`
  - `apps/api/src/services/firebaseAuth.ts`
- **Acceptance Criteria:**
  - [x] Replace all empty `catch { }` blocks across entire repository with typed error inspection and logger warnings
  - [x] Zero unhandled silent errors in application core
- **How It Was Tested:** Ran `git grep -n "catch {" apps/ packages/` (0 matches), unit tests in `apps/web/src/test/logger.test.ts` (5 tests passing), `npm run lint` with 0 errors.

### 24. [X-2] Database & API Resilience: client-side graceful retry and exponential backoff on 503/cold starts [DONE]

- **Priority:** `P1` | **Effort:** `S` | **Category:** `X`
- **Dependencies:** None
- **Files Touched:**
  - `apps/web/src/services/apiClient.ts`
  - `apps/web/src/test/apiClient_retry.test.ts`
- **Acceptance Criteria:**
  - [x] apiClient automatically retries requests on 502/503/504 errors up to 3 times with exponential backoff
  - [x] Safe retry for mutating requests with idempotency keys and transient network disconnection recovery
  - [x] Respects server-provided Retry-After headers and includes exponential jitter
- **How It Was Tested:** Unit tests in `apps/web/src/test/apiClient_retry.test.ts` (9 tests passing), Playwright E2E suite (19 tests passing).

### 25. [OPS-11] Operations Runbook expansion: database restore rehearsal and secret rotation procedures [DONE]

- **Priority:** `P1` | **Effort:** `S` | **Category:** `OPS`
- **Dependencies:** None
- **Files Likely Touched:**
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [x] Adds step-by-step procedure for database backup restore to test target
  - [x] Adds step-by-step guide for rotating Firebase Service Account keys and DATABASE_URL passwords
  - [x] Adds debugging steps for stalled pg-boss jobs
- **How It Will Be Tested:** Review documentation for clarity and completeness.

### 26. [WEB-3] Public landing page with product benefits, privacy stance, and interactive demo entry [DONE]

- **Priority:** `P1` | **Effort:** `M` | **Category:** `WEB`
- **Dependencies:** None
- **Files Touched:**
  - `apps/web/src/components/landing/LandingPage.tsx`
  - `apps/web/src/App.tsx`
  - `apps/web/src/lib/routes.ts`
  - `apps/web/src/components/auth/AuthModal.tsx`
  - `apps/web/src/test/legal_routes.test.tsx`
- **Acceptance Criteria:**
  - [x] Dedicated, editorial marketing landing page explaining privacy-first positioning and architecture
  - [x] Includes feature callouts (integer paise, offline sync, clamped autopay, anomaly alerts, zero lock-in), live preview card, and links to Terms, Privacy, API Docs, and Sign In
  - [x] Accessible via /landing and /about routes with smooth bidirectional navigation to/from app
- **How It Was Tested:** Component and routing test suite in `apps/web/src/test/legal_routes.test.tsx` (10 tests passing).

### 27. [WEB-5] In-app user feedback dialog and designated contact address [DONE]

- **Priority:** `P1` | **Effort:** `S` | **Category:** `WEB`
- **Dependencies:** None
- **Files Touched:**
  - `apps/web/src/components/common/FeedbackModal.tsx`
  - `apps/web/src/components/layout/AppShell.tsx`
  - `apps/web/src/test/feedback_modal.test.tsx`
- **Acceptance Criteria:**
  - [x] Accessible FeedbackModal with category selection, satisfaction sentiment, message, and diagnostic toggle
  - [x] Accessible from left rail footer, mobile drawer footer, and page footer
  - [x] Generates pre-populated mailto: link to support@moneytracker.app and supports 1-click clipboard copy
- **How It Was Tested:** Component test suite in `apps/web/src/test/feedback_modal.test.tsx` (8 tests passing), AppShell test suite (33 tests passing).

### 28. [WEB-7] Commit formal LICENSE file (MIT / Apache 2.0 / Proprietary as owner specifies) [DONE]

- **Priority:** `P1` | **Effort:** `S` | **Category:** `WEB`
- **Dependencies:** None
- **Files Touched:**
  - `LICENSE`
- **Acceptance Criteria:**
  - [x] Standard LICENSE file committed to repository root
  - [x] Documents copyright, permissions, and warranty disclaimers
- **How It Was Tested:** Verified LICENSE file exists in repository root and conforms to MIT license format.

### 29. [WEB-8] Serve interactive API documentation from OpenAPI specification (/api/docs) [DONE]

- **Priority:** `P1` | **Effort:** `S` | **Category:** `WEB`
- **Dependencies:** None
- **Files Touched:**
  - `apps/api/src/routes/docsRoutes.ts`
  - `apps/api/src/app.ts`
  - `apps/api/test/health.test.ts`
- **Acceptance Criteria:**
  - [x] GET /api/docs and /docs serve interactive OpenAPI documentation powered by Scalar UI
  - [x] GET /api/openapi.yaml serves raw OpenAPI 3.1 specification with caching and appropriate headers
  - [x] Relaxed CSP header allows Scalar documentation bundle while retaining strict security on API endpoints
- **How It Was Tested:** Supertest integration assertions in `apps/api/test/health.test.ts` (6 tests passing).

### 30. [AUTH-8] Firebase branded sender email and custom domain template setup `[NEEDS-USER]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `AUTH`
- **Dependencies:** None
- **Files Likely Touched:**
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] Configure email action URL and branded sender name in Firebase Authentication console
  - [ ] Verify password reset email matches application branding
- **How It Will Be Tested:** Send test password reset email to owner inbox.

### 31. [SEC-11] Configure authorized domains and API key restrictions in Firebase Console `[NEEDS-USER]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `SEC`
- **Dependencies:** `OPS-1`
- **Files Likely Touched:**
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] Add production domain to Firebase Authorized Domains list
  - [ ] Restrict API key to Identity Toolkit and Token Service only
- **How It Will Be Tested:** Verify sign-in succeeds on custom production domain.

### 32. [UX-10] Cross-browser validation on physical devices (Chrome, Safari on iOS, Firefox, Edge) `[NEEDS-USER]`

- **Priority:** `P1` | **Effort:** `M` | **Category:** `UX`
- **Dependencies:** `OPS-1`
- **Files Likely Touched:**
  - `docs/readiness/FINAL.md`
- **Acceptance Criteria:**
  - [ ] Owner opens live production site on physical iPhone Safari and Android Chrome
  - [ ] Verifies viewport scaling, bottom navigation, date picker, and touch interactions
- **How It Will Be Tested:** Owner manual checkoff on physical devices.

### 33. [PERF-1] Lighthouse mobile production run: Performance >= 90, A11y >= 95, Best Practices >= 95, SEO >= 90 `[NEEDS-USER]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `PERF`
- **Dependencies:** `OPS-1`, `PERF-2`
- **Files Likely Touched:**
  - `docs/readiness/FINAL.md`
- **Acceptance Criteria:**
  - [ ] Run Google Lighthouse mobile audit against production URL
  - [ ] Record audit score metrics in launch documentation
- **How It Will Be Tested:** Execute Lighthouse CLI or Chrome DevTools audit on production deployment.

### 34. [PERF-3] Core Web Vitals verification (LCP < 2.5s, CLS <= 0.05, INP < 200ms) `[NEEDS-USER]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `PERF`
- **Dependencies:** `PERF-1`
- **Files Likely Touched:**
  - `docs/readiness/FINAL.md`
- **Acceptance Criteria:**
  - [ ] Measure Core Web Vitals on mobile network emulation
  - [ ] Ensure Largest Contentful Paint renders under 2.5 seconds
- **How It Will Be Tested:** PageSpeed Insights or Chrome DevTools Performance panel.

### 35. [PERF-5] Verify HTTP Cache-Control and Gzip/Brotli compression on static assets `[NEEDS-USER]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `PERF`
- **Dependencies:** `OPS-1`
- **Files Likely Touched:**
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] Static hashed assets carry Cache-Control: public, max-age=31536000, immutable
  - [ ] index.html carries Cache-Control: no-cache
  - [ ] Responses are delivered with Content-Encoding: br or gzip
- **How It Will Be Tested:** Curl response headers on production CDN.

### 36. [OPS-6] Automatic staging deployment and manual approval production pipeline `[NEEDS-USER]`

- **Priority:** `P1` | **Effort:** `M` | **Category:** `OPS`
- **Dependencies:** `OPS-3`
- **Files Likely Touched:**
  - `.github/workflows/deploy.yml`
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] Merging to main automatically deploys to staging environment
  - [ ] Promoting to production requires manual GitHub release/environment approval
- **How It Will Be Tested:** Trigger staging deploy via pull request merge.

### 37. [OPS-9] Error tracking integration and alerting configuration (Sentry or GCP Error Reporting) `[NEEDS-USER]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `OPS`
- **Dependencies:** `OPS-1`
- **Files Likely Touched:**
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] Client and server unhandled exceptions trigger alert to owner
  - [ ] Ensures production bugs are surfaced immediately
- **How It Will Be Tested:** Trigger test error and assert alert delivery.

### 38. [OPS-10] Automated uptime monitoring and downtime alerting `[NEEDS-USER]`

- **Priority:** `P1` | **Effort:** `S` | **Category:** `OPS`
- **Dependencies:** `OPS-1`
- **Files Likely Touched:**
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] Configure uptime checker (UptimeRobot, Better Uptime) polling /api/v1/readyz every 5 minutes
  - [ ] Alerts owner via email or webhook if service is unreachable
- **How It Will Be Tested:** Simulate health failure and verify notification.

---

## 4. P2: Quality, Polish & Differentiating Features (44 items)

Features that enhance user delight, optimize performance, and deliver MoneyTracker's core differentiating capabilities (DIFF-1 through DIFF-6).

### 1. [DIFF-1] Safe to spend today metric on Dashboard with autopay deduction and days-left formula [DONE]

- **Priority:** `P2` | **Effort:** `S` | **Category:** `DIFF`
- **Dependencies:** `CORE-2`
- **Files Touched:**
  - `packages/shared/src/calculations/budget.ts`
  - `packages/shared/test/budget.test.ts`
  - `apps/web/src/lib/budget.ts`
  - `apps/web/src/components/dashboard/DashboardTab.tsx`
  - `apps/web/src/test/dashboard_redesign.test.tsx`
- **Acceptance Criteria:**
  - [x] Formula matches Section 2: (monthly limit - current month expenses - remaining expense autopay due this month) / days left in month
  - [x] Days left in month is calculated inclusively so today is counted (e.g. on last day of month, days left is 1, not 0)
  - [x] If remaining safe spend is negative, displays ₹0/day with warning styling
  - [x] Displays an explainer tooltip detailing the exact mathematical components
- **How It Was Tested:**
  - 5 unit test assertions in `packages/shared/test/budget.test.ts` verifying safe daily spend deduction, inclusive days left on last day of month, ₹0/day on over-budget, and autopay deduction.
  - 2 component tests in `apps/web/src/test/dashboard_redesign.test.tsx` asserting card rendering, tooltip toggle, and over-budget states.

### 2. [DIFF-2] Bank statement CSV import with column mapping, duplicate preview, and merchant category rules [DONE]

- **Priority:** `P2` | **Effort:** `M` | **Category:** `DIFF`
- **Dependencies:** `CORE-12`
- **Files Touched:**
  - `packages/shared/src/calculations/merchantRules.ts`: Core bank CSV parsing, Indian date normalization, bank template detection (HDFC, ICICI, SBI, generic/custom), merchant rule matcher, and duplicate preview generator.
  - `packages/shared/test/merchantRules.test.ts`: 10 unit tests for rule matching, date parsing, template detection, and preview generation.
  - `apps/web/src/lib/merchantRules.ts`: Client-side persistence for custom bank templates and learned merchant categorization rules in localStorage.
  - `apps/web/src/components/transactions/BankImportModal.tsx`: Accessible interactive modal with drag & drop CSV upload, bank template selector, customizable column mapping, live stats bar, duplicate detection, merchant category learning, and row toggles.
  - `apps/web/src/components/transactions/TransactionsTab.tsx`: More Menu button integration and modal mounting.
  - `apps/web/src/test/bank_import_modal.test.tsx`: 6 component unit tests verifying upload, template detection, duplicate row flags, mapping customizer, file size limits, and import commit.
  - `apps/web/src/test/transactions_redesign.test.tsx`: Integration test verifying More Menu opening the Bank Statement Import dialog.
- **Acceptance Criteria:**
  - [x] Allows user to map arbitrary bank CSV columns (Date, Amount, Description, Type, Debit/Credit) and save mapping as reusable template
  - [x] Displays preview grid showing detected duplicates (grayed out) and uncategorized rows before final commit
  - [x] Applies learned merchant categorization rules (e.g. description contains "SWIGGY" -> Food & Dining) and remembers corrections
  - [x] All parsing runs client-side with zero bank credentials or external API calls (100% private and offline)
- **How It Was Tested:**
  - 10 unit tests in `packages/shared/test/merchantRules.test.ts` (100% passing).
  - 6 component tests in `apps/web/src/test/bank_import_modal.test.tsx` (100% passing).
  - 1 integration test in `apps/web/src/test/transactions_redesign.test.tsx` (100% passing).
  - Clean TypeScript compilation, linting, and full production build.

### 3. [DIFF-3] Recurring charge detection from transaction history with autopay conversion suggestion

- **Priority:** `P2` | **Effort:** `M` | **Category:** `DIFF`
- **Dependencies:** `CORE-1`
- **Files Likely Touched:**
  - `packages/shared/src/calculations/recurringDetector.ts`
  - `apps/web/src/components/autopay/RecurringSuggestionsCard.tsx`
- **Acceptance Criteria:**
  - [ ] Analyzes transaction history to identify repeating charges (similar description, similar amount, approx. 28-31 days apart)
  - [ ] Offers one-click action to convert detected pattern into active Autopay plan
  - [ ] Flags renewal price increases or expected subscriptions that did not arrive
- **How It Will Be Tested:** Unit test detecting monthly subscription patterns in 3 months of mock history.

### 4. [DIFF-4] Explainable insights and month-end spending projection with "Show calculation" breakdowns

- **Priority:** `P2` | **Effort:** `M` | **Category:** `DIFF`
- **Dependencies:** `CORE-7`
- **Files Likely Touched:**
  - `apps/web/src/components/analytics/ExplainableInsights.tsx`
  - `packages/shared/src/calculations/projections.ts`
- **Acceptance Criteria:**
  - [ ] Generates plain-language spending statements (e.g. "Food spending is 24% above your 3-month average")
  - [ ] Calculates projected month-end total spending at current burn pace compared against budget limit
  - [ ] Every insight includes interactive "Show calculation" link opening transparent formula breakdown modal
- **How It Will Be Tested:** Component test verifying projection calculation and modal formula display.

### 5. [DIFF-5] Trash bin with 30-day restore and activity history with batch import undo

- **Priority:** `P2` | **Effort:** `M` | **Category:** `DIFF`
- **Dependencies:** `CORE-9`
- **Files Likely Touched:**
  - `apps/web/src/components/transactions/TrashModal.tsx`
  - `apps/api/src/repositories/transactionRepository.ts`
- **Acceptance Criteria:**
  - [ ] Deleted transactions remain in Trash for 30 days before permanent purging
  - [ ] User can view Trash and restore items with single click
  - [ ] Activity history log records recent edits and imports, allowing full CSV import batch to be undone in one step
- **How It Will Be Tested:** Test soft deleting item, querying Trash, and restoring to active state.

### 6. [DIFF-6] Passphrase-encrypted backup and restore using browser Web Crypto API

- **Priority:** `P2` | **Effort:** `M` | **Category:** `DIFF`
- **Dependencies:** `CORE-13`
- **Files Likely Touched:**
  - `packages/shared/src/crypto/encryptedBackup.ts`
  - `apps/web/src/components/transactions/EncryptedBackupModal.tsx`
- **Acceptance Criteria:**
  - [ ] Exports full backup JSON encrypted with AES-GCM (PBKDF2 key derivation with 100,000 iterations and salt)
  - [ ] Restores encrypted backup by prompting for passphrase directly in browser
  - [ ] User holds encryption key; zero server knowledge fits privacy-first principle
- **How It Will Be Tested:** Unit test verifying round-trip encryption, decryption, and wrong-password rejection.

### 7. [CORE-17] Deterministic sorting with stable ID tie-breakers in database queries and UI [DONE]

- **Priority:** `P2` | **Effort:** `S` | **Category:** `CORE`
- **Dependencies:** None
- **Files Touched:**
  - `packages/shared/src/calculations/transactions.ts`
  - `apps/web/src/types/index.ts`
  - `apps/web/src/lib/transactions.ts`
  - `apps/api/src/repositories/transactionRepository.ts`
  - `apps/web/src/components/transactions/TransactionsTab.tsx`
  - `packages/shared/test/sorting_tiebreaker.test.ts`
- **Acceptance Criteria:**
  - [x] SQL order queries and client sort functions append id as secondary tie-breaker
  - [x] Supports all sort options: date-desc, date-asc, amount-desc, amount-asc, category-asc, month-desc, month-asc
- **How It Was Tested:**
  - 5 unit test assertions in `packages/shared/test/sorting_tiebreaker.test.ts` verifying identical deterministic order for items sharing same date and amount.

### 8. [CORE-19] Category rename and delete with transaction reassignment

- **Priority:** `P2` | **Effort:** `M` | **Category:** `CORE`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/api/src/repositories/categoryRepository.ts`
  - `apps/web/src/components/profile/CategorySettingsModal.tsx`
- **Acceptance Criteria:**
  - [ ] User can rename custom categories across existing transactions
  - [ ] Deleting a category prompts to reassign associated transactions to another category
- **How It Will Be Tested:** API test renaming category and verifying all transaction records update.

### 9. [CORE-21] Document future-dated transactions policy in user guides and Help page

- **Priority:** `P2` | **Effort:** `S` | **Category:** `CORE`
- **Dependencies:** None
- **Files Likely Touched:**
  - `docs/USER_GUIDE.md`
  - `apps/web/src/components/help/HelpPage.tsx`
- **Acceptance Criteria:**
  - [ ] Documents that future-dated entries within current month are counted in month totals, while future months appear in upcoming schedules
  - [ ] Provides clear guidance on scheduling vs retroactive entry
- **How It Will Be Tested:** Verify documentation in help screen.

### 10. [AUTH-12] Protected route deep-linking and post-login redirect restoration

- **Priority:** `P2` | **Effort:** `S` | **Category:** `AUTH`
- **Dependencies:** `AUTH-1`
- **Files Likely Touched:**
  - `apps/web/src/App.tsx`
- **Acceptance Criteria:**
  - [ ] Visiting /transactions while signed out redirects to sign-in modal with redirect query param
  - [ ] Successful authentication automatically redirects to original intended route
- **How It Will Be Tested:** Test browser navigation to deep route and assert destination after login.

### 11. [BE-18] Soft-delete retention documentation and configurable purge threshold

- **Priority:** `P2` | **Effort:** `S` | **Category:** `BE`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/api/src/jobs/scheduler.ts`
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] Documents 90-day tombstone purge job and verifies idempotent execution
- **How It Will Be Tested:** Verify scheduler job tests pass.

### 12. [BE-19] Graceful shutdown connection draining and worker termination

- **Priority:** `P2` | **Effort:** `S` | **Category:** `BE`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/api/src/server.ts`
- **Acceptance Criteria:**
  - [ ] Server gracefully completes in-flight HTTP requests and finishes active pg-boss job locks before exit
- **How It Will Be Tested:** Integration test verifying SIGTERM signal handling.

### 13. [BE-20] Prisma seed script with realistic sample personal finance data for dev & demo

- **Priority:** `P2` | **Effort:** `S` | **Category:** `BE`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/api/prisma/seed.ts`
  - `apps/api/package.json`
- **Acceptance Criteria:**
  - [ ] npm run prisma:seed populates database with realistic 3-month personal finance records, autopays, and budget goals
  - [ ] Provides immediate rich state for testing, staging, and demo environments
- **How It Will Be Tested:** Run `npx prisma db seed` and verify database row counts.

### 14. [SEC-19] Cloudflare Turnstile bot protection on sign-up form

- **Priority:** `P2` | **Effort:** `M` | **Category:** `SEC`
- **Dependencies:** `AUTH-1`
- **Files Likely Touched:**
  - `apps/web/src/components/auth/AuthModal.tsx`
  - `apps/api/src/middleware/turnstile.ts`
- **Acceptance Criteria:**
  - [ ] Integrates privacy-preserving Cloudflare Turnstile CAPTCHA widget on sign-up form
  - [ ] Backend verifies Turnstile token before creating account, preventing automated registration abuse
- **How It Will Be Tested:** Component test verifying Turnstile callback passes token to signUpWithEmail.

### 15. [SEC-20] One-page threat model document (assets, attack vectors, mitigations)

- **Priority:** `P2` | **Effort:** `S` | **Category:** `SEC`
- **Dependencies:** None
- **Files Likely Touched:**
  - `docs/security/THREAT_MODEL.md`
- **Acceptance Criteria:**
  - [ ] Documents assets (financial records, auth tokens, backup files)
  - [ ] Identifies attack vectors (IDOR, credential stuffing, formula injection, offline sync tampering) and mitigations
- **How It Will Be Tested:** Review threat model document for completeness.

### 16. [UX-12] Reflect active tab, month filter, and pagination in URL search params

- **Priority:** `P2` | **Effort:** `S` | **Category:** `UX`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/components/layout/AppLayout.tsx`
  - `apps/web/src/components/transactions/TransactionsTab.tsx`
- **Acceptance Criteria:**
  - [ ] Switching tabs updates URL hash/query (?tab=transactions&month=2026-11&page=2)
  - [ ] Browser Back and Forward buttons navigate between previous filter/tab states naturally
- **How It Will Be Tested:** Component test verifying history.pushState calls on filter change.

### 17. [UX-13] Dynamic document.title updates and route-change accessible focus management

- **Priority:** `P2` | **Effort:** `S` | **Category:** `UX`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/components/layout/AppLayout.tsx`
- **Acceptance Criteria:**
  - [ ] Switching tabs updates document.title (e.g. "Transactions — MoneyTracker", "Analytics — MoneyTracker")
  - [ ] Shifts screen reader focus to the top level <h1> heading upon navigation
- **How It Will Be Tested:** Component test verifying document.title updates on tab change.

### 18. [UX-16] Guided first-run onboarding stepper with sample data walkthrough

- **Priority:** `P2` | **Effort:** `M` | **Category:** `UX`
- **Dependencies:** `CORE-15`
- **Files Likely Touched:**
  - `apps/web/src/components/onboarding/OnboardingModal.tsx`
  - `apps/web/src/components/layout/AppLayout.tsx`
- **Acceptance Criteria:**
  - [ ] New users without transactions see a friendly 3-step checklist: 1. Set budget, 2. Add first transaction, 3. Schedule bill
  - [ ] Includes optional "Load Sample Data" button to experiment before logging real expenses
- **How It Will Be Tested:** Component test asserting onboarding checklist renders for 0-transaction accounts.

### 19. [UX-20] Dirty form warning before navigating away or closing drawer with unsaved changes

- **Priority:** `P2` | **Effort:** `S` | **Category:** `UX`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/components/transactions/TransactionSlideOver.tsx`
  - `apps/web/src/components/transactions/AddTransactionTab.tsx`
- **Acceptance Criteria:**
  - [ ] Closing drawer or switching tabs with partially filled form prompts "You have unsaved changes. Discard?"
  - [ ] Prevents accidental loss of transaction entry input
- **How It Will Be Tested:** Component test typing into form, triggering close, and asserting confirm dialog prompt.

### 20. [PERF-7] Preload display font (Bricolage Grotesque) in HTML head [DONE]

- **Priority:** `P2` | **Effort:** `S` | **Category:** `PERF`
- **Dependencies:** None
- **Files Touched:**
  - `apps/web/index.html`
  - `apps/web/src/test/seo_and_brand_assets.test.ts`
- **Acceptance Criteria:**
  - [x] index.html includes <link rel="preload"> for bricolage-grotesque-600.woff2 alongside instrument-sans
  - [x] Self-hosted font-display: swap eliminates FOIT and layout shift (CLS) during heading font render
- **How It Was Tested:** Automated test in `apps/web/src/test/seo_and_brand_assets.test.ts` (passing).

### 21. [PERF-8] Automated React Profiler re-render assertion test for forms and filters

- **Priority:** `P2` | **Effort:** `S` | **Category:** `PERF`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/test/render_performance.test.tsx`
- **Acceptance Criteria:**
  - [ ] Verifies typing in search input or amount field does not trigger cascading re-renders in sibling cards
- **How It Will Be Tested:** Run vitest test asserting render call counts.

### 22. [PERF-9] PWA Web App Manifest and Service Worker for offline app shell caching

- **Priority:** `P2` | **Effort:** `M` | **Category:** `PERF`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/public/manifest.json`
  - `apps/web/public/sw.js`
  - `apps/web/index.html`
- **Acceptance Criteria:**
  - [ ] Provides manifest.json with app name, theme color (#FBF8F4), icons, and standalone display
  - [ ] Registers lightweight Service Worker caching HTML, CSS, fonts, and JS bundles for offline instant launch
- **How It Will Be Tested:** Verify Service Worker registration and manifest validation in browser tools.

### 23. [PERF-13] HTTP compression middleware (gzip/brotli) for API JSON responses [DONE]

- **Priority:** `P2` | **Effort:** `S` | **Category:** `PERF`
- **Dependencies:** None
- **Files Touched:**
  - `apps/api/src/app.ts`
  - `apps/api/package.json`
  - `apps/api/test/compression.test.ts`
- **Acceptance Criteria:**
  - [x] Mounts compression() middleware in Express 5 app with 1KB threshold
  - [x] API responses larger than 1kB return with gzip Content-Encoding when requested
  - [x] Allows client bypass via `x-no-compression` request header
- **How It Was Tested:**
  - 3 integration test assertions in `apps/api/test/compression.test.ts` asserting gzip encoding on >1KB responses, uncompressed on <1KB responses, and bypass on `x-no-compression`.

### 24. [QA-10] Automated accessibility checks (axe-core) gate in CI workflow

- **Priority:** `P2` | **Effort:** `S` | **Category:** `QA`
- **Dependencies:** `OPS-3`
- **Files Likely Touched:**
  - `.github/workflows/ci.yml`
- **Acceptance Criteria:**
  - [ ] CI includes dedicated test:a11y step executing axe-core assertions with zero tolerated violations
- **How It Will Be Tested:** Run `npm test src/test/a11y_axe.test.tsx` in CI pipeline.

### 25. [QA-11] Code coverage thresholds enforcement in CI (80% line coverage)

- **Priority:** `P2` | **Effort:** `S` | **Category:** `QA`
- **Dependencies:** `OPS-3`
- **Files Likely Touched:**
  - `vitest.config.ts`
  - `.github/workflows/ci.yml`
- **Acceptance Criteria:**
  - [ ] Vitest configuration enforces coverage thresholds: 80% lines, 80% functions, 70% branches
  - [ ] Fails CI build if code changes drop coverage below target thresholds
- **How It Will Be Tested:** Run `npx vitest run --coverage` and assert threshold compliance.

### 26. [QA-12] Property-based randomized tests for currency and date calculations (fast-check)

- **Priority:** `P2` | **Effort:** `S` | **Category:** `QA`
- **Dependencies:** None
- **Files Likely Touched:**
  - `packages/shared/test/property_math.test.ts`
- **Acceptance Criteria:**
  - [ ] Tests currency conversion (rupeesToPaise <-> paiseToRupees) across 10,000 random float values
  - [ ] Proves zero rounding drift and bidirectional idempotency
- **How It Will Be Tested:** Execute property-based Vitest test file.

### 27. [QA-13] API load test script (50 concurrent users) and benchmark record

- **Priority:** `P2` | **Effort:** `S` | **Category:** `QA`
- **Dependencies:** None
- **Files Likely Touched:**
  - `scripts/load-test.ts`
  - `docs/LOAD_TEST_REPORT.md`
- **Acceptance Criteria:**
  - [ ] Script simulates 50 concurrent users querying transactions and analytics endpoints
  - [ ] Records p95 latency (< 300ms) and throughput metrics in documentation
- **How It Will Be Tested:** Execute load test script against local test server.

### 28. [QA-14] Dead code and unused dependency audit with knip

- **Priority:** `P2` | **Effort:** `S` | **Category:** `QA`
- **Dependencies:** None
- **Files Likely Touched:**
  - `knip.json`
- **Acceptance Criteria:**
  - [ ] Scans monorepo for unused exports, unreferenced files, and dead packages
  - [ ] Clean report committed
- **How It Will Be Tested:** Run knip check.

### 29. [QA-16] Bundle analyzer report generation and visual artifact archiving

- **Priority:** `P2` | **Effort:** `S` | **Category:** `QA`
- **Dependencies:** `PERF-2`
- **Files Likely Touched:**
  - `apps/web/vite.config.ts`
  - `docs/BUNDLE_ANALYSIS.md`
- **Acceptance Criteria:**
  - [ ] Generates visual HTML dependency treemap of production bundle
  - [ ] Documents justification for Chart.js and Motion dependencies
- **How It Will Be Tested:** Inspect bundle analyzer output in docs.

### 30. [OPS-13] Application metrics logging (request duration, status code counters)

- **Priority:** `P2` | **Effort:** `S` | **Category:** `OPS`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/api/src/middleware/metrics.ts`
  - `apps/api/src/routes/healthRoutes.ts`
- **Acceptance Criteria:**
  - [ ] Logs request duration histogram and error counters with request ID tags
  - [ ] Exposes lightweight summary in health endpoint
- **How It Will Be Tested:** Query /readyz and inspect pino request latency logs.

### 31. [OPS-14] Production Dockerfile and docker-compose deployment manifests

- **Priority:** `P2` | **Effort:** `S` | **Category:** `OPS`
- **Dependencies:** None
- **Files Likely Touched:**
  - `Dockerfile.api`
  - `Dockerfile.web`
  - `docker-compose.prod.yml`
- **Acceptance Criteria:**
  - [ ] Multi-stage Dockerfiles compiling API and web SPA cleanly into minimal Node.js / Nginx images
  - [ ] Tested with docker compose up
- **How It Will Be Tested:** Build container images and verify healthcheck.

### 32. [OPS-15] Automated GitHub Dependabot configuration for monorepo workspaces

- **Priority:** `P2` | **Effort:** `S` | **Category:** `OPS`
- **Dependencies:** None
- **Files Likely Touched:**
  - `.github/dependabot.yml`
- **Acceptance Criteria:**
  - [ ] Configures weekly dependency vulnerability checks for npm monorepo workspaces and GitHub Actions
- **How It Will Be Tested:** Verify YAML schema of .github/dependabot.yml.

### 33. [OPS-16] Repository CHANGELOG.md and semantic release tagging workflow

- **Priority:** `P2` | **Effort:** `S` | **Category:** `OPS`
- **Dependencies:** None
- **Files Likely Touched:**
  - `CHANGELOG.md`
- **Acceptance Criteria:**
  - [ ] Establishes CHANGELOG.md following Keep a Changelog standard
  - [ ] Documents releases from v1.0, v2.0, v3.0, and current readiness phase
- **How It Will Be Tested:** Review CHANGELOG.md formatting.

### 34. [WEB-9] SEO meta descriptions, canonical URLs, and Open Graph / Twitter social preview tags [DONE]

- **Priority:** `P2` | **Effort:** `S` | **Category:** `WEB`
- **Dependencies:** None
- **Files Touched:**
  - `apps/web/index.html`
  - `apps/web/public/og-image.png`
  - `apps/web/src/test/seo_and_brand_assets.test.ts`
- **Acceptance Criteria:**
  - [x] index.html includes meta description, canonical URL, og:title, og:image, og:type, twitter:card
  - [x] Provides rich preview when shared on WhatsApp, Telegram, Twitter, LinkedIn
- **How It Was Tested:**
  - 4 assertions in `apps/web/src/test/seo_and_brand_assets.test.ts` verifying page title, description, canonical link, Open Graph, and Twitter summary_large_image card tags.
  - Branded 1200x630 `og-image.png` generated and verified.

### 35. [WEB-10] Public robots.txt and sitemap.xml with noindex tags on private authenticated views [DONE]

- **Priority:** `P2` | **Effort:** `S` | **Category:** `WEB`
- **Dependencies:** None
- **Files Touched:**
  - `apps/web/public/robots.txt`
  - `apps/web/public/sitemap.xml`
  - `apps/web/src/test/robots_and_sitemap.test.ts`
- **Acceptance Criteria:**
  - [x] robots.txt allows indexing on public landing, terms, and privacy pages
  - [x] Disallows indexing on private app state (/app/*); sitemap.xml lists public URLs
- **How It Was Tested:**
  - 2 unit test assertions in `apps/web/src/test/robots_and_sitemap.test.ts` verifying robots.txt directives and valid sitemap.xml structure with canonical public routes.

### 36. [WEB-11] High-resolution Apple Touch Icon and theme-color meta headers [DONE]

- **Priority:** `P2` | **Effort:** `S` | **Category:** `WEB`
- **Dependencies:** None
- **Files Touched:**
  - `apps/web/public/apple-touch-icon.png`
  - `apps/web/index.html`
  - `apps/web/src/test/seo_and_brand_assets.test.ts`
- **Acceptance Criteria:**
  - [x] Provides 180x180 PNG apple-touch-icon.png
  - [x] <meta name="theme-color"> declares light and dark responsive palette
- **How It Was Tested:**
  - Unit test in `apps/web/src/test/seo_and_brand_assets.test.ts` verifying apple-touch-icon and light/dark theme colors.
  - 180x180 PNG verified in `apps/web/public/apple-touch-icon.png`.

### 37. [WEB-12] Help & FAQ page explaining calculations (anomalies, SMA, runway, autopay) in plain language

- **Priority:** `P2` | **Effort:** `M` | **Category:** `WEB`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/components/help/HelpPage.tsx`
  - `apps/web/src/App.tsx`
- **Acceptance Criteria:**
  - [ ] Dedicated Help view explaining Z-scores, 7-day SMA forecasting, capital runway, and autopay logic
  - [ ] Provides transparent calculation walkthrough without technical jargon
- **How It Will Be Tested:** Component test verifying Help page renders and navigates.

### 38. [WEB-13] Architectural Decision Records (ADRs) documenting core technology choices

- **Priority:** `P2` | **Effort:** `S` | **Category:** `WEB`
- **Dependencies:** None
- **Files Likely Touched:**
  - `docs/adr/0001-postgresql-and-express-migration.md`
  - `docs/adr/0002-integer-paise-currency.md`
  - `docs/adr/0003-client-side-privacy-first.md`
- **Acceptance Criteria:**
  - [ ] Documents context, alternatives, and decision rationales for Node/Postgres, integer paise, and privacy-first sync
- **How It Will Be Tested:** Review ADR markdown files.

### 39. [WEB-14] Interactive public Demo Mode with realistic pre-seeded dataset

- **Priority:** `P2` | **Effort:** `S` | **Category:** `WEB`
- **Dependencies:** `WEB-3`
- **Files Likely Touched:**
  - `apps/web/src/components/auth/AuthModal.tsx`
  - `apps/web/src/context/TrackerContext.tsx`
- **Acceptance Criteria:**
  - [ ] Public visitors can click "Explore Demo Mode" on login screen to enter app with populated transactions and charts without creating account
  - [ ] Changes are stored in session memory only
- **How It Will Be Tested:** Click Demo Mode in AuthModal and assert populated Dashboard view.

### 40. [X-4] Data Export Schema versioning (version: "1.0") and SHA-256 payload integrity checksum

- **Priority:** `P2` | **Effort:** `S` | **Category:** `X`
- **Dependencies:** `CORE-13`
- **Files Likely Touched:**
  - `packages/shared/src/calculations/transactions.ts`
- **Acceptance Criteria:**
  - [ ] JSON export includes schemaVersion: "1.0" and sha256 checksum of transactions payload
  - [ ] Import validates checksum to detect file tampering or corruption
- **How It Will Be Tested:** Unit test verifying sha256 computation in exportTransactionsJson.

### 41. [OPS-12] Configure custom domain DNS records with apex and www redirections `[NEEDS-USER]`

- **Priority:** `P2` | **Effort:** `S` | **Category:** `OPS`
- **Dependencies:** `OPS-1`
- **Files Likely Touched:**
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] Owner sets up CNAME and A records in DNS registrar
  - [ ] Redirects www to apex domain with SSL certificates
- **How It Will Be Tested:** DNS lookup check via dig/nslookup.

### 42. [OPS-17] Configure provider free-tier resource limits and cost threshold alerts `[NEEDS-USER]`

- **Priority:** `P2` | **Effort:** `S` | **Category:** `OPS`
- **Dependencies:** `OPS-1`
- **Files Likely Touched:**
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] Owner configures spending caps and usage alerts in Vercel, Render, Neon, and Firebase consoles
- **How It Will Be Tested:** Owner verification of dashboard billing settings.

### 43. [OPS-18] Measure hosting cold-start behavior and provide user feedback toast `[NEEDS-USER]`

- **Priority:** `P2` | **Effort:** `S` | **Category:** `OPS`
- **Dependencies:** `OPS-1`, `X-2`
- **Files Likely Touched:**
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] Measure spin-up latency on free/suspended tier and ensure client displays friendly "Waking server..." notification
- **How It Will Be Tested:** Test cold launch after 15 minutes of inactivity.

### 44. [X-3] Configure transactional email provider credentials and sender domain `[NEEDS-USER]`

- **Priority:** `P2` | **Effort:** `S` | **Category:** `X`
- **Dependencies:** None
- **Files Likely Touched:**
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] Owner creates account with email provider (Resend, SendGrid, or AWS SES) and configures API keys
- **How It Will Be Tested:** Test API email dispatch.

---

## 5. P3: Minor & Optional Extensions (21 items)

Long-term roadmap items and polish enhancements that can be addressed post-launch.

### 1. [DIFF-7] Per-category budget targets with customizable warning thresholds

- **Priority:** `P3` | **Effort:** `M` | **Category:** `DIFF`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/components/budget/CategoryBudgetModal.tsx`
  - `packages/shared/src/schemas/budget.ts`
- **Acceptance Criteria:**
  - [ ] Optional per-category limits alongside overall monthly budget
- **How It Will Be Tested:** Unit test verifying category budget threshold evaluation.

### 2. [DIFF-8] Savings goals tracker with target date and required monthly deposit calculation

- **Priority:** `P3` | **Effort:** `M` | **Category:** `DIFF`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/components/savings/SavingsGoalsModal.tsx`
- **Acceptance Criteria:**
  - [ ] Target amount, target date, progress bar, required monthly savings needed
- **How It Will Be Tested:** Unit test verifying savings calculation.

### 3. [DIFF-9] Opt-in weekly financial summary email digest

- **Priority:** `P3` | **Effort:** `M` | **Category:** `DIFF`
- **Dependencies:** `X-3`
- **Files Likely Touched:**
  - `apps/api/src/jobs/weeklyDigestJob.ts`
- **Acceptance Criteria:**
  - [ ] Weekly background job compiling spending summary and upcoming autopays for opt-in users
- **How It Will Be Tested:** Test weekly digest template rendering.

### 4. [AUTH-14] Optional Two-Factor Authentication (2FA / TOTP)

- **Priority:** `P3` | **Effort:** `L` | **Category:** `AUTH`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/components/profile/TwoFactorModal.tsx`
- **Acceptance Criteria:**
  - [ ] TOTP authenticator app integration
- **How It Will Be Tested:** 2FA authentication challenge test.

### 5. [BE-21] Formal API backward-compatibility policy documentation

- **Priority:** `P3` | **Effort:** `S` | **Category:** `BE`
- **Dependencies:** None
- **Files Likely Touched:**
  - `docs/api/COMPATIBILITY_POLICY.md`
- **Acceptance Criteria:**
  - [ ] Documents versioning rules, deprecation windows, and additive schema evolution
- **How It Will Be Tested:** Documentation review.

### 6. [SEC-21] Standard RFC 9116 security.txt contact file

- **Priority:** `P3` | **Effort:** `S` | **Category:** `SEC`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/public/.well-known/security.txt`
- **Acceptance Criteria:**
  - [ ] Provides contact email, encryption key URL, and policy links conforming to RFC 9116
- **How It Will Be Tested:** Curl /.well-known/security.txt.

### 7. [SEC-22] Documented secret and credential rotation runbook

- **Priority:** `P3` | **Effort:** `S` | **Category:** `SEC`
- **Dependencies:** None
- **Files Likely Touched:**
  - `docs/security/SECRET_ROTATION.md`
- **Acceptance Criteria:**
  - [ ] Step-by-step runbook for rotating JWT secrets, Firebase Admin credentials, and database passwords
- **How It Will Be Tested:** Documentation review.

### 8. [UX-21] Persist last-used transaction filters, sorting, and category in localStorage

- **Priority:** `P3` | **Effort:** `S` | **Category:** `UX`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/components/transactions/TransactionsTab.tsx`
- **Acceptance Criteria:**
  - [ ] Remembers user filter and sort selections across browser reloads
- **How It Will Be Tested:** Reload page and assert remembered filter settings.

### 9. [UX-22] Keyboard shortcut help modal dialog (triggered by ? key)

- **Priority:** `P3` | **Effort:** `S` | **Category:** `UX`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/components/layout/ShortcutsModal.tsx`
  - `apps/web/src/components/layout/AppShell.tsx`
- **Acceptance Criteria:**
  - [ ] Pressing ? opens accessible dialog listing N (New Transaction), Ctrl+B (Toggle Sidebar), etc.
- **How It Will Be Tested:** Component test asserting modal opens on ? keypress.

### 10. [UX-23] Dark theme toggle and high-contrast night palette

- **Priority:** `P3` | **Effort:** `M` | **Category:** `UX`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/tokens.css`
  - `apps/web/src/components/layout/Header.tsx`
- **Acceptance Criteria:**
  - [ ] Adds dark theme CSS custom properties and header toggle switch
- **How It Will Be Tested:** Verify dark theme styles and contrast ratios.

### 11. [UX-24] Print stylesheet for transaction summaries and financial reports

- **Priority:** `P3` | **Effort:** `S` | **Category:** `UX`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/styles/print.css`
- **Acceptance Criteria:**
  - [ ] Hides sidebar and navigation, styling clean tabular summary when printing or saving as PDF
- **How It Will Be Tested:** Inspect @media print styles.

### 12. [PERF-14] PWA maskable icons and splash screen configuration

- **Priority:** `P3` | **Effort:** `S` | **Category:** `PERF`
- **Dependencies:** `PERF-9`
- **Files Likely Touched:**
  - `apps/web/public/manifest.json`
  - `apps/web/public/icon-maskable.png`
- **Acceptance Criteria:**
  - [ ] Adds purpose: "maskable any" icon entries to manifest.json
- **How It Will Be Tested:** Validate in Chrome DevTools Application panel.

### 13. [PERF-15] Predictive route chunk prefetching on link hover

- **Priority:** `P3` | **Effort:** `S` | **Category:** `PERF`
- **Dependencies:** `PERF-2`
- **Files Likely Touched:**
  - `apps/web/src/components/layout/NavigationTabs.tsx`
- **Acceptance Criteria:**
  - [ ] Prefetches code-split tab chunk when user hovers or focuses navigation item
- **How It Will Be Tested:** Verify network prefetch in browser DevTools.

### 14. [QA-18] Formal release manual QA script and historical bug log

- **Priority:** `P3` | **Effort:** `S` | **Category:** `QA`
- **Dependencies:** None
- **Files Likely Touched:**
  - `docs/qa/MANUAL_QA_SCRIPT.md`
  - `docs/qa/BUG_LOG.md`
- **Acceptance Criteria:**
  - [ ] Detailed step-by-step checklist for pre-launch manual verification
- **How It Will Be Tested:** Review QA checklist.

### 15. [OPS-19] GitHub branch protection rules and Pull Request template

- **Priority:** `P3` | **Effort:** `S` | **Category:** `OPS`
- **Dependencies:** None
- **Files Likely Touched:**
  - `.github/pull_request_template.md`
  - `docs/RUNBOOK.md`
- **Acceptance Criteria:**
  - [ ] PR template with testing checklist and guidance for enforcing branch protection
- **How It Will Be Tested:** Verify template renders on GitHub.

### 16. [OPS-21] Documented Recovery Point Objective (RPO) and Recovery Time Objective (RTO) targets

- **Priority:** `P3` | **Effort:** `S` | **Category:** `OPS`
- **Dependencies:** None
- **Files Likely Touched:**
  - `docs/ops/DISASTER_RECOVERY.md`
- **Acceptance Criteria:**
  - [ ] Establishes RPO = 24 hours, RTO = 2 hours for catastrophic database loss
- **How It Will Be Tested:** Review DR targets document.

### 17. [WEB-16] Public About page detailing project mission, privacy architecture, and tech stack

- **Priority:** `P3` | **Effort:** `S` | **Category:** `WEB`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/components/legal/AboutPage.tsx`
  - `apps/web/src/App.tsx`
- **Acceptance Criteria:**
  - [ ] Route /about detailing open-source software stack and data privacy mission
- **How It Will Be Tested:** Navigate to /about.

### 18. [WEB-17] In-app "What's New" changelog drawer

- **Priority:** `P3` | **Effort:** `S` | **Category:** `WEB`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/components/help/ChangelogDrawer.tsx`
- **Acceptance Criteria:**
  - [ ] Displays release notes and newly introduced features to users
- **How It Will Be Tested:** Component test verifying drawer open.

### 19. [WEB-18] CONTRIBUTING.md and CODE_OF_CONDUCT.md community guidelines

- **Priority:** `P3` | **Effort:** `S` | **Category:** `WEB`
- **Dependencies:** None
- **Files Likely Touched:**
  - `CONTRIBUTING.md`
  - `CODE_OF_CONDUCT.md`
- **Acceptance Criteria:**
  - [ ] Documents local contribution workflows, code quality rules, and community conduct
- **How It Will Be Tested:** Verify file existence.

### 20. [WEB-19] Schema.org JSON-LD structured data (SoftwareApplication) on landing page

- **Priority:** `P3` | **Effort:** `S` | **Category:** `WEB`
- **Dependencies:** `WEB-3`
- **Files Likely Touched:**
  - `apps/web/index.html`
- **Acceptance Criteria:**
  - [ ] Embeds SoftwareApplication JSON-LD script tag with pricing (Free), category (FinanceApplication)
- **How It Will Be Tested:** Validate JSON-LD with Google Rich Results test.

### 21. [WEB-20] Formal Accessibility Statement conforming to W3C guidelines

- **Priority:** `P3` | **Effort:** `S` | **Category:** `WEB`
- **Dependencies:** None
- **Files Likely Touched:**
  - `apps/web/src/components/legal/AccessibilityPage.tsx`
  - `apps/web/src/App.tsx`
- **Acceptance Criteria:**
  - [ ] Documents WCAG 2.2 AA conformance status, known limits, and accessibility contact email
- **How It Will Be Tested:** Navigate to /accessibility.

---

## 6. Actions Requiring Owner Input (`NEEDS-USER`)

The following 16 items require credentials, domain access, paid hosting, or manual device testing that only the application owner can perform:

| ID | Task | Service / Action Needed | When Required |
| :--- | :--- | :--- | :--- |
| **SEC-1** | Restrict/Rotate Firebase Web API Key | Google Cloud Console > APIs & Services > Credentials | Before launch |
| **SEC-3** | Enforce HTTPS and verify HSTS | DNS & CDN provider (Vercel / Cloudflare) | During deployment |
| **SEC-11** | Add production domain to Firebase Auth Authorized Domains | Firebase Console > Authentication > Settings | During deployment |
| **OPS-1** | Deploy production web SPA and API service | Vercel (web) and Render (API) | P0 Deploy gate |
| **OPS-2** | Provision separate Staging and Production databases | Neon / Supabase / Cloud SQL PostgreSQL | P0 Deploy gate |
| **OPS-4** | Configure automatic daily database backups and retention | Managed PostgreSQL provider dashboard | P0 Deploy gate |
| **AUTH-8** | Custom domain branding for password reset email | Firebase Console > Templates | P1 Launch |
| **UX-10** | Physical device verification on iOS Safari and Android Chrome | Real mobile hardware testing by owner | P1 Launch |
| **PERF-1** | Run Lighthouse mobile audit on live URL | Chrome DevTools on public HTTPS URL | P1 Launch |
| **PERF-3** | Core Web Vitals lab and field measurement | PageSpeed Insights on public URL | P1 Launch |
| **PERF-5** | Verify CDN Cache-Control headers | Web server / CDN response headers check | P1 Launch |
| **OPS-6** | GitHub environment deployment protection & manual approvals | GitHub Repo Settings > Environments | P1 Launch |
| **OPS-9** | Error alerting setup (Sentry / GCP Error Reporting) | Sentry.io or Google Cloud Monitoring | P1 Launch |
| **OPS-10** | Automated uptime monitoring (UptimeRobot / Better Uptime) | Uptime monitoring service setup | P1 Launch |
| **OPS-12** | Custom domain DNS records (apex & www redirection) | DNS registrar / Cloudflare | P2 Polish |
| **OPS-17** | Configure free-tier usage alerts and billing caps | Provider billing dashboards | P2 Polish |
| **OPS-18** | Measure backend cold-start behavior on free tier | Server latency test after 15m idle | P2 Polish |
| **X-3** | Transactional email provider API setup | Resend, SendGrid, or AWS SES | P2 Polish |
