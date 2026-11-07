# MoneyTracker Security Threat Model

**Version:** 1.0  
**Effective Date:** November 2026  
**Scope:** MoneyTracker v3.0 Monorepo (`apps/web`, `apps/api`, `packages/shared`, PostgreSQL, Firebase Auth)  
**Standard:** STRIDE Threat Classification & OWASP Top 10 Application Security Risks  

---

## 1. System Architecture & Trust Boundaries

MoneyTracker operates as a privacy-first personal finance tracking application with local offline resilience, server-side persistence, and client-side end-to-end encrypted backup capabilities.

```
+-----------------------------------------------------------------------------------------+
|                                  UNTRUSTED CLIENT ENVIRONMENT                           |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   |  Browser Client (apps/web)                                                      |   |
|   |  - React 19 SPA, Tailwind CSS, Motion, Recharts                                 |   |
|   |  - Local Storage: IndexedDB (transactions, syncQueue, trash) & sessionStorage   |   |
|   |  - Cryptographic Engine: Web Crypto API (AES-GCM 256-bit, PBKDF2 100k iters)   |   |
|   +-----------------------+----------------------------------+----------------------+   |
+---------------------------|----------------------------------|--------------------------+
                            | (1) ID Tokens / OAuth            | (2) JSON API (HTTPS)
                            v                                  v
+---------------------------+------------+   +-----------------+--------------------------+
|  Firebase Authentication               |   |  Backend API Service (apps/api)             |
|  - Google Cloud Identity Platform      |   |  - Node.js / Express 5 with Helmet & CORS   |
|  - Passwords hashed via scrypt/bcrypt  |   |  - IP & User Token Bucket Rate Limiters     |
|  - Issues signed RS256 JWT ID Tokens   |   |  - Firebase Admin JWT Token Verification    |
+----------------------------------------+   |  - Zod Request Validation                   |
                                             +-----------------+--------------------------+
                                                               | (3) Prisma ORM (TLS)
                                                               v
                                             +-----------------+--------------------------+
                                             |  PostgreSQL Database (Neon / Managed PG)    |
                                             |  - Row-level user isolation (where: userId) |
                                             |  - Foreign key cascading constraints        |
                                             |  - pg-boss job queue (autopay, tombstones)  |
                                             +--------------------------------------------+
```

### Trust Boundaries
1. **Trust Boundary 1 (Client <-> Public Web):** User interactions with the frontend SPA. Threat: XSS, clickjacking, malicious browser extensions.
2. **Trust Boundary 2 (Client <-> API Service):** Authenticated HTTPS transport sending JSON payloads with Bearer tokens. Threat: MITM, token interception, request tampering, rate exhaustion.
3. **Trust Boundary 3 (API Service <-> Database):** Private TLS connection pool executing scoped SQL queries. Threat: SQL injection, cross-tenant data leakage (IDOR), unauthorized schema mutation.
4. **Trust Boundary 4 (Browser Local Storage):** Client-side IndexedDB caching financial entries offline. Threat: Unauthorized local machine access, offline sync tampering.

---

## 2. Key Information Assets & Classifications

| Asset | Description | Sensitivity | Primary Storage | Protection Mechanisms |
| :--- | :--- | :--- | :--- | :--- |
| **Financial Transactions** | Rupee amounts (paise), merchant names, categories, notes, dates | **High (Confidential)** | PostgreSQL (`transactions`) & browser IndexedDB | Scoped queries (`userId`), integer paise math, soft-delete recovery |
| **Autopay Schedules** | Recurring payment rules, amounts, categories, billing days | **High (Confidential)** | PostgreSQL (`autopay_plans`) | `where: { userId }` isolation, unique constraint idempotency |
| **User Identity & Auth** | Firebase UID, email address, display name | **High (PII)** | Firebase Auth & PostgreSQL (`users`) | Scrypt password hashing, rate-limited auth endpoints |
| **Backup Encryption Keys** | User-selected passphrase used to derive backup master key | **Critical** | Ephemeral browser memory only (never sent to server) | Web Crypto PBKDF2 (100k SHA-256 iterations) + AES-GCM 256-bit |
| **Database Credentials** | Neon PostgreSQL connection string and credentials | **Critical (Secret)** | Environment variables (`DATABASE_URL`) | `.gitignore`, runtime startup validation, zero repo commits |
| **Turnstile / API Secrets** | Cloudflare secret keys & Firebase Admin service accounts | **Critical (Secret)** | Cloud host environment variables only | Masked logging, restricted Google Cloud Console permissions |

