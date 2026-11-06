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
   - Run full monorepo test suite: `npm test` (all tests passing across all workspaces).
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
- Bundle size $\le 350\text{ kB}$ gzipped.
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
   Redeploy previous release of `apps/web`.
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

---

## 6. [SEC-1] Firebase Web API Key Restriction & Rotation Playbook (Owner Action)

Firebase Web API keys are identifiers rather than secrets, but should be strictly locked down in the Google Cloud Console to prevent quota theft or unauthorized client access:

1. Navigate to [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials).
2. Locate the Browser Key used for Firebase Web Authentication (matches `VITE_FIREBASE_API_KEY`).
3. Click **Edit API Key**:
   - **Application restrictions**: Select **Websites**.
   - Under **Website restrictions**, add:
     - `https://your-production-domain.com/*`
     - `https://*.vercel.app/*` (staging previews)
     - `http://localhost:*` (local development)
   - **API restrictions**: Select **Restrict key**.
   - In the dropdown, check ONLY:
     - **Identity Toolkit API**
     - **Token Service API**
4. Click **Save**.
5. *Rotation (Optional)*: If the historical key was exposed in public commits, click **Create Credentials > API Key**, apply the same restrictions to the new key, update `VITE_FIREBASE_API_KEY` across hosting providers, and delete the legacy key after 24 hours.

---

## 7. [SEC-3 & OPS-12] Domain & HTTPS Preload Playbook (Owner Action)

1. **Domain Setup**:
   - In your registrar (Cloudflare / Namecheap / Google Domains):
     - Create an `A` record or `CNAME` pointing to your frontend host (e.g., `cname.vercel-dns.com`).
     - Create redirect rules ensuring `http://` redirects to `https://` and `www.` redirects to root apex (or vice versa).
2. **HSTS Preload Verification**:
   - The frontend configuration (`apps/web/vercel.json` and `public/_headers`) automatically sets:
     `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - Once your custom domain is live, submit your domain to the official HSTS preload list at [hstspreload.org](https://hstspreload.org).
3. **External Security Scan**:
   - Validate headers at [securityheaders.com](https://securityheaders.com) targeting an **A+** grade.

---

## 8. [OPS-1 & OPS-2] Multi-Environment Deployment Playbook (Owner Action)

### Staging Environment
1. **Database**: Provision a free staging PostgreSQL database on [Neon](https://neon.tech/) (e.g. `moneytracker-staging`).
2. **API**: Deploy `apps/api` to Render / Fly.io / Railway:
   - Environment variables:
     - `NODE_ENV=staging`
     - `PORT=4000`
     - `DATABASE_URL="postgres://...@ep-staging...neon.tech/moneytracker-staging?sslmode=require"`
     - `CORS_ORIGIN="https://staging.yourdomain.com"`
3. **Web**: Deploy `apps/web` to Vercel (Staging branch):
   - Set environment variables to point `VITE_API_URL` to staging API.

### Production Environment
1. **Database**: Provision a dedicated production PostgreSQL database on [Neon](https://neon.tech/) with automated point-in-time recovery (PITR).
2. **API**: Deploy `apps/api` with production credentials:
   - `NODE_ENV=production`
   - `DATABASE_URL` (Production Neon connection string)
   - `CORS_ORIGIN="https://yourdomain.com"`
3. **Web**: Production Vercel project linked to `main` branch.

---

## 9. [OPS-4] Database Backups & Restore Rehearsal Playbook (Owner Action)

1. **Automated Backups**:
   - Neon and Cloud SQL automatically capture continuous WAL archives and daily snapshots. Ensure retention is set to at least 7 days (or 30 days for enterprise compliance).
2. **Manual Snapshot via CLI**:
   ```bash
   # Export encrypted PostgreSQL custom dump
   pg_dump -Fc --no-owner --no-privileges "$DATABASE_URL" > "backup_$(date +%Y%m%d_%H%M%S).dump"
   ```
3. **Rehearsing a Test Restore (Disaster Recovery)**:
   - Create a temporary isolated restoration database:
     ```bash
     createdb -h localhost -U postgres moneytracker_restore_test
     ```
   - Restore the dump file:
     ```bash
     pg_restore -h localhost -U postgres -d moneytracker_restore_test --clean --if-exists backup_*.dump
     ```
   - Verify transaction counts and parity:
     ```sql
     \c moneytracker_restore_test
     SELECT count(*) FROM "Transaction";
     SELECT count(*) FROM "User";
     SELECT count(*) FROM "AutopayPlan";
     ```
   - Drop the temporary verification database:
     ```bash
     dropdb -h localhost -U postgres moneytracker_restore_test
     ```
