# MoneyTracker v3.0 Production Cutover & Operations Runbook

This runbook establishes the exact sequence of operational steps for transitioning MoneyTracker from client-side Firestore to the owned full-stack architecture (PostgreSQL 16 + Express 5 + React 19).

---

## 1. Architecture Summary

- **Frontend (`apps/web`)**: React 19 SPA communicating with REST API (`/api/v1`), using IndexedDB offline sync queue (`moneytracker_offline_db`) for zero-loss offline mutations.
- **Backend (`apps/api`)**: Express 5 service with integer paise math, rate limiting, and `pg-boss` background scheduler running recurring autopay every 15 minutes.
- **Shared (`packages/shared`)**: Canonical Zod schemas and statistical calculations (SMA, runway, Z-score).
- **Database**: PostgreSQL 16 managed via Prisma ORM with soft delete tombstones and partial unique indexes.

---

## 2. Pre-Cutover Checklist (T-24 Hours)

1. [ ] **Verify Staging Environment**:
   - PostgreSQL 16 container running and healthy.
   - Run `npm run --workspace=@moneytracker/api prisma:migrate` to verify clean schema deployment.
   - Run full monorepo test suite: `npm test` (all 36 test files, 134 tests passing).
2. [ ] **Dry-Run Migration**:
   - Execute non-destructive dry-run against Firestore dataset:
     ```bash
     npm run migrate:firestore -- --dry-run
     ```
   - Confirm extracted counts match expectations.
3. [ ] **Verify Environment Variables**:
   - `DATABASE_URL` configured with connection pool limits (e.g. `connection_limit=20`).
   - `FIREBASE_PROJECT_ID` and credentials set.
   - `ALLOWED_ORIGINS` configured with production domain(s).

---

## 3. Cutover Sequence (Execution Window)

### Step 1: Set Firestore to Read-Only (T-0)
Deploy restrictive Firebase Security Rules to prevent client writes during migration:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Lockdown writes
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### Step 2: Run Data Migration
Execute the idempotent migration script:
```bash
npm run migrate:firestore
```
*Expected output: Logs per user record counts and total volume converted into integer paise.*

### Step 3: Run Parity Verification
Verify zero differences between Firestore and PostgreSQL:
```bash
npm run verify:parity
```
*Gate: Must output `PARITY VERIFICATION PASSED: 0 differences detected`. If any discrepancy occurs, investigate and re-run.*

### Step 4: Deploy API Service
1. Apply Prisma migrations to production database:
   ```bash
   npm run --workspace=@moneytracker/api prisma:migrate
   ```
2. Start API service / container:
   ```bash
   npm run --workspace=@moneytracker/api start
   ```
3. Verify health checks:
   - `GET /health` $\to$ `200 OK`
   - `GET /ready` $\to$ `200 OK` (verifies PostgreSQL connection)

### Step 5: Deploy Web Application (v3.0)
Deploy the production web build (`apps/web/dist`):
```bash
npm run --workspace=@moneytracker/web build
```
Verify:
- Bundle size $\le 750\text{ kB}$ (no Firestore SDK in bundle).
- Green "Synced" indicator appears in header on sign in.

---

## 4. Rollback Plan

If a critical issue is discovered within the 30-day cutover window:

1. **Re-enable Firestore Writes**:
   Restore original Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
2. **Rollback Web Client**:
   Redeploy previous release (v2.0) of `apps/web`.
3. **Data Impact**:
   Data entered into v3.0 after cutover is preserved in PostgreSQL and can be re-migrated once resolved.

---

## 5. Ongoing Operations & Monitoring

- **Autopay Scheduler**: Managed by `pg-boss`. Check job queue health:
  ```sql
  SELECT name, state, count(*) FROM pgboss.job GROUP BY name, state;
  ```
- **Tombstone Purging**: Automatic daily job removes soft-deleted transactions older than 90 days.
- **Idempotency Keys**: Automatic daily job purges keys older than 7 days.
