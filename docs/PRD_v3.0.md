# MoneyTracker PRD v3.0 — Full-Stack

Nov 1, 2026 · @Dhruv

## 1. Executive summary

v3.0 replaces Firestore as the data layer with an owned backend: a REST API on Node.js and a PostgreSQL database. Business rules, scheduling and data move from the browser to the server. The React 19 client, its UI and Firebase Authentication stay.

In v2.0 the autopay engine runs only when the user opens the app, analytics read every transaction into the browser, and Firestore rules are the only access control. v3.0 fixes these by running the rules, jobs and aggregations on a server the project controls.

| Item | Value |
| --- | --- |
| Document | MoneyTracker PRD v3.0 (supersedes v2.0) |
| Status | Draft |
| Scope | Backend API, database, scheduler, sync protocol, migration, deployment |
| Unchanged | UI and layout, React 19 + TypeScript strict, Tailwind, Chart.js, Firebase Auth, all v2.0 functional behavior (FR-1 to FR-6) |
| Changed | Data storage, business-logic location, autopay execution, analytics computation, offline sync, money representation |

## 2. Current state and gaps

v2.0 is a complete client-side product, but eight properties of its design block a production full-stack release.

| # | Gap in v2.0 | Consequence | v3.0 resolution |
| --- | --- | --- | --- |
| 1 | Autopay runs only on app load (FR-4.3) | Plans are missed if the app is not opened; two devices can create duplicates | Server scheduler with a database uniqueness guarantee |
| 2 | Business rules live only in the browser | Anyone with the Firebase SDK can write invalid data | Server validates every write with shared schemas |
| 3 | Analytics are computed in the browser from all transactions | Slows down as history grows | SQL aggregation endpoints |
| 4 | Firestore rules are the only access control | No rate limiting, no audit, no request validation | API layer with auth, validation, rate limits |
| 5 | Offline queue depends on Firestore SDK persistence | Conflict behavior is not controllable or testable | Explicit sync protocol (section 10) |
| 6 | Amounts are JavaScript numbers | Floating-point rounding in sums | Integer paise in the database and API |
| 7 | Export and backup are client-side only | No server-side backup or restore | Server export and scheduled database backups |
| 8 | No logs or metrics | Failures are invisible | Structured logs, job metrics, health endpoints |

## 3. Goals, non-goals and success metrics

The release succeeds if every v2.0 feature works unchanged on top of a server-owned data layer, with autopay running without the app open.

**Goals**

1. Persist all data in PostgreSQL behind an API the project owns.
2. Keep every v2.0 feature and the UI identical.
3. Run autopay on schedule, exactly once per plan per month, with no client open.
4. Remove rounding error from money by storing integer paise.
5. Migrate existing Firestore users without data loss.

**Non-goals**

- UI redesign (a separate effort after this release).
- Multi-currency, split transactions, receipt attachments and PWA push (roadmap items; the schema leaves room for them).
- Bank or open-banking integrations.
- Shared or household accounts.
- Native mobile apps.

**Success metrics**

| Metric | Target |
| --- | --- |
| p95 latency, CRUD and list endpoints (10,000 transactions per user) | < 300 ms |
| p95 latency, analytics endpoints (10,000 transactions per user) | < 500 ms |
| Due autopay plans processed within 15 minutes of becoming due | 100% |
| Duplicate autopay transactions over three simulated months | 0 |
| Migration parity (record counts and amount sums per user) | 0 differences |
| Test coverage | 100% on shared logic (unchanged), at least 80% line coverage on the API |
| Monthly API availability | 99.5% |

## 4. Target architecture

The browser keeps the UI and local state, the API owns validation, rules and jobs, and PostgreSQL owns the data.

The client signs in with Firebase and sends the ID token with each request. The API verifies it, validates input, applies rules and reads or writes PostgreSQL. The job runner creates autopay transactions with no client open. Both apps import the same schemas and calculation functions from packages/shared.

## 5. Technology stack

