# MoneyTracker Production Readiness: Checklist and Agent Prompt

Nov 6, 2026 · @Dhruv

## 1. How to use this doc

This doc has three parts: feature ideas that make MoneyTracker different (section 2), the prompt you paste into Antigravity (section 3), and the checklist the agent audits against (sections 4 to 14).

1. Export this doc as Markdown and save it in the repo as docs/readiness/CHECKLIST.md. Leave it uncommitted; the agent commits it.
2. Open a new Antigravity conversation on the MoneyTracker folder and paste the master prompt from section 3.
3. The agent audits the repo and writes docs/readiness/AUDIT.md (status of every item, with evidence) and docs/readiness/BACKLOG.md (the unfinished items sorted into P0 to P3). It then stops.
4. Read the backlog. Change any priority you disagree with, then reply "approved".
5. The agent builds one item at a time, with tests and one commit per item. It stops and asks when it needs a credential, an account, a domain, or a decision with real trade-offs.
6. If the conversation gets long, start a new one and tell the agent: continue from docs/readiness/BACKLOG.md and AUDIT.md.
7. At the end, do the manual launch checks listed in docs/readiness/FINAL.md. Some checks (a real phone test, a backup restore, legal review) can only be done by you.

You can run the audit at any point. Items covered by backend or redesign phases that are not finished yet come back as PLANNED and are scheduled after those phases, so nothing is built twice.

## 2. Features that set MoneyTracker apart

MoneyTracker's stated position is privacy-first: no bank credentials, no third-party tracking. These features extend that position instead of copying generic expense-tracker features, and most of them reuse data the app already holds (budget, autopay plans, transaction history, analytics functions).

| ID | Feature | What it does | Builds on | Effort |
| --- | --- | --- | --- | --- |
| DIFF-1 | Safe to spend today | Shows how much can be spent today without breaking the monthly limit: (limit minus spent so far minus expense autopay still due this month) divided by days left in the month. It answers a daily decision, not just history. | Budget goal, autopay plans | S |
| DIFF-2 | Bank statement import with merchant rules | Upload a CSV from your bank, map its columns once (saved as a template per bank), preview rows with duplicates and uncategorised items marked, then import. Rules such as "description contains SWIGGY, category Food" apply automatically and are learned from your corrections. Parsing happens in the browser, so no bank login is needed. | Existing CSV import and deduplication | M |
| DIFF-3 | Recurring charge detection | Finds repeating charges in history (similar description, similar amount, roughly monthly), offers to turn them into autopay plans, and flags price increases and renewals that did not arrive. | Transactions, autopay | M |
| DIFF-4 | Explainable insights and month-end projection | Plain-language statements computed from your data, such as a category running above its 3-month average, and a projected month-end total at the current pace against the limit. Each one has a Show calculation link, so nothing is a black box. | Existing analytics functions | M |
| DIFF-5 | Trash and activity history | Deleted items stay in Trash for 30 days and can be restored. A history lists edits, deletes and imports, and a whole import batch can be undone in one step. | Soft-delete columns in the v3.0 schema | M |
| DIFF-6 | Encrypted backup | Export a backup encrypted with a passphrase using the browser's Web Crypto API, and restore it later. You hold the key, which fits the privacy position. | Existing JSON backup | M |
| DIFF-7 | Per-category budgets | Limits per category with the same warning thresholds as the overall budget. Common in finance apps, so more a baseline expectation than a differentiator. | Budget goal | M |
| DIFF-8 | Savings goals | Target amount and date, progress, and the monthly saving needed to get there. | Transactions | M |
| DIFF-9 | Weekly summary email | Opt-in digest of spending, budget status and upcoming autopay. Needs email sending to be set up. | Backend jobs, analytics | M |

**Recommended build order:** DIFF-1, DIFF-2, DIFF-3, DIFF-4, DIFF-5, then DIFF-6. They go from small to larger, none needs a bank login or an outside AI service, and DIFF-5 and DIFF-6 add recovery, which supports the reliability goal. DIFF-7 to DIFF-9 are optional and sit at P3 in the checklist.