---

## 3. Threat Analysis & Mitigations (STRIDE Matrix)

### 3.1 Spoofing Identity
* **Threat 1: Automated Credential Stuffing & Bot Registrations**
  * *Vector:* Malicious bots flood `/auth/register` to create fake accounts or validate breached email/password lists.
  * *Mitigations:*
    1. **Cloudflare Turnstile Bot Protection (SEC-19):** Frontend renders Turnstile CAPTCHA widget on sign-up; backend strictly verifies tokens against Cloudflare's `siteverify` endpoint before account creation.
    2. **Dedicated Signup Rate Limiter (BE-7, SEC-19):** Strict IP-based rate limiting on `/auth/register` (max 5 signups / 15 minutes per IP).
    3. **Common Password Blacklist (AUTH-5):** Rejects top 100,000 common passwords.
* **Threat 2: Session Forgery or Expired Token Reuse**
  * *Vector:* Attacker obtains an expired or tampered bearer token and replays API requests.
  * *Mitigations:*
    1. `firebase-admin` verifies cryptographic signatures on every request (`authMiddleware`).
    2. Enforces short-lived access tokens (1 hour) with automatic client-side rotation.
    3. Re-authentication prompt (`AUTH-10`) is mandatory before critical actions (changing password, deleting account).

### 3.2 Tampering with Data
* **Threat 1: CSV Formula Injection (DDE / CSV Injection)**
  * *Vector:* Attacker exports transactions containing malicious spreadsheet formula triggers (`=cmd|' /C ...'!A0`, `@SUM`, `+`, `-`).
  * *Mitigations (SEC-6):*
    1. All exported CSV values are passed through `toCsvSafeValue()`, which prepends a neutralizing single quote (`'`) to any value starting with `=`, `+`, `-`, `@`, `\t`, or `\r`.
* **Threat 2: Tampering with Transaction Amounts & Currency Drift**
  * *Vector:* Floating-point precision manipulation or submitting exponent notation (`1e10`) to corrupt account balances.
  * *Mitigations (CORE-2, CORE-3):*
    1. Exact integer paise summation everywhere (no floating point drift).
    2. Zod and custom validators reject exponent notation and enforce max limits (₹10 Crore cap, at most 2 decimal places).
* **Threat 3: Offline Sync Queue Manipulation**
  * *Vector:* Tampering with queued actions in IndexedDB during offline usage.
  * *Mitigations:*
    1. Every sync payload is re-validated on the server with Zod schemas.
    2. Idempotency keys (`IdempotencyKey` table) prevent duplicate execution of retried mutations (`BE-10`).

### 3.3 Repudiation
* **Threat 1: Accidental or Malicious Deletion Repudiation**
  * *Vector:* User claims transactions vanished without their knowledge; attacker deletes financial history.
  * *Mitigations (CORE-9, BE-18):*
    1. Soft-delete retention: Deleting a record sets `deletedAt = NOW()`, preserving it in Trash for 90 days with instant Undo toasts.
    2. Audit timestamps (`created_at`, `updated_at`, `deleted_at`) use server-authoritative UTC clocks (`BE-17`).

### 3.4 Information Disclosure
* **Threat 1: Insecure Direct Object References (IDOR)**
  * *Vector:* User A queries or updates User B's transaction by guessing or substituting a UUID (`/transactions/:id`).
  * *Mitigations (BE-3, SEC-7):*
    1. Every repository query explicitly filters on the authenticated user's ID (`where: { id, userId: req.user.id }`).
    2. Negative tests (`apps/api/test/isolation.test.ts`) verify that unauthorized cross-user queries return 404/403.