The client stack is unchanged; new choices are limited to the API, database and tooling, and all of them stay in TypeScript.

| Layer | Choice | Reason |
| --- | --- | --- |
| Repository | Monorepo with npm workspaces: apps/web, apps/api, packages/shared | One repo; client and server share types and rules |
| Client | React 19, TypeScript 5.9, Vite, Tailwind 3.4.17, Chart.js 4.5.1 | Unchanged from v2.0 |
| API runtime | Node.js (current LTS), TypeScript strict | Same language as the client, so logic can be shared |
| API framework | Express 5 | Small, widely documented |
| Validation | Zod, with schemas in packages/shared | One schema validates the client form and the API request; types are inferred |
| Database | PostgreSQL 16 or later | Relational constraints, transactions, SQL aggregation |
| ORM and migrations | Prisma | Typed queries, versioned migrations |
| Authentication | Firebase Auth kept; API verifies ID tokens with firebase-admin | No rewrite of email login, Google sign-in or password reset |
| Background jobs | pg-boss | Queue and cron on Postgres; no Redis needed |
| Logging | pino (JSON logs) | Structured, low overhead |
| Testing | Vitest, Supertest, Testcontainers (Postgres), Playwright | Unit, API integration, real-database tests, end-to-end |
| CI/CD | GitHub Actions | Runs lint, types, tests, build, deploy |
| Hosting (default) | Web on Vercel, API on Render, database on Neon | Managed free or low-cost tiers; see open decisions |

## 6. Backend functional requirements

Each v2.0 requirement keeps its behavior; the requirements below say what the server now owns. IDs use the prefix BE.

### Module A: Authentication and identity

| ID | Requirement |
| --- | --- |
| BE-1.1 | Every request except health checks carries a Firebase ID token; the API verifies signature, expiry and audience and returns 401 otherwise. |
| BE-1.2 | On the first valid request from an unknown Firebase uid, the API creates the user row (default timezone Asia/Kolkata). |
| BE-1.3 | GET and PATCH on the profile: read registration metadata and auth method; update display name and timezone. |
| BE-1.4 | Account deletion removes all of the user's rows in one database transaction, then deletes the Firebase user. |

### Module B: Transactions and data portability

| ID | Requirement |
| --- | --- |
| BE-2.1 | Create, update, delete transactions. The server validates: amount is a positive integer in paise, type and payment method are in their enums, date is a real YYYY-MM-DD. |
| BE-2.2 | Search, type filter, month filter, sort (date, amount, category) and pagination run in SQL. Default page size 10, maximum 100. |
| BE-2.3 | Custom categories are stored per user and type. Deleting a category used by a transaction is rejected with 409. |
| BE-2.4 | Import: the client parses the CSV and posts rows in batches of up to 1,000. The server deduplicates on a hash of date, type, category, amount, payment method and description, and returns imported and skipped counts. |
| BE-2.5 | Export: the server streams CSV (RFC 4180, quotes escaped) or a JSON backup of transactions and categories, honoring the active filters. |

### Module C: Autopay

| ID | Requirement |
| --- | --- |
| BE-3.1 | Create, update, pause, resume and delete recurring plans. Day is 1 to 31, where 31 means the last day of the month. |
| BE-3.2 | A scheduled job creates the month's transaction for each due active plan, tagged [Autopay] or [Recurring Income] (section 11). |
| BE-3.3 | Each plan produces at most one transaction per month, enforced by a unique database index. |
| BE-3.4 | The upcoming-agenda endpoint returns remaining plans for the current month with days until deduction. |
| BE-3.5 | The monthly flow projection (net scheduled income minus expense) is returned with the plan list. |

### Module D: Budget and dashboard

| ID | Requirement |
| --- | --- |
| BE-4.1 | Read and update the monthly expense limit and threshold percentage (default 80). |
| BE-4.2 | One summary call returns month income, month expenses, balance, budget percentage used and status (good, warning, danger), the last 7 days of income and expense, and the 5 most recent transactions. |