**Acceptance criteria common to all of them:** the feature works offline where the data is local, has loading, empty and error states, has unit tests for its calculations (including zero data and month-end edge cases), uses numbers that match the existing analytics screens for the same data, and is described in plain language on the Help page.

## 3. Master prompt

Paste everything in the block below into a new Antigravity conversation.

```text
ROLE
You are a senior full-stack engineer taking MoneyTracker (Digital Spending Tracker) to the standard of a professional, publicly hosted web application. You work in three stages: AUDIT, PRIORITISE, BUILD. Do not skip ahead.

INPUTS (read first)
- docs/readiness/CHECKLIST.md is the master checklist. Read its sections 2 and 4 to 14. Ignore sections 1 and 3.
- The planning docs in docs/: the v2.0 PRD, the v3.0 full-stack PRD, and docs/redesign/SPEC.md and summary.md if present.
- The repository itself.

GROUND RULES
1. Git: tag the current commit pre-readiness, then work only on the branch readiness/hardening. Make one commit per checklist item or per logical step, with the message format readiness(<ID>): <summary>. Never push. Never touch main. Never use reset --hard or force options.
2. Honesty: never mark an item done without evidence. Evidence is a file path and line, a test name, or the output of a command you ran. If you cannot verify something, mark it UNVERIFIED and say why.
3. Do not change the behavior of existing functional requirements (FR-1 to FR-6) unless a checklist item is about a defect you found. Say so in the commit message.
4. Overlap with existing plans: the v3.0 backend and the redesign phases are planned separately. If an item is covered by a phase that is not implemented yet, mark it PLANNED with the reference and schedule it after that phase; do not build a second version of the same thing. If the phase is implemented, verify it and mark the item DONE.
5. Dependencies: add a dependency only if the backlog lists it with name, licence, gzipped size for frontend packages, and the reason, and I have approved the backlog. Prefer what the platform already provides.
6. Secrets and accounts: never commit secrets. If an item needs a credential, a domain, a hosting account or a paid service, mark it NEEDS-USER, prepare everything else (config, scripts, documentation), and tell me exactly what I must do.
7. Quality bar for everything you write: no console.log, debugger, TODO or commented-out code left behind; no empty catch blocks; named constants instead of magic numbers; copy that says specifically what a thing does, with no placeholder or generic marketing text; tests that assert behavior, not snapshots written to pass; every new screen has loading, empty and error states.
8. Before every commit that touches code, run tsc -b, eslint ., the full test suite and the production build. Do not commit with failures.

STAGE 1: AUDIT (no code changes)
1. Run the existing tooling and record the results: install, tsc -b, eslint ., tests with coverage, vite build with chunk sizes, npm audit, a secret scan of the working tree and of the git history (gitleaks or an equivalent command), and Lighthouse mobile for each screen if available.
2. Start the app and exercise the main flows yourself: sign up, sign in, add, edit, delete, filter, import, export, autopay, analytics, offline toggle, account deletion. Note what actually happens, including bugs.
3. For every checklist ID assign exactly one status: DONE, PARTIAL, MISSING, NOT-APPLICABLE, PLANNED, UNVERIFIED or NEEDS-USER. Add evidence, and for anything that is not DONE one line on what is missing.
4. Add any item the checklist does not cover but a professional app of this kind would need, using the ID prefix X- and the same fields.
5. Write docs/readiness/AUDIT.md: a summary at the top (counts per status and per category, and the readiness score defined below), then one table per category with the columns ID, Check, Status, Evidence, Gap. Commit with the message docs: readiness audit.

READINESS SCORE
Weight each applicable item by priority: P0 = 4, P1 = 3, P2 = 2, P3 = 1. Score = weighted DONE points divided by weighted applicable points, as a percentage. PARTIAL counts as half. Report the score overall and per category, before and after.

STAGE 2: PRIORITISE
1. Put every item that is not DONE and not NOT-APPLICABLE into docs/readiness/BACKLOG.md, ordered by priority:
   P0 Launch blockers: security holes, data loss or wrong money maths, broken core flows, missing legal minimums (privacy policy, account deletion), no production deployment.
   P1 Needed for a professional product: reliability, testing and CI, UX for core flows, essential documentation, accessibility basics.
   P2 Quality and polish: performance tuning, SEO, onboarding, extra documentation, and the differentiating features DIFF-1 to DIFF-6.
   P3 Minor and optional.
   The checklist gives each item a default priority. You may move an item up or down with a one-line reason.
2. Within one priority level, order by dependencies first, then by risk (what could harm a user most), then by effort.
3. For each backlog entry write: ID, title, priority, effort (S under 1 hour, M a few hours, L more than a day), dependencies, files likely touched, acceptance criteria that can be checked, and how it will be tested.
4. For DIFF-1 to DIFF-6 use the descriptions in section 2 of the checklist file as the starting acceptance criteria and add the edge cases you find.
5. Commit with the message docs: readiness backlog. Then STOP and show me: the score, the number of items per priority, the top 15 backlog items, everything marked NEEDS-USER, and any item where you want a decision from me. Wait for me to reply approved before starting Stage 3.

STAGE 3: BUILD
Work through the backlog in order, one item at a time:
1. Mark the item in progress in BACKLOG.md.
2. Where the item is testable, write or update the tests first and confirm they fail for the right reason.
3. Implement the smallest change that meets the acceptance criteria.
4. Run all checks from ground rule 8. Fix failures. If the same failure survives two attempts, stop and tell me.
5. Update the item's row in AUDIT.md with the new status and evidence, and recompute the score.
6. Commit with the message readiness(<ID>): <summary>.
7. After every P0 item, and after every 5 other items, post a short progress note: items done, current score, next three items.

Stop and ask me before continuing when: an item needs a credential, account, domain or paid service; two reasonable approaches have real trade-offs (describe both and give a recommendation); an item would change the behavior of an existing functional requirement; the gzipped bundle would pass 350 kB; or a change needs a database migration on real user data.

FINISHING
When P0 and P1 are complete, and P2 as far as we agreed, write docs/readiness/FINAL.md with: the score before and after by category, what changed, what remains and why, what needs me, how to deploy and roll back, and a launch checklist of manual checks I must do myself (an external security-headers scan, a real-device test on iOS and Android, a test restore of a backup, a legal review of the privacy policy and terms, domain and email setup). Do not merge into main and do not push. Give me the exact commands for when I am ready.
```

