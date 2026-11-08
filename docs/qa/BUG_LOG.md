# Historical Bug & Defect Resolution Log (QA-18)

This log records notable defects, edge-case regressions, and their permanent structural resolutions across development phases.

---

## Logged Issues & Structural Fixes

### BUG-001: Floating-Point Summation Drift in Monthly Totals
- **Symptom:** Adding multiple 2-decimal fractional transactions (e.g. ₹19.99 + ₹29.99) caused JavaScript floating-point artifacts like `₹49.980000000000004` on the dashboard.
- **Root Cause:** Direct IEEE-754 binary floating-point addition in client reduce callbacks.
- **Permanent Fix:** Migrated all arithmetic across `@moneytracker/shared`, API schemas, and PostgreSQL columns to integer paise (`rupeesToPaise` and `paiseToRupees`). Enforced via fast-check property tests in `packages/shared/test/property_math.test.ts`.

### BUG-002: Calendar Day Clamping Failure on Leap Years
- **Symptom:** Autopays scheduled for the 31st failed with invalid date exceptions when evaluated against February in leap years.
- **Root Cause:** Naive month length lookup table did not factor in 0-indexed vs 1-indexed month arguments.
- **Permanent Fix:** Implemented standard `getClampedDueDay(targetDay, year, monthZeroIndexed)` utilizing `new Date(year, monthZeroIndexed + 1, 0).getDate()` to clamp dynamically to 28 or 29 days.

### BUG-003: UTF-8 Byte Order Mark (BOM) CSV Import Rejection
- **Symptom:** CSV statements exported from Microsoft Excel on Windows were rejected with "Missing required Date or Amount column" error.
- **Root Cause:** Excel prepends the UTF-8 BOM (`\uFEFF`) to the first column header (`\uFEFFDate`), breaking string matching against `'date'`.
- **Permanent Fix:** Added automatic BOM stripping in `parseCsvRecords`: `cleanContent = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;`.

### BUG-004: Silent Account Creation on Sign-In Typos
- **Symptom:** Entering an incorrect password on a mis-typed email address created a brand-new empty account without warning.
- **Root Cause:** Legacy unified `signInOrCreateUser` flow combined sign-in and sign-up into a single form.
- **Permanent Fix:** Completely decoupled Sign In and Sign Up into distinct segmented flows with distinct endpoints (`/auth/login` vs `/auth/register`).

### BUG-005: Stale Auth Listener Overwriting Demo Mode State
- **Symptom:** Clicking "Explore Demo Mode" loaded sample data, but Firebase's background auth state listener asynchronously fired with `null`, resetting the visitor to the login screen.
- **Root Cause:** `onAuthStateChanged` callback did not check if the active user was a synthetic `demo_user_visitor`.
- **Permanent Fix:** Added safeguard in `AuthContext`: if current user is `demo_user_visitor`, null auth events from Firebase are ignored.
