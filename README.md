# Digital Spending Tracker (MoneyTracker)

A professional, privacy-first personal finance management platform engineered with an offline-first client architecture, exact integer financial arithmetic, recurring autopay orchestration, and statistical spending anomaly detection.

---

## 1. System Architecture

MoneyTracker is organized as an enterprise-grade TypeScript monorepo utilizing npm workspaces:

```mermaid
flowchart TD
    subgraph Client["Frontend Client (apps/web)"]
        UI["React 19 + TailwindCSS SPA"]
        Context["TrackerContext (Optimistic State)"]
        Queue["IndexedDB Offline Sync Queue"]
        UI --> Context
        Context <--> Queue
    end

    subgraph Shared["Shared Logic (packages/shared)"]
        Math["Paise Integer Math Engine"]
        Schemas["Zod Validation Schemas"]
        Analytics["SMA Forecast & Runway Predictor"]
        AutopayMath["Month Boundary / Leap Year Clamping"]
    end

    subgraph Backend["Backend API (apps/api)"]
        Express["Express 5 REST API"]
        RateLimit["Token-Bucket Rate Limiter"]
        AuthMiddleware["Firebase JWT Verification"]
        Prisma["Prisma ORM"]
        Worker["pg-boss Autopay Scheduler"]
        Express --> RateLimit --> AuthMiddleware --> Prisma
        Worker --> Prisma
    end

    subgraph Data["Data & Identity Layer"]
        PG[(PostgreSQL 15+ / Neon DB)]
        FirebaseAuth["Firebase Auth (Identity Toolkit)"]
    end

    Client -->|HTTPS REST API /api/v1| Backend
    Client -->|Client-side Token Exchange| FirebaseAuth
    AuthMiddleware -->|Verify ID Token| FirebaseAuth
    Client -.->|Pure Calculation Imports| Shared
    Backend -.->|Validation & Math Imports| Shared
    Prisma <-->|Connection Pool| PG
    Worker <-->|Job Queue Tables| PG
```

---

## 2. Monorepo Structure

```text
├── apps/
│   ├── api/                     # Express 5 REST API service
│   │   ├── prisma/              # Prisma database schema and migrations
│   │   ├── src/
│   │   │   ├── config/          # Environment variable validation
│   │   │   ├── middleware/      # Rate limiting, tenant isolation, request logging
│   │   │   ├── routes/          # API v1 routes (auth, sync, transactions, autopay)
│   │   │   └── scheduler/       # pg-boss background recurring autopay processor
│   │   └── test/                # Supertest & Vitest integration test suite
│   └── web/                     # React 19 Single Page Application
│       ├── public/              # Static assets, PWA manifest, security headers
│       ├── src/
│       │   ├── components/      # Accessible UI components (AppShell, Tabs, Modals)
│       │   ├── context/         # Centralized state management & cache purging
│       │   ├── lib/             # Client calculations & export formatters
│       │   ├── services/        # Firebase Auth client, REST API client, SyncQueue
│       │   └── test/            # Axe-core a11y tests, component tests, unit tests
│       └── vercel.json          # Production static routing and CSP security headers
├── packages/
│   └── shared/                  # Universal business logic and schemas
│       ├── src/
│       │   ├── calculations/    # Integer paise math, budget status, runway, autopay
│       │   └── schemas/         # Zod schemas for tenant isolation & payload validation
│       └── test/                # 100% pure boundary test suite
├── docs/                        # Planning, PRDs, specs, and readiness audits
│   ├── readiness/               # Master audit checklist, backlog, and scorecards
│   └── RUNBOOK.md               # DevOps operations, migrations, and disaster recovery
└── .github/
    └── workflows/
        └── ci.yml               # GitHub Actions CI (lint, typecheck, test, build, audit)
```

---

## 3. Key Core Features & Engineering Principles

### 3.1 Exact Integer Arithmetic (Paise Precision)
All monetary calculations are performed in integer **paise** (1 INR = 100 paise) using dedicated integer functions in `packages/shared/src/calculations/paise.ts`. Floating-point binary rounding errors (e.g., `0.1 + 0.2 !== 0.3`) are eliminated. Transactions enforce a strict ₹10,00,00,000 (10 Crore) validation ceiling.

### 3.2 Offline-First Synchronization
Mutations are applied optimistically to the local UI state and enqueued in an IndexedDB persistent queue (`apps/web/src/services/syncQueue.ts`). When connectivity resumes, operations replay sequentially against the `/api/v1/sync` endpoint with exponential backoff and automatic rollback on non-retryable errors.