## 4. Checklist legend

Every item below has an ID, a check the agent can verify, and a default priority. Items that only apply once the v3.0 backend exists are marked NOT-APPLICABLE until then.

| Priority | Meaning |
| --- | --- |
| P0 | Launch blocker: security, data loss, wrong money maths, a broken core flow, a legal minimum, or no public deployment |
| P1 | Expected of a professional product: reliability, testing, core-flow UX, essential documentation, accessibility basics |
| P2 | Quality and polish: performance tuning, SEO, onboarding, extra documentation, differentiating features |
| P3 | Minor or optional |

| Status | Meaning |
| --- | --- |
| DONE | Implemented and verified, with evidence |
| PARTIAL | Some of it exists; the gap is written down |
| MISSING | Not implemented |
| NOT-APPLICABLE | Does not apply to this product, with a reason |
| PLANNED | Covered by an unfinished phase of the v3.0 PRD or the redesign spec, with the reference |
| UNVERIFIED | Might be done, but the agent could not confirm it |
| NEEDS-USER | Needs a credential, account, domain, paid service or a decision from the owner |

The legal items are engineering checks, not legal advice. Have the privacy policy and terms reviewed by someone qualified before launch.

## 5. Core behavior and data correctness (CORE)

Wrong numbers destroy trust in a finance app faster than any visual flaw, so most of these are P0 or P1.