### Module E: Analytics and anomalies

| ID | Requirement |
| --- | --- |
| BE-5.1 | Aggregations by preset (this week, this month, last 30 days) and by granularity (overall, monthly, yearly). |
| BE-5.2 | Daily expense series, category breakdown with percentages, and weekday totals are produced by SQL. |
| BE-5.3 | The 7-day SMA forecast and its confidence score (from coefficient of variation) are computed with the shared pure functions on the server. |
| BE-5.4 | Money runway (days, daily burn rate percentage, estimated depletion date) is computed with the shared pure functions on the server. |
| BE-5.5 | On every expense write, the server computes the category z-score (categories with at least 3 prior transactions) and sets the transaction's anomaly state to flagged when z is above 2.0. |
| BE-5.6 | Approve sets the state to approved and suppresses future alerts for it; dismiss deletes the transaction. |

### Module F: Platform

| ID | Requirement |
| --- | --- |
| BE-6.1 | Health endpoints: liveness and readiness (database reachable). |
| BE-6.2 | One error format on every endpoint (section 7). |
| BE-6.3 | Every request gets a request ID, returned in a header and written to logs. |
| BE-6.4 | Rate limits per section 9. |
| BE-6.5 | An OpenAPI document is generated from the Zod schemas. |

## 7. REST API specification

The API is versioned under /api/v1, speaks JSON, and authenticates with a Firebase ID token in the Authorization header.

**Conventions**

1. Amounts are integers in paise; the client converts to and from rupees with shared helpers.
2. Resource IDs are UUIDs generated by the client, so offline-created records keep their ID.
3. Mutating requests accept an Idempotency-Key header; a repeated key returns the stored response.
4. List responses: items, total, page, pageSize. Query parameters: page, pageSize.
5. Error body on every failure: error with code, message, optional details, and requestId. Status codes: 400 validation, 401 auth, 404 not found, 409 conflict, 429 rate limit, 500 server.

**Endpoints**

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /healthz, /readyz | Liveness, readiness (no auth) |
| GET, PATCH, DELETE | /me | Profile, update profile, delete account |
| GET | /transactions | List with search, type, month, sort, page, pageSize |
| POST | /transactions | Create |
| PATCH, DELETE | /transactions/:id | Update, delete |
| POST | /transactions/import | Batch import with deduplication |
| GET | /transactions/export | CSV or JSON, same filters as the list |
| GET, POST | /categories | List, create |
| PATCH, DELETE | /categories/:id | Rename, delete (409 if in use) |
| GET, POST | /autopay | List with monthly flow, create |
| PATCH, DELETE | /autopay/:id | Update or pause/resume, delete |
| GET | /autopay/upcoming | Remaining plans this month |
| GET, PUT | /budget | Read, replace budget goal |
| GET | /dashboard/summary | Cards, budget status, weekly chart, recent five |
| GET | /analytics/overview | Daily series, category breakdown by preset and period |
| GET | /analytics/forecast | 7-day SMA forecast and confidence |
| GET | /analytics/runway | Days left, burn rate, depletion date |
| GET | /analytics/weekday | Weekday totals |
| GET | /anomalies | Flagged transactions |
| POST | /anomalies/:id/approve | Mark legitimate (dismiss uses DELETE /transactions/:id) |
| GET | /sync/changes | Records changed since a timestamp, including deletions |

## 8. Database design

PostgreSQL stores five tables plus an idempotency table. Money is an integer number of paise, never a float.

