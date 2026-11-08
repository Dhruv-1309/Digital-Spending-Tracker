# MoneyTracker Comprehensive User Guide & Calculation Manual

Welcome to **MoneyTracker** (Digital Spending Tracker) — a modern, privacy-first personal finance platform engineered for exact integer financial arithmetic, offline-first reliability, automated recurring autopay orchestration, and statistical spending intelligence.

This document serves as the authoritative reference manual for users, auditors, and operators.

---

## Table of Contents
1. [System Overview & Privacy Stance](#1-system-overview--privacy-stance)
2. [Managing Transactions](#2-managing-transactions)
   - [Adding & Editing Transactions](#21-adding--editing-transactions)
   - [In-Line Math Evaluator](#22-in-line-math-evaluator)
   - [Custom Categories, Renaming & Reassignment](#23-custom-categories-renaming--reassignment)
3. [Policy on Future-Dated Transactions vs. Scheduling (CORE-21)](#3-policy-on-future-dated-transactions-vs-scheduling-core-21)
   - [Intra-Month Forward Entries (Current Month)](#31-intra-month-forward-entries-current-month)
   - [Future-Month Forward Entries (Subsequent Months)](#32-future-month-forward-entries-subsequent-months)
   - [Autopay Scheduling vs. Forward Manual Entries](#33-autopay-scheduling-vs-forward-manual-entries)
   - [Retroactive (Past-Dated) Transactions](#34-retroactive-past-dated-transactions)
4. [Recurring Autopay Engine](#4-recurring-autopay-engine)
   - [Calendar Safety & Month-End Clamping](#41-calendar-safety--month-end-clamping)
   - [Idempotent Single-Execution Guarantee](#42-idempotent-single-execution-guarantee)
5. [Monthly Budget Limits & Visual Thresholds](#5-monthly-budget-limits--visual-thresholds)
6. [Statistical Spending Anomaly Detection](#6-statistical-spending-anomaly-detection)
7. [Analytics, Forecasting & Capital Runway](#7-analytics-forecasting--capital-runway)
8. [Data Sovereignty: Encrypted Backups, CSV & 90-Day Trash](#8-data-sovereignty-encrypted-backups-csv--90-day-trash)
9. [Desktop Keyboard Shortcuts](#9-desktop-keyboard-shortcuts)

---

## 1. System Overview & Privacy Stance

MoneyTracker is built on the philosophy that your personal financial records belong strictly to you:
- **Offline-First:** All mutations (creates, edits, deletes) save immediately to your local browser storage via IndexedDB. You can track spending entirely offline.
- **Zero Third-Party Trackers:** No advertising beacons, cross-site trackers, or third-party analytics scripts exist in the codebase.
- **Client-Side Encryption:** Backups are encrypted directly in your browser before export; passwords and encryption keys never touch a server unhashed.
- **Exact Integer Mathematics:** Money is stored and summed in integer **paise** (1 INR = 100 paise), eliminating standard binary floating-point errors (e.g. `0.1 + 0.2 = 0.30000000000000004`).

---

## 2. Managing Transactions

### 2.1 Adding & Editing Transactions
Transactions can be created through the top navigation pill **"+ New Transaction"** or by pressing the keyboard shortcut `N`.
- **Type:** Expense or Income.
- **Amount:** Stored in integer paise with a validation ceiling of ₹10,00,00,000 (10 Crore).
- **Category:** Assigned from default categories (e.g., Food & Dining, Rent & Housing, Groceries) or custom user-defined categories.
- **Date:** Uses local calendar date format (`YYYY-MM-DD`).
- **Description / Merchant:** Optional memo sanitized against formula injection.

### 2.2 In-Line Math Evaluator
When logging multiple items or splitting costs, you do not need an external calculator. The **Amount** input natively evaluates standard arithmetic expressions:
- Addition: `150 + 220 + 350` → evaluates to `₹720.00`
- Multiplication: `450 * 3` → evaluates to `₹1,350.00`
- Division / Split: `2400 / 4` → evaluates to `₹600.00`
- Mixed Formulas: `(1200 + 300) * 0.5` → evaluates to `₹750.00`

Tabbing away or pressing `Enter` automatically evaluates the expression into formatted rupees and stores the value in exact integer paise.

### 2.3 Custom Categories, Renaming & Reassignment
You can configure custom categories in **Profile > Manage Categories**:
- **Case-Insensitive Uniqueness:** Creating "groceries" when "Groceries" exists is rejected with a descriptive error.
- **Cascade Renaming:** Renaming a category automatically updates all existing transactions and recurring autopay plans associated with that category name.
- **Safe Deletion with Reassignment:** If a category is in use by existing transactions, deleting it requires selecting a replacement category. All matching transactions and autopays are atomically reassigned to the replacement category before deletion.

---

## 3. Policy on Future-Dated Transactions vs. Scheduling (CORE-21)

Financial accounting systems must define predictable semantics for transactions entered with future calendar dates. MoneyTracker enforces the following transparent rules:

### 3.1 Intra-Month Forward Entries (Current Month)
When you log an entry with a future date that falls **within the active calendar month** (for example, today is November 10 and you record a payment scheduled for November 25):
- The transaction is **counted immediately in the current month's expense totals and budget consumption**.
- **Rationale:** In personal budgeting, planned commitments due later in the active month represent *earmarked capital*. Omitting these upcoming expenses would give a false sense of surplus, increasing the risk of overspending before mandatory payments occur.

### 3.2 Future-Month Forward Entries (Subsequent Months)
When you log an entry with a date falling in a **future calendar month** (e.g. December or next year):
- The transaction is **excluded** from the current month's spending cards, dashboard summary, and active budget calculation.
- It is saved in your ledger under that future month's calendar partition.
- It becomes active and counted when that calendar month arrives or when filtering transactions by that specific month in the Transactions tab.

### 3.3 Autopay Scheduling vs. Forward Manual Entries
For regular recurring bills, EMIs, or subscriptions:
- **Do not** manually log recurring future-dated transactions month after month.
- **Instead, use an Autopay Plan:** Setting up a plan in the **Autopay** tab ensures that:
  1. The transaction is generated automatically on the exact due day each month.
  2. Shorter months (e.g. 28, 29, 30 days) are safely clamped without skipped payments.
  3. Single-execution idempotency is enforced, avoiding duplicate records across multiple browser sessions.

Manual future-dated entries should strictly be reserved for **one-off known future events** occurring within the current billing cycle.

### 3.4 Retroactive (Past-Dated) Transactions
You can enter past-dated transactions at any time. When a past entry is recorded:
- Monthly historical totals for that respective period recalculate instantly.
- The 7-day Simple Moving Average (SMA) and category Z-score anomaly baselines update retroactively without mathematical drift.

---

## 4. Recurring Autopay Engine

The Autopay engine coordinates monthly recurring commitments (EMIs, utility bills, SaaS subscriptions, SIP investments):

### 4.1 Calendar Safety & Month-End Clamping
Real-world months vary in length from 28 to 31 days. Autopay handles these variations automatically:
- **Day 29, 30, or 31 Clamping:** If an Autopay plan is set for day 31, it executes on:
  - January 31, March 31, May 31, July 31, August 31, October 31, December 31
  - April 30, June 30, September 30, November 30
  - February 28 (non-leap years) or February 29 (leap years such as 2024, 2028, 2400)
- **"Last Day" Setting:** Automatically resolves to the true final day of the active calendar month across all timezones.

### 4.2 Idempotent Single-Execution Guarantee
The engine guarantees that **exactly one transaction is generated per plan per calendar month**.
- Repeated page loads, app launches, and simultaneous access across multiple devices will never duplicate an autopay transaction.
- Each generation attaches a deterministic period key (`YYYY-MM`) and unique idempotency identifier.

---

## 5. Monthly Budget Limits & Visual Thresholds

You can configure a monthly spending ceiling in the Dashboard or Profile modal. Progress is tracked using precise integer paise arithmetic:

| Threshold | Status Name | Visual Styling | User Action |
| :--- | :--- | :--- | :--- |
| **&lt; 80.00%** | **On Track** | Emerald progress bar &amp; badge | Normal spending pace |
| **80.00% – 99.99%** | **Near Limit** | Amber warning indicator | Warning: remaining funds highlighted |
| **100.00%** | **At Limit** | Rose warning badge | Exactly ₹0.00 remaining |
| **&gt; 100.00%** | **Over Budget** | Crimson danger badge &amp; alert | Overspending amount clearly detailed |

Strict boundary evaluation prevents off-by-one errors (e.g. 79.99% is strictly "On track", while 80.00% triggers "Near limit").

---

## 6. Statistical Spending Anomaly Detection

To detect unexpected charges or subscription price hikes, MoneyTracker evaluates transactions using category-specific Z-scores:

$$\text{Z-Score} = \frac{x - \mu}{\sigma}$$

Where:
- $x$ is the candidate transaction amount in paise.
- $\mu$ is the historical mean expenditure for that category.
- $\sigma$ is the sample standard deviation for that category.

### Anomaly Rules:
1. **Minimum Sample Size:** Anomaly detection activates only after **at least 3 historical transactions** exist in that category. Categories with fewer than 3 transactions are never flagged.
2. **Threshold:** Transactions with a Z-score greater than **2.0** ($Z > 2.0$, or more than 2 standard deviations above the average) are marked as anomalous.
3. **Review & Adaptability:** Users can click **"Approve"** on any flagged transaction in the Dashboard or Transactions tab. Approving marks the entry as verified by the user, incorporating the higher spend into the baseline so future legitimate expenses are not repeatedly flagged.

---

## 7. Analytics, Forecasting & Capital Runway

The Analytics tab provides forward-looking visibility using conservative statistical models:

### 7.1 7-Day Simple Moving Average (SMA) Forecast
Rather than assuming linear spend across a month, MoneyTracker measures your actual burn rate over the last 7 calendar days:
$$\text{Average Daily Burn} = \frac{\sum_{i=1}^{7} \text{Daily Expense}_i}{7}$$
This daily burn rate is projected across the remaining calendar days of the month to estimate total month-end expenditure.

### 7.2 Capital Runway
Capital Runway indicates how many days your net liquid funds will sustain your current lifestyle:
$$\text{Days Remaining} = \frac{\text{Net Cash Balance}}{\text{Average Daily Spend}}$$
- **Sustainable State:** If monthly net income is positive or daily expense is ₹0.00, the runway card displays **"N/A (Sustainable)"** rather than an infinite or negative number.
- **Negative Balance:** If net balance is below zero, runway displays 0 days with clear guidance to rebalance funds.

---

## 8. Data Sovereignty: Encrypted Backups, CSV & 90-Day Trash

### 8.1 Client-Side Encrypted Backups (.enc)
In **Transactions > Export/Import > Encrypted Backup**, you can download an encrypted snapshot of your complete database:
- **Cipher:** AES-GCM (256-bit symmetric key).
- **Key Derivation:** PBKDF2 with SHA-256 and **100,000 iterations**.
- **Entropy:** 16-byte cryptographically secure random salt + 12-byte initialization vector (IV).
- **Security:** Decryption requires your passphrase. Server operators and database administrators cannot read your `.enc` backup.

### 8.2 CSV & JSON Round-Trip Import/Export
- Supports RFC 4180 CSV export and import.
- Handles UTF-8 BOM, quoted multi-line fields, and Windows/Mac line endings.
- Formulas beginning with `=`, `+`, `-`, or `@` are sanitized with leading single quotes to prevent CSV injection vulnerabilities (OWASP CWE-1236).

### 8.3 Recoverable Soft-Delete (90-Day Trash)
- When a transaction is deleted, an **interactive 6-second toast** appears with a single-click **"Undo"** action.
- Deleted transactions move to the **Trash** and remain recoverable for 90 days before automatic permanent purge.

---

## 9. Desktop Keyboard Shortcuts

Accelerate your financial workflow with built-in desktop keybindings:

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| `N` | **New Transaction** | Opens the Add Transaction slide-over form (when no input is focused) |
| `Ctrl + B` / `Cmd + B` | **Toggle Sidebar** | Smoothly switches between expanded rail (256px) and compact rail (68px) |
| `Escape` | **Close Dialog** | Closes active slide-over panels, modals, and bottom sheets |
| `Enter` / `Tab` | **Evaluate Formula** | Evaluates math formulas in the Amount input field |
| `?` | **Help & Docs** | Navigates to the Knowledge Base and FAQ page |

---

For technical architecture, database schemas, and disaster recovery playbooks, consult [`docs/RUNBOOK.md`](RUNBOOK.md).