| ID | Check | Priority |
| --- | --- | --- |
| CORE-1 | Every functional requirement FR-1.1 to FR-6.3 is implemented and works end to end (audit each one separately) | P0 |
| CORE-2 | Money is stored and summed as integers (paise) or with a decimal-safe method; no floating-point drift in any total | P0 |
| CORE-3 | Amount validation: positive, sensible maximum, at most 2 decimals, rejects NaN, negative values and exponent notation | P0 |
| CORE-4 | Dates use the user's timezone consistently; no off-by-one day around midnight or from UTC conversion | P0 |
| CORE-5 | Month boundaries are correct for 28, 29, 30 and 31 day months, leap years, autopay day 31 and Last Day | P0 |
| CORE-6 | Autopay creates exactly one transaction per plan per month, even with repeated page loads or two devices open | P0 |
| CORE-7 | Forecast and runway handle zero spend, no data, negative balance and a single day of history with no NaN or Infinity on screen | P0 |
| CORE-8 | Transactions can be edited, not only created and deleted, and editing updates totals, charts, budget status and anomaly state | P1 |
| CORE-9 | Deleting a transaction is recoverable (undo or trash) | P1 |
| CORE-10 | Budget status is exact at the boundaries (just below threshold, at threshold, at limit, over limit) | P1 |
| CORE-11 | Anomaly detection handles categories with fewer than 3 items, zero variance and one very large value | P1 |
| CORE-12 | CSV import handles malformed rows, quoted commas, BOM, Windows line endings, wrong headers, duplicate rows and very large files with clear messages and no crash | P1 |
| CORE-13 | Export then import gives identical data (round trip) | P1 |
| CORE-14 | The app stays responsive with 10,000 or more transactions | P1 |
| CORE-15 | Every screen has a first-use state with no data | P1 |
| CORE-16 | Indian number grouping and the rupee sign are used consistently on screens, charts and exports | P2 |
| CORE-17 | Sorting is stable and has a tie-breaker (same date, same amount) | P2 |
| CORE-18 | Search is case-insensitive and safe with special and regex characters | P2 |
| CORE-19 | Categories can be renamed and deleted with reassignment; duplicates and case variants are prevented | P2 |
| CORE-20 | Very long descriptions and category names truncate without breaking layout | P2 |
| CORE-21 | Future-dated transactions behave in a defined way (counted in month totals or not) and that is documented | P2 |
| CORE-22 | Negative and zero balances display correctly in cards, charts and runway | P2 |

## 6. Authentication and accounts (AUTH)

| ID | Check | Priority |
| --- | --- | --- |
| AUTH-1 | Sign in and sign up are separate explicit actions. A mistyped email or password must never silently create a new account (the v2.0 PRD says new accounts are created automatically; verify how this behaves) | P0 |
| AUTH-2 | Account deletion removes all user data (database rows, local caches, queued writes, the auth user) and tells the user what was removed | P0 |
| AUTH-3 | Signing out, or switching users on a shared device, leaves no previous user's data in memory, local storage, IndexedDB or the offline queue | P0 |
| AUTH-4 | Email verification after sign-up, with a resend option | P1 |
| AUTH-5 | Password rules with strength feedback; common passwords rejected | P1 |
| AUTH-6 | Error messages do not reveal whether an email is registered | P1 |
| AUTH-7 | Repeated failed sign-ins are rate limited or locked out (confirm what the auth provider already does) | P1 |
| AUTH-8 | Password reset works end to end, links expire, and the email is clearly branded and understandable | P1 |
| AUTH-9 | Session handling: token refresh, expiry, sign out from the profile, and a clear message when the session has expired | P1 |
| AUTH-10 | Sensitive actions (change password, delete account) ask the user to sign in again first | P1 |
| AUTH-11 | Google sign-in handles blocked popups and an email that already has a password account | P1 |
| AUTH-12 | Protected routes redirect to sign-in and return to the intended page afterwards | P2 |
| AUTH-13 | Profile shows last sign-in and sign-in method | P3 |
| AUTH-14 | Optional two-factor authentication | P3 |