```sql
CREATE TYPE txn_type AS ENUM ('income', 'expense');
CREATE TYPE pay_method AS ENUM ('cash','credit_card','debit_card','upi','net_banking','bank_transfer');
CREATE TYPE anomaly_state AS ENUM ('none', 'flagged', 'approved');

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid  text NOT NULL UNIQUE,
  email         text,
  display_name  text,
  auth_method   text NOT NULL,
  timezone      text NOT NULL DEFAULT 'Asia/Kolkata',
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_sign_in  timestamptz
);

CREATE TABLE categories (
  id       uuid PRIMARY KEY,
  user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type     txn_type NOT NULL,
  name     text NOT NULL,
  UNIQUE (user_id, type, name)
);

CREATE TABLE autopay_plans (
  id                    uuid PRIMARY KEY,
  user_id               uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  type                  txn_type NOT NULL,
  amount_paise          bigint NOT NULL CHECK (amount_paise > 0),
  currency              char(3) NOT NULL DEFAULT 'INR',
  category              text NOT NULL,
  day                   smallint NOT NULL CHECK (day BETWEEN 1 AND 31), -- 31 = last day
  description           text,
  active                boolean NOT NULL DEFAULT true,
  last_processed_month  char(7),                                        -- 'YYYY-MM'
  legacy_id             text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz
);

CREATE TABLE transactions (
  id              uuid PRIMARY KEY,                                     -- client-generated
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            txn_type NOT NULL,
  amount_paise    bigint NOT NULL CHECK (amount_paise > 0),
  currency        char(3) NOT NULL DEFAULT 'INR',
  category        text NOT NULL,
  payment_method  pay_method NOT NULL,
  description     text,
  txn_date        date NOT NULL,
  anomaly         anomaly_state NOT NULL DEFAULT 'none',
  anomaly_z       numeric(6,2),
  autopay_id      uuid REFERENCES autopay_plans(id) ON DELETE SET NULL,
  autopay_period  char(7),                                              -- 'YYYY-MM'
  import_hash     text,
  legacy_id       text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

CREATE UNIQUE INDEX uq_txn_autopay_period ON transactions (autopay_id, autopay_period)
  WHERE autopay_id IS NOT NULL;
CREATE UNIQUE INDEX uq_txn_import_hash ON transactions (user_id, import_hash)
  WHERE import_hash IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX uq_txn_legacy ON transactions (user_id, legacy_id)
  WHERE legacy_id IS NOT NULL;
CREATE INDEX ix_txn_user_date ON transactions (user_id, txn_date DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX ix_txn_user_cat ON transactions (user_id, type, category)
  WHERE deleted_at IS NULL;
CREATE INDEX ix_txn_user_updated ON transactions (user_id, updated_at);

CREATE TABLE budget_goals (
  user_id                      uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  monthly_expense_limit_paise  bigint NOT NULL CHECK (monthly_expense_limit_paise >= 0),
  threshold_percent            smallint NOT NULL DEFAULT 80 CHECK (threshold_percent BETWEEN 1 AND 100),
  updated_at                   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE idempotency_keys (
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key              text NOT NULL,
  request_hash     text NOT NULL,
  response_status  smallint NOT NULL,
  response_body    jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);
```

**Rules**

1. Every repository function takes the user ID as a required argument; no query reads or writes without a user_id filter.
2. Deletes on transactions, autopay plans and categories are soft (deleted_at) so sync can send deletions to other devices. A daily job purges rows deleted more than 90 days ago.
3. A user-deleted autopay transaction stays soft-deleted, so the unique index prevents the job from recreating it for that month.
4. legacy_id holds the Firestore document ID for migrated records and makes the migration script safe to rerun.
5. The currency column is fixed to INR in v3.0 and exists so multi-currency (roadmap) needs no table rewrite.
6. Dates are stored as DATE in the user's timezone; timestamps are timestamptz in UTC.

## 9. Authentication, authorization and security

The user identity comes only from the verified Firebase token; no other input can select whose data is read or written.

