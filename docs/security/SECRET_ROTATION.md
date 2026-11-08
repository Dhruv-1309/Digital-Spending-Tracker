# Secret & Credential Rotation Runbook (SEC-22)

This runbook documents the step-by-step procedures for rotating all production secrets, API credentials, and cryptographic keys used by MoneyTracker.

---

## 1. Secrets Inventory & Rotation Frequency

| Secret Name | Service | Recommended Frequency | Immediate Trigger |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL (Neon / Cloud SQL) | Every 180 days | Suspected database compromise or employee offboarding |
| `JWT_SECRET` | Express API session token signing | Every 90 days | Accidental commit or token leak |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin SDK | Every 180 days | Service account credential exposure |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile Bot Defense | Every 365 days | Key exposure in client bundle |

---

## 2. Rotation Procedures

### 2.1 Database Credentials (`DATABASE_URL`)

1. **Provision Secondary Password in PostgreSQL:**
   ```sql
   -- Create or update role password in PostgreSQL
   ALTER USER moneytracker_app WITH PASSWORD 'new-strong-entropy-password';
   ```
2. **Update Application Environment Secrets:**
   In your hosting dashboard (e.g. Render / Cloud Run):
   Update `DATABASE_URL` to the new connection URI.
3. **Trigger Rolling Deployment:**
   Deploy API containers. The new pods will establish connections using the new credentials while existing in-flight queries drain gracefully.
4. **Revoke Old Password:**
   After all pods report healthy on `/readyz`, verify no stale connections exist before removing legacy credentials.

---

### 2.2 JWT Signing Secret (`JWT_SECRET`)

1. **Generate High-Entropy Secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. **Update Environment Variable:**
   Update `JWT_SECRET` in API production settings.
3. **Graceful User Re-Authentication:**
   Note that existing active JWTs signed with the previous key will expire upon key replacement. Users will be asked to re-authenticate seamlessly on their next mutating request.

---

### 2.3 Firebase Service Account Private Key

1. **Navigate to Google Cloud Console:**
   Go to **IAM & Admin** > **Service Accounts** > Select `moneytracker-admin`.
2. **Generate New Key:**
   Select **Keys** > **Add Key** > **Create new key** (JSON format).
3. **Update `FIREBASE_SERVICE_ACCOUNT_KEY` Secret:**
   Encode or paste the JSON key content into the hosting secret store.
4. **Deploy & Verify:**
   Trigger deployment and verify `/api/v1/auth/verify` endpoint succeeds.
5. **Delete Old Key:**
   Return to Google Cloud Console and delete the deprecated key after confirming successful operation.

---

### 2.4 Cloudflare Turnstile Secret Key

1. Open Cloudflare Dashboard > **Turnstile**.
2. Rotate secret key or generate a new widget pair (Site Key & Secret Key).
3. Update `VITE_TURNSTILE_SITE_KEY` in `apps/web/.env` and `TURNSTILE_SECRET_KEY` in `apps/api/.env`.
4. Run integration test `npm test turnstile` to confirm bot challenge validation passes.
