# 1. Migration from Firebase Firestore to Node.js Express 5 and PostgreSQL

**Status:** Accepted  
**Date:** November 2026  
**Deciders:** Core Engineering Team  
**Consulted:** PRD v3.0 Specification  

---

## Context and Problem Statement

MoneyTracker v1.0 and v2.0 originally operated as a frontend single-page application connecting directly to Google Cloud Firestore via the Firebase Web SDK. While this architecture enabled rapid prototyping, it exhibited critical architectural drawbacks for a robust personal financial application:

1. **Vendor Lock-in and Hosting Fragility:** Direct client-side Firestore access required complex security rules (`firestore.rules`) and bound all database queries to Google's proprietary NoSQL backend.
2. **Lack of ACID Relational Integrity:** Personal financial records intrinsically rely on relational integrity: user accounts, categorized transactions, autopay plans, and budget thresholds. Firestore lacked native join operations, foreign key constraints, and relational cascade semantics.
3. **Complex Aggregations and Window Queries:** Analytics calculations (e.g. 7-day Simple Moving Averages, Z-score variance across categories, and month-over-month category percentage deltas) required heavy client-side reads and post-processing, inflating bandwidth and document read costs.
4. **Data Ownership and Self-Hostability:** Personal finance users prioritize complete data ownership and independence from closed ecosystem dependencies.

---

## Decision Drivers

- Need for strict ACID transactions and relational constraints (foreign keys, cascading soft-deletes).
- Clean separation of concerns between presentation (React 19 SPA) and persistent state management (REST API).
- High performance, low-cost self-hostability on open standards (PostgreSQL, Docker, Render, Neon).
- Developer productivity through type-safe schema migrations using Prisma ORM.

---

## Considered Options

1. **Retain Firebase Firestore directly in frontend:** Simplest operational overhead, but unacceptable relational limitations, lack of server-side data sanitization, and vendor lock-in.
2. **MongoDB / DocumentDB:** Flexible schemas, but still NoSQL without native relational constraints, and non-trivial transaction overhead.
3. **PostgreSQL with Node.js Express 5 and Prisma ORM (Chosen):** Industry standard relational database, fully typed query interface, native decimal/bigint financial representations, and broad deployment flexibility across cloud and on-premise environments.

---

## Decision Outcome

Chosen option: **PostgreSQL with Node.js Express 5 and Prisma ORM**.

### Architectural Details

- **Monorepo Architecture:** The repository was refactored into an npm workspaces monorepo:
  - `apps/web`: React 19 single-page application.
  - `apps/api`: Express 5 REST API service.
  - `packages/shared`: Shared Zod validation schemas, types, and mathematical calculation engines.
- **Relational Schema:** Modeled in `apps/api/prisma/schema.prisma` with explicit indices on `[userId, txnDate]`, foreign keys between transactions and autopay plans, and strict soft-delete timestamps.
- **Firebase Authentication Decoupling:** Firebase Authentication is retained solely as an identity provider (ID token issuer). The backend verifies tokens using `firebase-admin` (with mock bypass for local testing) and maps the external UID to internal PostgreSQL UUID foreign keys.

---

## Consequences

### Positive
- **Guaranteed Consistency:** Foreign keys, compound unique constraints, and soft-delete retention are enforced at the database level.
- **Enhanced Security:** Zero direct database credentials exist in browser client bundles. All mutations pass through server-side validation middleware (`zod`) and rate limiters.
- **Portability:** Database can run locally in Docker, on managed cloud Postgres (Neon, Supabase, Render), or in standard VPS environments.

### Negative
- **Additional Service to Operate:** Requires maintaining and monitoring the Express API service alongside the static frontend CDN.
- **Migration Overhead:** Existing Firestore users require an automated migration script (`scripts/migrate-firestore-to-postgres.ts`) to transition historical documents into relational tables.