| ID | Requirement |
| --- | --- |
| SEC-1 | All routes except /healthz and /readyz require a valid Firebase ID token. Token revocation is checked on DELETE /me and PATCH /me. |
| SEC-2 | The user ID is derived from the token and never from the body, query or path. Repositories require it as an argument. |
| SEC-3 | Zod validates body, query and params on every route; unknown fields are rejected. Body limit 1 MB, 5 MB for import. |
| SEC-4 | HTTPS only, HSTS and standard security headers (helmet), CORS allowlist limited to the web app's origins. |
| SEC-5 | Rate limits per user: 100 requests per minute general, 10 per minute for import and export, 5 per hour for DELETE /me. Unauthenticated routes are limited per IP. |
| SEC-6 | Secrets live only in host environment variables. The repository holds a .env.example and CI runs secret scanning. |
| SEC-7 | Queries are parameterized through Prisma; any raw SQL uses tagged templates. |
| SEC-8 | Logs contain request ID, route, status and duration only. Amounts, descriptions and tokens are never logged. |
| SEC-9 | TLS in transit; the managed database encrypts data and backups at rest. |
| SEC-10 | Account deletion removes all user rows in one transaction and deletes the Firebase user. Backups containing the user expire within 30 days. |
| SEC-11 | npm audit runs in CI and Dependabot is enabled. |
| SEC-12 | No third-party analytics or trackers, keeping the v2.0 privacy principle. |

## 10. Offline sync and conflict resolution

v2.0 relied on Firestore's built-in offline persistence. v3.0 replaces it with an explicit protocol: queue writes locally, replay them with idempotency keys, resolve conflicts by last write wins.

| ID | Requirement |
| --- | --- |
| SYNC-1 | The client generates record UUIDs, so a record created offline keeps the same ID on the server. |
| SYNC-2 | Writes apply to local state immediately (optimistic update, as in v2.0) and are appended to a queue stored in IndexedDB. Each entry holds an operation ID, method, path, body and creation time. |
| SYNC-3 | On reconnection the queue is sent in order. Each request carries the operation ID as Idempotency-Key, so a replay after a dropped connection does not duplicate the write. |
| SYNC-4 | Conflict rule: the most recent server-side updated_at wins per record. A delete wins over an edit. |
| SYNC-5 | Retry: network errors and 5xx responses retry with exponential backoff from 1 s to 60 s. Other 4xx responses (except 429) remove the entry and show an error toast. |
| SYNC-6 | After the queue drains, and on window focus and every 60 seconds while online, the client calls GET /sync/changes with its last cursor and merges the result, including deletions. |
| SYNC-7 | The queue survives page reloads. At 500 queued operations the client blocks new writes and shows a warning toast. |
| SYNC-8 | The existing online/offline toasts (FR-6.3) are kept. |

Firestore pushed live updates; v3.0 pulls on focus and on a 60-second interval. Real-time push (SSE or WebSocket) is listed in open decisions.

## 11. Server-side jobs and calculations

Autopay is the only time-driven job; anomaly detection, forecast and runway run when data is written or requested.

| Job | Trigger | Logic | Duplicate protection |
| --- | --- | --- | --- |
| autopay-process | pg-boss schedule, every 15 minutes | Select active plans where the current date in the user's timezone is on or after the plan's day for the month (day 31 and short months clamp to the last day) and last_processed_month is not the current month. Lock rows with FOR UPDATE SKIP LOCKED. Insert the transaction tagged [Autopay] or [Recurring Income] and set last_processed_month, in one database transaction. | Unique index on (autopay_id, autopay_period); a second worker or a rerun inserts nothing |
| anomaly-check | On every expense create or update, in the same request | Mean and standard deviation of prior transactions in the same category and type, for categories with at least 3. Flag when z is above 2.0. The calculation is the existing src/lib function moved to packages/shared, so its definition is unchanged. | Pure function; rerun gives the same result |
| forecast | On GET /analytics/forecast | Daily expense totals from SQL, gaps filled with zero days, 7-day SMA, projection for the next 7 days, confidence from coefficient of variation | None needed (read only) |
| runway | On GET /analytics/runway | Days = floor(balance / average daily spend), burn rate percentage, depletion date | None needed (read only) |
| tombstone-purge | Daily | Hard-delete rows with deleted_at older than 90 days | Safe to rerun |
| idempotency-cleanup | Daily | Delete idempotency keys older than 7 days | Safe to rerun |