## 7. Backend, API and database (BE)

These apply once the v3.0 backend exists. Before that, the audit marks them PLANNED and checks the Firestore equivalent where one exists (for example rules in place of query scoping).

| ID | Check | Priority |
| --- | --- | --- |
| BE-1 | Server-side validation on every endpoint; client validation is never the only check | P0 |
| BE-2 | Consistent error format and correct HTTP status codes; no stack traces or internal messages sent to clients | P0 |
| BE-3 | Every query is scoped to the authenticated user, with tests proving user B cannot read or change user A's data on every endpoint | P0 |
| BE-4 | Database constraints (NOT NULL, CHECK, UNIQUE, foreign keys) enforce the rules, not only application code | P0 |
| BE-5 | Multi-step writes run inside a database transaction | P0 |
| BE-6 | Migrations are versioned and repeatable, and have been run on an empty database and on a copy of production-like data | P0 |
| BE-7 | Rate limiting per user and per IP | P0 |
| BE-8 | CORS uses an allowlist of origins, not a wildcard | P0 |
| BE-9 | Every list endpoint is paginated with a maximum page size | P1 |
| BE-10 | Create operations accept an idempotency key so a retry cannot duplicate data | P1 |
| BE-11 | Indexes exist for the columns used in filtering and sorting; slow queries have been checked | P1 |
| BE-12 | Connection pool size and query and request timeouts are configured | P1 |
| BE-13 | Request body size limits are set | P1 |
| BE-14 | Background jobs are idempotent, retried on failure and monitored | P1 |
| BE-15 | The API is versioned (/api/v1) and documented with OpenAPI | P1 |
| BE-16 | Liveness and readiness endpoints exist and the readiness check touches the database | P1 |
| BE-17 | Audit fields (created, updated) use the server clock in UTC, never the client's | P1 |
| BE-18 | Soft-delete and retention rules are defined, with a purge job | P2 |
| BE-19 | Graceful shutdown finishes in-flight requests before exiting | P2 |
| BE-20 | A seed script creates realistic sample data for development and demos | P2 |
| BE-21 | A policy for backward-compatible API changes is written down | P3 |

## 8. Security and privacy (SEC)