### 3.3 Robust Recurring Autopay Engine
Supports recurring monthly subscriptions with intelligent month boundary and leap year clamping:
- Schedules set for days 29, 30, or 31 automatically clamp to the last valid day of shorter months (e.g., February 28 or February 29 in leap years).
- "Last day of month" autopay options compute exact month-end dates across timezone boundaries.
- Managed by `pg-boss` background job queues in `apps/api/src/scheduler/autopayScheduler.ts`.

### 3.4 Statistical Spending Anomaly Detection
Detects unusual expenses using category-specific Z-score statistical evaluation:
$$\text{Z-Score} = \frac{x - \mu}{\sigma}$$
Expenses exceeding 2 standard deviations ($\sigma > 2$) with at least 3 historical records trigger contextual alerts. Users can approve verified high-value transactions, training the engine to adapt to legitimate spending patterns.

### 3.5 Security Hardening & Zero-Trust Tenant Isolation
- **CSP & Headers:** Strict Content Security Policy (`frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`).
- **CSV Injection Protection:** Sanitizes formula prefixes (`=`, `+`, `-`, `@`, `\t`, `\r`) per OWASP CWE-1236 guidelines.
- **Tenant Isolation:** Enforced via Firebase ID token verification and Prisma queries keyed strictly to the authenticated `userId`.
- **Rate Limiting:** Token-bucket rate limiter per IP address and authenticated user ID.

---

## 4. Getting Started

### 4.1 Prerequisites
- **Node.js:** `>= 20.18.0` (Node 22 LTS recommended)
- **npm:** `>= 10.0.0`
- **PostgreSQL:** `15+` (Local Postgres or [Neon](https://neon.tech/) Serverless Postgres)
- **Firebase Project:** Web app credentials for Firebase Authentication

### 4.2 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/moneytracker.git
   cd moneytracker
   ```

2. **Install monorepo dependencies:**
   ```bash
   npm ci
   ```

3. **Configure Environment Variables:**

   **Backend (`apps/api/.env`):**
   ```bash
   PORT=4000
   NODE_ENV=development
   DATABASE_URL="postgresql://user:password@localhost:5432/moneytracker?schema=public"
   FIREBASE_PROJECT_ID="your-firebase-project-id"
   CORS_ORIGIN="http://localhost:5173"
   LOG_LEVEL="info"
   ```

   **Frontend (`apps/web/.env`):**
   ```bash
   VITE_API_URL="http://localhost:4000/api/v1"
   VITE_FIREBASE_API_KEY="your-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-firebase-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   VITE_FIREBASE_APP_ID="your-app-id"
   ```

4. **Initialize Database:**
   ```bash
   npm --workspace=@moneytracker/api run prisma:generate
   npm --workspace=@moneytracker/api run prisma:migrate
   ```

5. **Start Development Servers:**
   ```bash
   npm run dev
   ```
   - Frontend UI: `http://localhost:5173`
   - Backend API: `http://localhost:4000/healthz`

---

## 5. Development & Testing Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Runs frontend and backend concurrently in development mode |
| `npm test` | Executes full Vitest test suite across shared, api, and web workspaces |
| `npm run build` | Compiles shared library, builds API TypeScript, and bundles Web SPA via Vite |
| `npm run lint` | Runs ESLint across all workspaces |
| `npx tsc -b` | Performs strict TypeScript project references check across monorepo |
| `npm audit --audit-level=critical` | Executes security audit for critical dependency vulnerabilities |

---

## 6. Testing Philosophy

The codebase enforces strict test coverage and behavior verification:
- **Unit Testing:** 100% pure mathematical calculations and schema parsing (`packages/shared/test`).
- **Integration Testing:** Authenticated API routes, rate limiting, and tenant data isolation (`apps/api/test`).
- **Component & A11y Testing:** React components and axe-core accessibility evaluations (`apps/web/src/test`).
- **Regression Pre-Commit Gate:** `tsc -b`, `eslint`, full test suite, and production build must pass with zero errors prior to every commit.

---

## 7. Operations & Runbook

For production deployment instructions, database migration procedures (including migrating legacy Firestore datasets to PostgreSQL), and disaster recovery playbooks, consult [`docs/RUNBOOK.md`](docs/RUNBOOK.md).

---

## 8. License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