**Failure handling**

1. A failed job retries up to 3 times with backoff.
2. After the final failure the error is logged with the job name and plan ID, and the next scheduled run picks the plan up again.
3. If the API was down at the scheduled time, the next run processes every plan that is due, so no day-of-month is skipped within the same month.

## 12. Frontend changes

The client changes only where it fetched or computed data. No visual or layout change is in scope.

1. Add a typed API client in src/services that attaches the Firebase ID token to each request. Components still never call fetch or an SDK directly.
2. Remove Firestore from the web bundle. Firebase Auth stays in src/services.
3. Context providers (auth, transactions, autopay, budget) load from the API and from /sync/changes instead of Firestore listeners.
4. Move src/lib into packages/shared. Both the web app and the API import it, and the 100% unit-test coverage requirement stays.
5. Convert between rupees and paise only at the API boundary with shared helpers; the UI keeps the ₹XX,XXX format.
6. Remove autopay processing on app load (FR-4.3). The client only displays transactions the server created.
7. The anomaly banner reads the flagged state from the API. Approve calls the approve endpoint; Dismiss deletes the transaction.
8. Analytics screens call the /analytics endpoints. The Chart.js components and their props stay the same.
9. Add an IndexedDB-backed operation queue in src/services for SYNC-2 to SYNC-7.
10. Show network loading and error states with the existing spinners and toasts, since the API can be slower than Firestore's local cache.
11. Configuration: add VITE_API_BASE_URL; remove the Firestore configuration.

## 13. Non-functional requirements

The v2.0 client targets (load under 1.2 s on 4G, bundle under 350 kB gzipped, 60 fps charts, pure functions under 10 ms for 10,000 transactions) still apply. v3.0 adds the following.

| Area | Requirement |
| --- | --- |
| Latency | p95 under 300 ms for CRUD and list endpoints and under 500 ms for analytics endpoints, at 10,000 transactions per user |
| Pagination | Default 10 items, maximum 100; no endpoint returns an unbounded list |
| Availability | 99.5% monthly for the API; the client keeps working from its local state and queue when the API is unreachable |
| Cold start | If the host sleeps idle instances, the first request may be slow; the client shows a loading state and does not treat it as an error until a 15 s timeout |
| Data safety | Daily automated database backups kept 14 days; a restore is rehearsed once per quarter; queued writes persist in IndexedDB until acknowledged |
| Integrity | Constraints (CHECK, UNIQUE, foreign keys) in the database are the final guard; the API is not the only one |
| Scalability | API is stateless and can run as multiple instances; database pool of at most 10 connections per instance; the job uses row locks so instances do not conflict |
| Observability | JSON logs with request ID; metrics for request count, latency and error rate; a counter for job runs and failures; an alert on a failed autopay run |
| Maintainability | TypeScript strict in all packages, ESLint with zero errors, OpenAPI generated from schemas |
| Compatibility | Same browser matrix as v2.0: Chrome 110+, Safari 16+, Firefox 115+, Edge 110+ |

## 14. DevOps and deployment

One repository, three environments, and a pipeline that must pass before anything reaches production.

**Repository layout**

```text
moneytracker/
  apps/
    web/                React 19 client (the existing app)
    api/
      src/
        routes/         HTTP layer only, no business logic
        services/       use cases (autopay, anomalies, analytics)
        repositories/   Prisma queries; every function takes userId
        jobs/           pg-boss workers and schedules
        middleware/     auth, validation, rate limit, errors
      prisma/           schema.prisma and migrations/
  packages/
    shared/             Zod schemas, types, pure functions (former src/lib)
  .github/workflows/    CI and deploy
  docker-compose.yml    local Postgres
```

**Environments**

| Environment | Web | API | Database |
| --- | --- | --- | --- |
| Local | Vite dev server | Node with watch | Postgres in Docker |
| Staging | Preview deployment | Staging service | Separate staging database |
| Production | Production deployment | Production service | Production database |