| ID | Check | Priority |
| --- | --- | --- |
| SEC-1 | No secrets in the repository or its git history (scan the working tree and the history) | P0 |
| SEC-2 | A .env.example is committed, real env files are git-ignored, and required variables are validated at startup | P0 |
| SEC-3 | HTTPS is enforced everywhere, with HSTS | P0 |
| SEC-4 | Security headers: Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, Permissions-Policy and frame-ancestors | P0 |
| SEC-5 | No unescaped user content rendered as HTML; no dangerouslySetInnerHTML with user data | P0 |
| SEC-6 | CSV export neutralises formula injection (cells starting with =, +, - or @) | P0 |
| SEC-7 | Database rules or query scoping tested with negative tests (another user's id, missing auth, tampered ids) | P0 |
| SEC-8 | No sensitive data in logs, URLs or analytics; tokens are not kept in localStorage where avoidable | P0 |
| SEC-9 | A privacy policy states accurately what is stored, where, for how long, and how to delete it | P0 |
| SEC-10 | Dependency audit has no high or critical findings, and automated update PRs are enabled | P1 |
| SEC-11 | Firebase API key restrictions and authorised domains are configured | P1 |
| SEC-12 | Every input field has a length limit, enforced on the server as well | P1 |
| SEC-13 | CSV import is size and type limited and parsed so a huge file cannot freeze the tab | P1 |
| SEC-14 | Every third-party request is listed; scripts and styles are self-hosted or pinned with integrity hashes | P1 |
| SEC-15 | Users can export all their data in a machine-readable format | P1 |
| SEC-16 | Cookie and browser storage use is disclosed; nothing non-essential is stored without consent | P1 |
| SEC-17 | Authentication does not rely on cookies, or cookies use Secure, HttpOnly and SameSite, and CSRF has been considered | P1 |
| SEC-18 | Check obligations under India's Digital Personal Data Protection Act, 2023 and its rules (notice, consent, purpose, deletion) and record the result | P1 |
| SEC-19 | Bot protection on sign-up (App Check, CAPTCHA or equivalent) | P2 |
| SEC-20 | A one-page threat model lists assets, entry points and mitigations | P2 |
| SEC-21 | A security.txt file with a contact address | P3 |
| SEC-22 | A documented procedure for rotating secrets and keys | P3 |

## 9. Frontend, UX and accessibility (UX)

The visual design itself is covered by the redesign spec; these items check behavior, states and access.

| ID | Check | Priority |
| --- | --- | --- |
| UX-1 | Every screen has loading, empty, error and success states | P1 |
| UX-2 | Forms have visible labels, inline validation, keep the user's input after an error, and block double submission | P1 |
| UX-3 | An error boundary stops one broken component from blanking the app, with a friendly fallback and a reload action | P1 |
| UX-4 | A 404 page and unknown-route handling exist, and an offline page where relevant | P1 |
| UX-5 | Destructive actions ask for confirmation or offer undo | P1 |
| UX-6 | Layout works at 360, 390, 768, 1024 and 1440 px with no horizontal scroll | P1 |
| UX-7 | Touch targets are at least 44 px and nothing depends on hover alone | P1 |
| UX-8 | Everything is keyboard operable, with visible focus and a skip-to-content link | P1 |
| UX-9 | WCAG 2.2 AA: contrast, labels, roles, live regions for toasts and dynamic content | P1 |
| UX-10 | Checked in Chrome, Safari on iOS, Firefox and Edge | P1 |
| UX-11 | Design tokens and one icon set are used consistently, with no hard-coded colours (from the redesign spec) | P1 |
| UX-12 | Browser back, forward and deep links work, and filters, month and page are reflected in the URL | P2 |
| UX-13 | Each route has a distinct page title and heading structure, and focus moves sensibly on route change | P2 |
| UX-14 | Reduced-motion preference is respected | P2 |
| UX-15 | Toasts are dismissible, limited in number and announced to screen readers | P2 |
| UX-16 | A first-run onboarding path: set a budget, add a first transaction, create a first autopay plan; optionally a demo mode with sample data | P2 |
| UX-17 | Microcopy is specific and consistent, with no placeholder text or generic marketing phrases | P2 |
| UX-18 | Complex metrics (Z-score, 7-day SMA, runway, confidence) have plain-language explanations in the interface | P2 |
| UX-19 | Inputs use appropriate mobile keyboards (inputmode, type) | P2 |
| UX-20 | A warning appears before leaving a form with unsaved changes | P2 |
| UX-21 | The last-used filters, sort and category are remembered | P3 |
| UX-22 | Keyboard shortcuts are listed in a help dialog | P3 |
| UX-23 | Dark theme | P3 |
| UX-24 | A print stylesheet for reports | P3 |

## 10. Performance, offline and PWA (PERF)

| ID | Check | Priority |
| --- | --- | --- |
| PERF-1 | Lighthouse mobile on a production build: Performance 90 or higher, Accessibility 95 or higher, Best Practices 95 or higher, SEO 90 or higher | P1 |
| PERF-2 | Initial JavaScript is under 350 kB gzipped, with route-level code splitting and lazy-loaded charts | P1 |
| PERF-3 | Core Web Vitals: LCP under 2.5 s, CLS at or below 0.05, INP under 200 ms | P1 |
| PERF-4 | Long lists are paginated or virtualised, and search input is debounced | P1 |
| PERF-5 | Static assets are hashed and cached for a long time, HTML is not cached, and gzip or brotli is on | P1 |
| PERF-6 | The offline write queue is persisted (IndexedDB), retried with backoff, and has a defined conflict rule | P1 |
| PERF-7 | Fonts are WOFF2, subset and preloaded; images are optimised and sized | P2 |
| PERF-8 | No unnecessary re-renders while typing in forms and filters (measured, not guessed) | P2 |
| PERF-9 | A service worker caches the app shell so the app opens offline, and a web app manifest makes it installable | P2 |
| PERF-10 | A visible offline and online indicator | P2 |
| PERF-11 | Event listeners, timers and subscriptions are cleaned up (no memory growth over a long session) | P2 |
| PERF-12 | Third-party requests are zero, or each one is justified | P2 |
| PERF-13 | API responses are compressed, and ETag or similar is used where it helps | P2 |
| PERF-14 | Manifest has maskable icons and a splash configuration | P3 |
| PERF-15 | Likely next routes are prefetched | P3 |

## 11. Testing and code quality (QA)

| ID | Check | Priority |
| --- | --- | --- |
| QA-1 | TypeScript strict with zero errors; any use of any has a comment explaining it | P0 |
| QA-2 | Unit tests cover all pure logic including the edge cases in the CORE section | P0 |
| QA-3 | API integration tests run against a real database | P0 |
| QA-4 | ESLint and Prettier are configured with zero errors, and a pre-commit hook runs them on changed files | P1 |
| QA-5 | Component tests cover forms, dropdowns, dialogs and the sync queue | P1 |
| QA-6 | End-to-end tests cover the critical journeys: sign up, add transaction, autopay, import, export, delete account | P1 |
| QA-7 | Tests are deterministic: fake clock, no real network, no order dependence | P1 |
| QA-8 | No console.log, debugger, TODO, FIXME or commented-out code in the source | P1 |
| QA-9 | No empty catch blocks; errors are typed, handled and logged | P1 |
| QA-10 | Automated accessibility checks (axe) run in CI | P2 |
| QA-11 | Coverage thresholds are enforced in CI | P2 |
| QA-12 | Money and date maths have randomised or property-based tests | P2 |
| QA-13 | A basic load test of the API (for example 50 concurrent users) with the results recorded | P2 |
| QA-14 | No unused dependencies or dead files (check with depcheck or knip) | P2 |
| QA-15 | Consistent structure and naming, one component per file, and named constants instead of magic numbers | P2 |
| QA-16 | The bundle analyzer report has been reviewed and large dependencies justified | P2 |
| QA-17 | Screenshot comparison for the main screens | P3 |
| QA-18 | A manual QA script and a bug log are kept in the repo | P3 |

## 12. DevOps, hosting and operations (OPS)

Items that need a hosting account, domain or paid service are marked NEEDS-USER by the agent, which prepares the configuration and tells you the steps.

| ID | Check | Priority |
| --- | --- | --- |
| OPS-1 | The app is live on a public HTTPS URL | P0 |
| OPS-2 | Staging and production are separate, with separate databases and keys | P0 |
| OPS-3 | CI runs on every pull request: install, lint, type check, tests, build and dependency audit | P0 |
| OPS-4 | Database backups are automatic, retention is set, and a restore has been rehearsed | P0 |
| OPS-5 | If data is moving from Firestore, the migration has a dry run, a parity report with zero differences, and a rollback plan | P0 |
| OPS-6 | Deployments are automatic to staging and approved by hand to production, with a written rollback procedure | P1 |
| OPS-7 | Environment variables are documented and validated at startup, so a missing one fails fast | P1 |
| OPS-8 | Structured logs carry a request ID and no personal data | P1 |
| OPS-9 | Error tracking with an alert, or logs reviewed on a schedule if no third-party tool is used | P1 |
| OPS-10 | Uptime monitoring with an alert | P1 |
| OPS-11 | A runbook covers deploy, rollback, restore, rotating secrets and debugging a failed job | P1 |
| OPS-12 | A custom domain with DNS set up and www and non-www redirected | P2 |
| OPS-13 | Metrics for request rate, latency, error rate and job success | P2 |
| OPS-14 | A Dockerfile and docker-compose file make local setup reproducible | P2 |
| OPS-15 | Dependency updates are automated | P2 |
| OPS-16 | Releases are tagged and a CHANGELOG is kept | P2 |
| OPS-17 | Free-tier limits of each service are known, and usage alerts are set | P2 |
| OPS-18 | Cold-start behavior of the hosting is measured and handled in the interface | P2 |
| OPS-19 | Branch protection and a pull request template | P3 |
| OPS-20 | A simple status page or status endpoint | P3 |
| OPS-21 | Recovery point and recovery time targets are written down | P3 |

## 13. Web presence, legal and documentation (WEB)

| ID | Check | Priority |
| --- | --- | --- |
| WEB-1 | README with what the product is, screenshots, features, tech stack, architecture diagram, setup, environment variables, scripts, tests, deployment and roadmap | P0 |
| WEB-2 | Privacy Policy page, linked from sign-up and the footer | P0 |
| WEB-3 | A public landing page that explains the product, its privacy stance and shows screenshots, with a sign-in link | P1 |
| WEB-4 | Terms of Use page | P1 |
| WEB-5 | A contact address and an in-app way to send feedback | P1 |
| WEB-6 | A disclaimer that the app is not financial advice and that forecasts are estimates | P1 |
| WEB-7 | A LICENSE file | P1 |
| WEB-8 | API documentation published from the OpenAPI file | P1 |
| WEB-9 | Page titles, meta descriptions, canonical URLs, Open Graph and Twitter card images on public pages | P2 |
| WEB-10 | robots.txt and sitemap.xml for public pages, and noindex on the signed-in app screens | P2 |
| WEB-11 | Favicon set, apple-touch-icon and theme-color | P2 |
| WEB-12 | A Help or FAQ page explaining autopay, anomalies, forecasts and runway in plain language | P2 |
| WEB-13 | An architecture document and short decision records for the major choices | P2 |
| WEB-14 | A demo account or demo mode, and a short demo recording | P2 |
| WEB-15 | A cookie and storage notice if anything non-essential is stored | P2 |
| WEB-16 | An About page with the project's purpose and stack | P3 |
| WEB-17 | A What's new or changelog page | P3 |
| WEB-18 | CONTRIBUTING and CODE\_OF\_CONDUCT files if the repository is public and open to contributions | P3 |
| WEB-19 | JSON-LD structured data (SoftwareApplication) on the landing page | P3 |
| WEB-20 | An accessibility statement | P3 |

## 14. Differentiating features (DIFF)

The full description of each feature is in section 2. The audit checks whether it exists; the build stage uses section 2 as the starting acceptance criteria.

| ID | Check | Priority |
| --- | --- | --- |
| DIFF-1 | Safe to spend today is shown on the Dashboard and matches the formula in section 2, including remaining expense autopay | P2 |
| DIFF-2 | Bank statement import has column mapping with saved templates, a preview with duplicates and uncategorised rows, and merchant rules that learn from corrections | P2 |
| DIFF-3 | Recurring charge detection suggests autopay plans and flags price changes and missed renewals | P2 |
| DIFF-4 | Insights and month-end projection are shown with a Show calculation link for each statement | P2 |
| DIFF-5 | Trash with 30-day restore and an activity history with undo of a whole import batch | P2 |
| DIFF-6 | Passphrase-encrypted backup and restore using Web Crypto | P2 |
| DIFF-7 | Per-category budgets with threshold warnings | P3 |
| DIFF-8 | Savings goals with progress and required monthly saving | P3 |
| DIFF-9 | Opt-in weekly summary email | P3 |
