# 3. Privacy-First Architecture, Client-Side Encryption, and Offline-First Sync

**Status:** Accepted  
**Date:** November 2026  
**Deciders:** Core Engineering Team  
**Consulted:** PRD v3.0 Specification, Security Threat Model  

---

## Context and Problem Statement

Financial records constitute some of the most sensitive personal data a user possesses. Traditional cloud financial applications collect user financial transaction logs in plaintext, subjecting users to data breaches, advertiser tracking, and unauthorized access.

MoneyTracker was conceived with a non-negotiable **privacy-first philosophy**:
1. Users own their data unconditionally.
2. The application must function reliably when disconnected (flights, remote travel, connectivity outages).
3. Data exports must offer end-to-end mathematical protection so users can store backups on third-party cloud drives without exposing confidential ledger contents.

---

## Decision Drivers

- **Zero Third-Party Tracking:** Zero advertising SDKs, zero analytics tracking beacons, zero tracking pixels.
- **Offline Reliability:** Instant UI responsiveness regardless of network latency, cold starts, or disconnections.
- **Client-Side Cryptography:** Decryption keys must remain exclusively in the user's possession.

---

## Considered Options

1. **Server-Managed Encryption at Rest Only (e.g. AWS KMS / Neon Default Encryption):** Protects disks from physical theft, but server administrators and database administrators still have access to plaintext records.
2. **Traditional Cleartext JSON/CSV Exports:** Convenient, but backups stored on Google Drive, Dropbox, or email attachments are vulnerable to interception.
3. **Hybrid Privacy-First Model with Web Crypto Client-Side Encryption and IndexedDB Sync Queue (Chosen):**
   - Local-first writes persisted immediately to browser IndexedDB.
   - Background synchronization queue with exponential backoff and idempotency keys.
   - Client-side AES-256-GCM passphrase encryption using the W3C Web Crypto API for zero-knowledge backups.

---

## Decision Outcome

Chosen option: **Hybrid Privacy-First Architecture with Client-Side Web Crypto Encryption**.

### Architectural Details

- **Offline-First Storage (`apps/web/src/services/syncQueue.ts`):**
  - All write operations (add, edit, delete transaction; update autopay) mutate local React state and append a mutation action to an IndexedDB persistent queue (`moneytracker-offline-queue`).
  - When network status returns to `online`, the synchronization queue replays queued actions with unique `Idempotency-Key` headers.
  - Conflicts are resolved deterministically using server timestamp precedence (`updatedAt`).
- **Passphrase-Encrypted Backups (`DIFF-6` / `packages/shared/src/crypto/encryptedBackup.ts`):**
  - Implements the browser W3C Web Crypto API (`window.crypto.subtle`).
  - Derives a 256-bit symmetric key from user passphrase using **PBKDF2 with SHA-256 and 100,000 iterations** alongside a 16-byte cryptographically secure random salt.
  - Encrypts payload using **AES-GCM (256-bit key, 12-byte random IV)**.
  - Emits self-contained `.enc` JSON container containing version, salt, iv, and ciphertext with authentication tag.
  - Decryption verifies auth tag before restoring data, rejecting corrupted or tampered archives.
- **Zero Third-Party Trackers:**
  - Strict Content Security Policy (`apps/web/vercel.json`, `apps/web/public/_headers`, `apps/api/src/app.ts`) limits outbound network traffic strictly to Firebase Auth domains.
  - All web fonts (Instrument Sans, Bricolage Grotesque) are self-hosted WOFF2 files to eliminate Google Fonts CDN logging.

---

## Consequences

### Positive
- **True User Sovereignty:** Even in the catastrophic event of a server compromise, encrypted user backups cannot be decrypted without individual user passphrases.
- **Instant Speed:** User actions never block on network round-trips.
- **Robustness Against Network Instability:** Seamless recovery from mobile network dropouts and backend cold starts.

### Negative
- **No Passphrase Recovery:** Because encryption keys are derived client-side and never sent to any server, if a user forgets their backup passphrase, the backup cannot be recovered by support. Clear warnings are presented in the export UI.