**CI/CD pipeline**

1. On every pull request: install, ESLint, tsc -b, unit tests, API integration tests against a Postgres service container, builds of web and API, npm audit.
2. On merge to main: deploy to staging, run the smoke test (health check, authenticated /me, create and read one transaction).
3. Promote to production by manual approval.
4. Run prisma migrate deploy before the new API version starts.
5. Rollback: redeploy the previous release. Migrations are forward-only, so a bad migration is fixed with a new migration, not a down migration.

**Backups and restore**

Daily managed backups, 14-day retention, and a restore into a scratch database once per quarter to confirm they work.

## 15. Testing and acceptance criteria

The existing 54 tests (43 logic, 11 component) must keep passing; the layers below are added around them.

| Layer | Tool | Scope | Target |
| --- | --- | --- | --- |
| Shared logic | Vitest | Pure functions in packages/shared | 100% coverage (unchanged) |
| API integration | Vitest, Supertest, Testcontainers | Every endpoint against a real Postgres, including auth failures and validation errors | At least 80% line coverage |
| Isolation | Supertest | For every endpoint, user B cannot read, change or delete user A's data | 100% of endpoints |
| Jobs | Vitest with fake clock | Autopay on day 1, day 28, day 31 and in February; double run; two parallel workers | No duplicates |
| Client | Vitest, Testing Library | Contexts with a mocked API client; sync queue replay | Existing 11 tests plus new queue tests |
| End to end | Playwright | Sign in, add transaction, offline then online, import CSV, export, delete account | Passes on staging before promotion |

**Release acceptance criteria**

1. All v2.0 features behave as specified in the v2.0 PRD against the API-backed client.
2. A plan due on day D is created exactly once while the app is closed, and running the job twice creates nothing extra.
3. Five transactions created offline appear exactly once on the server after reconnecting, even if the connection drops during replay.
4. Importing the same CSV twice imports zero rows the second time.
5. SQL totals match the shared-library totals on a generated set of 10,000 transactions.
6. Migrated test accounts match their Firestore source in record counts and amount sums.
7. tsc -b, ESLint and the production build report zero errors.

## 16. Data migration from Firestore

Existing users keep their Firebase accounts, so migration only moves their data. The script is idempotent and is rehearsed on staging before production.

1. Write a Node script using firebase-admin that reads each user's transactions, autopay plans, budget goal and custom categories from Firestore.
2. Transform each record: convert rupee amounts to integer paise with Math.round(amount * 100); validate dates as YYYY-MM-DD and payment methods against the enum; assign a new UUID and store the Firestore document ID in legacy_id; carry over autopay lastProcessedMonth and approved-anomaly markers.
3. Match users by Firebase uid, creating the user row if absent.
4. Load into the staging database with upserts keyed on (user_id, legacy_id), so a rerun changes nothing.
5. Run the parity report: per user and type, record count and sum of amounts in Firestore versus Postgres. Fix and rerun until there are 0 differences.
6. For production, set Firestore to read-only through its security rules, run the script, rerun the parity report, then release the v3.0 web app.
7. Keep Firestore read-only for 30 days as a rollback source, then delete it.

**Rollback.** Before step 7 completes, redeploying the v2.0 web app and restoring Firestore write rules returns users to v2.0. Data entered in v3.0 after cutover is not copied back to Firestore; this is accepted for a rollback window measured in days.

## 17. Delivery roadmap

Delivery runs in five phases, and a phase starts only after the previous gate passes.

1. **Phase A: Shared package & database foundation**
   - Monorepo setup with npm workspaces (`apps/web`, `apps/api`, `packages/shared`).
   - Move pure functions and tests into `packages/shared`. Add Zod schemas and paise currency helpers.
   - Setup PostgreSQL container (`docker-compose.yml`) and Prisma schema with all 5 tables and constraints.
   - Run initial migrations and seed test database.
   - *Gate A*: `packages/shared` passes 100% tests; Prisma migrations apply cleanly.