* **Threat 2: Sensitive Data Leakage in Logs or Error Responses**
  * *Vector:* User passwords, financial amounts, or authorization headers leak into server log sinks or client error dialogs.
  * *Mitigations (BE-2, SEC-8):*
    1. Structured Pino logger uses automatic redaction rules on `authorization`, `amount`, `amountPaise`, and `description`.
    2. Centralized error handling (`errorHandler.ts`) catches unhandled exceptions, logs internal details securely, and sends generic, standardized error codes (`INTERNAL_ERROR`) without stack traces to clients.
* **Threat 3: Clickjacking & Frame Embedding**
  * *Vector:* Malicious sites embed MoneyTracker inside an `<iframe>` to capture clicks or keystrokes.
  * *Mitigations (SEC-4):*
    1. HTTP headers enforce `frame-ancestors 'none'` in Content Security Policy and `X-Frame-Options: DENY`.

### 3.5 Denial of Service (DoS)
* **Threat 1: API Request Floods & Resource Starvation**
  * *Vector:* Distributed HTTP floods overload the Express application and PostgreSQL pool.
  * *Mitigations (BE-7, BE-12):*
    1. Dual-tier rate limiting: Global IP rate limit (100 req/min) + Authenticated user token bucket (60 req/min).
    2. Prisma connection pool sizing (`connection_limit: 10`, `pool_timeout: 10s`) and query statement timeout (15s).
    3. HTTP body size capped at 1MB (`express.json({ limit: '1mb' })`).
* **Threat 2: Oversized File Upload Tab Freeze**
  * *Vector:* User imports an enormous 500MB CSV file causing browser memory exhaustion or browser crash.
  * *Mitigations (SEC-13, CORE-12):*
    1. Client-side file size gate enforces a strict 5MB limit before file reads.
    2. Streaming chunk parsing protects browser memory.

### 3.6 Elevation of Privilege
* **Threat 1: Unauthorized Administrative Escalation**
  * *Vector:* User seeks to access other users' data or administrative functions.
  * *Mitigations:*
    1. Peer-to-peer flat authorization architecture: there are no elevated "superadmin" roles with access to user databases. Every user account is strictly isolated to its own rows.
    2. Cascading database constraints ensure account deletion completely purges all associated transactions, categories, autopay plans, and budget goals (`AUTH-2`).

---

## 4. Entry Points & Attack Surface Catalog

| Surface | Entry Point | Protocol | Auth Required | Controls / Safeguards |
| :--- | :--- | :--- | :--- | :--- |
| **API** | `POST /auth/register` | HTTPS | No | IP rate limiter, Cloudflare Turnstile CAPTCHA verification, email syntax check |
| **API** | `GET /health` | HTTPS | No | Liveness/readiness check with database ping; no sensitive schema disclosures |
| **API** | `GET /api/v1/transactions` | HTTPS | Yes (Bearer JWT) | Scoped to `userId`, paginated (`page`, `pageSize` max 100), user rate-limited |
| **API** | `POST /api/v1/transactions` | HTTPS | Yes (Bearer JWT) | Zod schema validation, paise integer cap, idempotency key support |
| **API** | `DELETE /api/v1/me` | HTTPS | Yes (Bearer JWT) | Re-authentication check (`AUTH-10`), cascading database deletion |
| **Web UI** | CSV File Import | Browser | Yes | 5MB size limit, UTF-8 BOM stripping, header validation, malformed row recovery |
| **Web UI** | Encrypted Backup Import | Browser | Yes | Client-side AES-256-GCM verification, PBKDF2 key derivation, zero plain secret transmission |

---

## 5. Security Verification & Audit Cadence

1. **Continuous Automated Verification:** Every Pull Request runs `npm audit` (0 high/critical vulnerabilities), ESLint security hygiene, and 650+ unit and integration tests including isolation tests (`isolation.test.ts`), formula injection tests (`transactions.test.ts`), and Turnstile tests (`turnstile.test.ts`).
2. **Periodic Review:** This threat model is reviewed annually or prior to any major architectural release.
3. **Vulnerability Reporting:** Vulnerabilities should be reported responsibly per repository security guidelines.
