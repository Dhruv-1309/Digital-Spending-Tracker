# Formal Release Manual QA Script (QA-18)

This manual QA script defines the end-to-end user verification protocol to be executed prior to any production release of MoneyTracker.

---

## Pre-Requisites
- Clean browser session (Incognito or dedicated profile).
- Network throttling and offline simulation tools available via browser DevTools.

---

## Test Protocol

### Suite 1: Public Experience & Demo Mode
- [ ] **1.1 Landing Page Navigation:** Navigate to `/landing`. Assert hero banner, feature cards, and "Get Started Free" button render without layout shift.
- [ ] **1.2 Public Legal Pages:** Verify `/about`, `/terms`, `/privacy`, and `/accessibility` load cleanly with working "Back to App" buttons.
- [ ] **1.3 Demo Mode Activation:** On the login view, click "Explore Demo Mode". Verify the app loads instantly with pre-seeded sample data and an amber Demo Mode banner.
- [ ] **1.4 Demo Mode In-Memory Isolation:** Add a transaction in Demo Mode. Confirm transaction list updates. Refresh browser page; confirm changes reset cleanly without network errors.

### Suite 2: Authentication & Account Lifecycle
- [ ] **2.1 Decoupled Sign Up / Sign In:** Confirm Sign In and Sign Up are explicit segmented options.
- [ ] **2.2 Form Validation:** Submit empty credentials and verify high-contrast field validation errors appear.
- [ ] **2.3 Sign Out Data Purge:** Log in, add data, click Sign Out. Inspect `localStorage`, `sessionStorage`, and IndexedDB; verify zero cached financial records remain.
- [ ] **2.4 Account Deletion (Two-Step):** Open Profile modal, click "Delete Account", enter password confirmation, and confirm deletion. Verify all user records are removed from PostgreSQL.

### Suite 3: Financial Calculations & Math Expressions
- [ ] **3.1 Math Evaluator in Amount Input:** Enter `250 + 150 * 2` into Amount field. Confirm calculation evaluates correctly to `₹550.00`.
- [ ] **3.2 Integer-Paise Precision:** Create expenses of `₹10.33`, `₹20.33`, and `₹30.34`. Confirm monthly total displays exactly `₹61.00` with zero floating point drift.
- [ ] **3.3 Budget Threshold Boundary:** Set budget limit to `₹50,000`. Log expenses totaling `₹40,000` (80%). Confirm warning indicator activates precisely at the 80% threshold.

### Suite 4: Autopay & Calendar Clamping
- [ ] **4.1 Autopay Creation:** Add monthly plan for Netflix on the 15th. Verify card appears in Autopay tab.
- [ ] **4.2 Month-End Clamping:** Add autopay on the 31st. Simulate February in non-leap year; verify due date clamps safely to February 28th.
- [ ] **4.3 Recurring Suggestions:** Log three identical recurring expenses. Confirm Recurring Suggestions card suggests converting to Autopay plan.

### Suite 5: Bank CSV Import & Rule Learning
- [ ] **5.1 Column Mapping:** Upload bank CSV. Confirm automatic column detection for Date, Amount, Description, and Category.
- [ ] **5.2 Duplicate Detection:** Re-upload the same statement. Confirm duplicates are detected and skipped without duplicating rows.
- [ ] **5.3 Rule Learning:** Correct an uncategorized merchant (e.g., "Swiggy" to "Food & Dining"). Upload new statement; verify Swiggy is auto-categorized.

### Suite 6: Passphrase-Encrypted Backup & Portability
- [ ] **6.1 Client Encryption:** Open Encrypted Backup modal. Enter passphrase and export `.enc` file.
- [ ] **6.2 Checksum Verification:** Attempt importing tampered JSON backup. Confirm application detects corrupted checksum and rejects import.
- [ ] **6.3 Decryption & Restore:** Import valid `.enc` file with passphrase. Confirm 100% of transactions and plans restore accurately.

### Suite 7: Offline-First Synchronization
- [ ] **7.1 Offline Queuing:** Turn off network in DevTools. Create a transaction. Verify sync status badge shows "Queued offline".
- [ ] **7.2 Background Sync:** Re-enable network. Verify transaction synchronizes silently and status badge returns to "Synced".