2. **Phase B: Backend API implementation**
   - Node.js + Express 5 API in `apps/api`.
   - Middleware: Firebase auth token verification via `firebase-admin`, Zod request validation, rate limiting, request ID, structured error handling, Pino logging.
   - Repositories and routes for Module A (User & Profile), Module B (Transactions, CSV import/export), Module C (Autopay), Module D (Budget & Dashboard summary), Module E (Analytics & Anomalies).
   - `pg-boss` background worker setup for scheduled autopay processing and idempotency cleanup.
   - *Gate B*: API integration tests achieve >= 80% line coverage and 100% tenant isolation across all endpoints.

3. **Phase C: Frontend integration & offline sync**
   - Typed API client in `apps/web/src/services` replacing direct Firestore queries.
   - IndexedDB write-ahead queue (`SYNC-2` through `SYNC-7`) for offline actions with idempotency keys.
   - Connect Context providers (`AuthContext`, `TransactionContext`, `AutopayContext`, `BudgetContext`) to REST API and `/sync/changes` pull polling.
   - Remove Cloud Firestore SDK from the client bundle (keep Firebase Auth).
   - Maintain 100% visual and functional parity.
   - *Gate C*: Client passes all existing Vitest tests + new sync queue tests; bundle size and performance budgets verified.

4. **Phase D: Testing, validation & migration tooling**
   - Firestore to PostgreSQL migration script using `firebase-admin` and batch upserts into Postgres.
   - Parity verification script checking record counts and amount sums per user.
   - End-to-end tests (Playwright) covering sign-in, transaction CRUD, offline queue replay, CSV import/export, and account deletion.
   - *Gate D*: Zero-difference parity report on test Firestore datasets; Playwright tests pass reliably.

5. **Phase E: DevOps, deployment & production hardening**
   - OpenAPI specification generation from Zod schemas.
   - CI/CD workflow configuration (GitHub Actions) for lint, typecheck, test, and containerized deployment.
   - Health check endpoints (`/healthz`, `/readyz`) and environment configuration validation.
   - Production runbook and staging rehearsal.
   - *Gate E*: Staging smoke tests pass; production rollout checklist verified.

## 18. Open decisions and risks

This PRD assumes the defaults in the middle column; each is cheap to change before Phase A and costly after Phase D.

| Decision | Default in this PRD | Alternative |
| --- | --- | --- |
| Authentication | Keep Firebase Auth, verify tokens on the API | Own email and Google login with sessions or JWT in Postgres; removes the Firebase dependency but adds password reset and OAuth work |
| Hosting | Vercel (web), Render (API), Neon (database) | Railway, Fly.io or Supabase |
| Autopay after downtime longer than a month | Process the current month only, as in v2.0 | Backfill every missed month |
| Live updates | Pull on focus and every 60 seconds | Server-Sent Events or WebSocket push |
| Postgres row-level security | Not used; user scoping is enforced in repositories and tested | Enable RLS as a second layer |
| Error tracking | Structured logs only | Sentry with request bodies scrubbed |

**Risks**

| Risk | Mitigation |
| --- | --- |
| Idle-instance cold starts on free hosting make the first request slow | Loading state with a 15 s timeout; optional keep-alive ping; move to a paid tier if needed |
| Rupee-to-paise conversion changes a migrated amount | Parity report on counts and sums per user; no production cutover until 0 differences |
| Autopay job runs twice or on two instances | Row locks plus the unique index on (autopay_id, autopay_period); tested with parallel workers |
| Offline queue grows or its stored format changes | Cap of 500 operations; a version field on the stored queue with a migration step |
| Loss of Firestore's live updates is noticed by users | 60-second pull and pull on focus; SSE listed as a follow-up |
| Scope grows into the UI redesign | Redesign stays out of v3.0; no visual change is accepted in review |
