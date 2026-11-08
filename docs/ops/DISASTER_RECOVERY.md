# Disaster Recovery Policy & Targets (OPS-21)

This document formalizes the Recovery Point Objective (RPO), Recovery Time Objective (RTO), and incident recovery procedures for MoneyTracker production systems.

---

## 1. Objectives & Service Level Targets

| Metric | Target | Definition |
| :--- | :--- | :--- |
| **RPO (Recovery Point Objective)** | **24 hours** (Daily Snapshots) / **< 1 hour** (WAL streaming) | The maximum acceptable data age that may be lost during a catastrophic primary database loss. |
| **RTO (Recovery Time Objective)** | **< 2 hours** | The maximum acceptable duration between disaster declaration and restored service availability with passing `/readyz` healthchecks. |

---

## 2. Disaster Recovery Scenarios & Procedures

### Scenario A: Managed PostgreSQL Instance Failure or Corruption

**Impact:** API responds with 500 / 503 database connection errors.

**Action Plan:**
1. Check cloud provider database status (Neon / Cloud SQL).
2. If primary instance is unrecoverable, initiate point-in-time recovery (PITR) to a new instance from the latest automated snapshot:
   ```bash
   # Example: restore PostgreSQL snapshot into new recovery branch
   neon branch create --name recovery-$(date +%Y%m%d) --from-snapshot <latest-snapshot-id>
   ```
3. Update `DATABASE_URL` environment secret in production API host (Render / Cloud Run) to target the restored instance connection string.
4. Execute Prisma migration sanity check:
   ```bash
   npx prisma migrate status
   ```
5. Verify API `/readyz` endpoint returns `200 OK` with database status `healthy`.

---

### Scenario B: Frontend Host Outage (Vercel / Nginx)

**Impact:** Public web SPA is unreachable or returning CDN errors.

**Action Plan:**
1. Offline-first clients continue functioning via local service worker cache and IndexedDB storage.
2. Deploy standby static build to secondary CDN (Cloudflare Pages or AWS S3 + CloudFront):
   ```bash
   npm run build
   # Deploy dist/ to alternate static hosting
   ```
3. Update DNS CNAME records to point to the alternate provider (TTL is configured to 300 seconds).

---

### Scenario C: Corrupted Migration or Accidental Bulk Deletion

**Impact:** Schema mismatch or missing user data.

**Action Plan:**
1. Immediately enable maintenance mode by setting `MAINTENANCE_MODE=true` on the API to pause sync ingestion.
2. Soft-deleted transactions can be restored using the 30-day Trash mechanism without database rollback:
   ```sql
   UPDATE "Transaction" SET "deletedAt" = NULL WHERE "deletedAt" > NOW() - INTERVAL '1 day';
   ```
3. For schema corruption, apply rollback migration script documented in `docs/RUNBOOK.md` Section 3.

---

## 3. Post-Recovery Verification Checklist

Following any database restoration or failover:

- [ ] Check `/healthz` and `/readyz` response status and latency.
- [ ] Confirm table counts match expected volume (`User`, `Transaction`, `AutopayPlan`, `BudgetGoal`).
- [ ] Execute parity verification script:
  ```bash
  npx tsx scripts/verify-parity.ts
  ```
- [ ] Verify test user can log in, view transactions, and successfully sync an offline transaction.
