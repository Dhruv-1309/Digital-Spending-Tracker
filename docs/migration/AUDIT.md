# MoneyTracker Repository Audit

## 1. Vanilla App Files and Responsibilities

- **`index.html`**: Main HTML structure for the Single Page Application.
  - Hosts the full Authentication modal with decorative blob animations, email/password form, and Google sign-in.
  - Hosts the application container, header with branding, user badge, profile and logout triggers.
  - Hosts the main tab navigation (Dashboard, Add Transaction, Transactions, Autopay, Analytics).
  - Contains markup for all 5 tab views:
    - **Dashboard**: Income/Expense/Balance stat cards, Monthly Budget Goal widget with expandable settings form, Weekly Activity chart, Anomaly Detection alert container, Recent Transactions list.
    - **Add Transaction**: Amount hero input (₹), type select, custom date picker wrapper, category select with inline custom category adder, payment method select, description input, and submit button.
    - **Transactions**: Header with count badge, export format selector (CSV Detailed, CSV Basic, JSON Backup), export button, import CSV file trigger & hidden file input, new transaction shortcut button, filter toolbar (search text, type filter, dynamic month filter, sort selector), transaction list container, and pagination bar.
    - **Autopay**: Add Recurring Plan form with custom day-of-month picker (days 1–31 and "Last Day"), summary monthly flow counter (+Income / -Expense), active/paused recurring cards list, and upcoming monthly occurrences list.
    - **Analytics**: Quick preset range buttons (This Week, This Month, Last 30 Days), period/month/year filter selects, summary cards (Income, Expenses, Net, Transaction Count), Daily Expenses bar chart, Expense by Category doughnut chart, Time Series trend chart with 7-day SMA forecasting and statistics, and Day-of-Week spending heatmap bar chart with stats and insights.
  - Hosts the Profile Modal (account metadata, display name form, password update/set form, account deletion with two-step confirmation).
  - Hosts the floating Toast container (`#toastContainer`) and accessible confirmation dialog (`#confirmModal`).

- **`styles.css`**: Complete styling suite (3,990 lines) written in vanilla CSS.
  - Defines typography using system font stack (`'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`).
  - Colors, elevation/shadows, card layouts, and CSS transitions.
  - Custom component styles: `.custom-select-wrapper`, `.custom-options`, `.custom-option`, `.ripple`, `.custom-datepicker-wrapper`, `.datepicker-dropdown`, `.autopay-day-calendar`, `.budget-progress-track`, `.stat-card`, `.tx-card`, `.toast`, `.confirm-modal`, `.profile-modal`.
  - Comprehensive media queries for tablet and mobile responsive layouts.

- **`script.js`**: Core client application logic (5,109 lines).
  - Encapsulates state within `const MoneyTracker`: transactions, active tab, approved anomalies, autopays, budget goals, analytics cache, pagination state, and pending sync flags.
  - Handles Firestore data synchronization with exponential backoff retry and offline persistence tracking (`persistDocWithRetry`, `retryPendingSync`).
  - Implements statistical calculations: Z-score anomaly detection, 7-day Simple Moving Average (SMA) forecast with coefficient of variation confidence, money runway prediction (balance depletion days and burn rate), and day-of-week aggregations.
  - Handles automated autopay processing against calendar days.
  - Implements CSV export (Detailed, Basic), JSON backup export, and CSV file importing with line parsing and duplicate detection.
  - Manages UI widgets: custom select dropdowns with keyboard navigation and ripple effect, custom date picker with month calendar grid, toast alerts, and modal dialogs.
  - Integrates Firebase Auth (email/password, Google sign-in, password reset, profile updates, account deletion cascade).

- **`config.example.js`**: Template file showing the expected window configuration object (`window.__APP_CONFIG__`).
- **`config.public.js`**: Fallback configuration file used in hosted environments.
- **`favicon.svg`**: Wallet vector icon used for the browser tab favicon.

---

## 2. Current State of `app/`

- **Build Tooling & Scaffolding**: Standard Vite + React + TypeScript project created using `rolldown-vite` / Vite.
- **`package.json` Dependencies**:
  - `dependencies`:
    - `react`: `^19.2.0`
    - `react-dom`: `^19.2.0`
  - `devDependencies`:
    - `@eslint/js`: `^9.39.1`
    - `@types/node`: `^24.10.1`
    - `@types/react`: `^19.2.5`
    - `@types/react-dom`: `^19.2.3`
    - `@vitejs/plugin-react`: `^5.1.1`
    - `babel-plugin-react-compiler`: `^1.0.0`
    - `eslint`: `^9.39.1`
    - `eslint-plugin-react-hooks`: `^7.0.1`
    - `eslint-plugin-react-refresh`: `^0.4.24`
    - `globals`: `^16.5.0`
    - `typescript`: `~5.9.3`
    - `typescript-eslint`: `^8.46.4`
    - `vite`: `npm:rolldown-vite@7.2.5`
  - `overrides`:
    - `vite`: `npm:rolldown-vite@7.2.5`
- **Folder Structure**:
  - `app/public/`: Contains default `vite.svg`.
  - `app/src/`: Contains `assets/react.svg`, `App.css`, `App.tsx` (default Vite counter template), `index.css`, `main.tsx`.
  - `app/`: Contains `.gitignore`, `eslint.config.js`, `index.html`, `package.json`, `package-lock.json`, `README.md`, `tsconfig.app.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`.
- **Existing Work Built**: None. It is purely the boilerplate starter template from Vite.

---

## 3. Calculation and Data Operation Functions

| File | Function Name | Inputs | Outputs | Description |
| :--- | :--- | :--- | :--- | :--- |
| `script.js` | `detectSpendingAnomalies(threshold = 2)` | `threshold: number` (default `2`), reads `this.transactions` | `{ anomalies: Array<Anomaly>, categoryStats: Object, totalAnomalies: number, threshold: number }` | Filters expense transactions, groups by category, skips categories with `< 3` transactions, computes mean & stdDev, flags expenses with `(amount - mean) / stdDev > threshold`. |
| `script.js` | `calculateMoneyRunway(avgDailySpend)` | `avgDailySpend: number`, reads `this.transactions` | `{ balance: number, daysRemaining: number \| Infinity, depletionDate: string, burnRatePercent: string }` | Computes current balance (`income - expenses`). If `balance <= 0`, days remaining is `0`. If `avgDailySpend <= 0`, days remaining is `Infinity`. Otherwise `floor(balance / avgDailySpend)` and calculates depletion date & daily burn rate %. |
| `script.js` | `calculateSMAForecast(dates, amounts, window = 7, forecastDays = 7)` | `dates: string[]`, `amounts: number[]`, `window: number`, `forecastDays: number` | `{ forecastDates: string[], forecastAmounts: number[], smaValue: number, totalForecast: number, confidence: 'high' \| 'medium' \| 'low', window: number, forecastDays: number, coefficientOfVariation: number }` | Computes average of the last `window` data points, forecasts next `forecastDays`, computes variance, standard deviation, and coefficient of variation (`stdDev / smaValue * 100`) to determine confidence (`>50%` low, `>30%` medium, `<=30%` high). |
| `script.js` | `checkAndProcessAutopays()` | None (reads clock, `this.autopays`, `this.transactions`) | `void` | Checks active autopays; skips if already processed in current month (`lastProcessed` has matching month/year). Determines due day (resolving `'last'` to days in month); if `currentDay >= autopayDay`, invokes `processAutopay`. |
| `script.js` | `processAutopay(autopay, year, month, day)` | `autopay: AutopayItem, year: number, month: number, day: number` | `void` | Creates transaction tagged `[Autopay]` or `[Recurring Income]`, unshifts to `this.transactions`, sets `autopay.lastProcessed = new Date().toISOString()`, and saves both documents to cloud. |
| `script.js` | `getExpensesByDayOfWeek(transactions)` | `transactions?: Transaction[]` (default `this.transactions`) | `{ dayTotals: Record<string, number>, dayAverages: Record<string, number>, dayCounts: Record<string, number>, totalExpenses: number, maxDay: string, maxAmount: number, minDay: string, minAmount: number, isEmpty: boolean }` | Aggregates expense transactions by day index (Sunday–Saturday mapped to Monday–Sunday order), computes total, average per transaction, and identifies highest/lowest spending days. |
| `script.js` | `performTimeSeriesAnalysis(transactions)` | `transactions?: Transaction[]` (default `this.transactions`) | `{ dates: string[], rawDates: string[], amounts: number[], stats: { totalDays: number, daysWithSpending: number, daysWithoutSpending: number, averageDailySpending: number, maxSpending: number, minSpending: number, totalSpending: number } }` | Groups expenses by date, fills all gaps between earliest and latest dates with `0`, and calculates daily spending averages and extremes. |
| `script.js` | `getCurrentMonthRange()` | None (reads system clock) | `{ start: Date, end: Date }` | Returns `start` (1st of month 00:00:00.000) and `end` (last day of month 23:59:59.999). |
| `script.js` | `getCurrentMonthExpenses()` | None (reads `this.transactions`) | `number` | Sums all expense amounts where transaction date falls within `getCurrentMonthRange()`. |
| `script.js` | `checkBudgetThreshold(currentSpent, limit, thresholdPercent)` | `currentSpent: number, limit: number, thresholdPercent: number` | `void` | Evaluates monthly spending against budget limit and warning threshold (`limit * threshold / 100`). Triggers warnings when transitioning to 'warning' or 'over'. Tracks `this.budgetAlertState.level` and resets per monthKey. |
| `script.js` | `renderBudgetGoal(currentMonthExpenses)` | `currentMonthExpenses?: number \| null` | `void` | Calculates spent percentage, clamped percentage (0–100) for progress width, remaining amount or amount over, determines status chip (`"Not set"`, `"On track"`, `"Near limit"`, `"Over budget"`), and invokes `checkBudgetThreshold`. |
| `script.js` | `getAnalyticsCacheKey()` | None (reads DOM selects, `selectedQuickPreset`, `transactionsRevision`) | `string` | Formats cache key: `${transactionsRevision}\|${preset}\|${period}\|${year}\|${month}`. |
| `script.js` | `getAnalyticsRange()` | None (reads `selectedQuickPreset`, period, month, year dropdowns) | `{ start: Date, end: Date } \| null` | Resolves date boundaries for `"this-week"` (Monday to today end), `"this-month"`, `"last-30-days"`, or period `"monthly"`, `"yearly"`, or `null` for `"overall"`. |
| `script.js` | `getAnalyticsTransactions()` | None | `Transaction[]` | Returns cached transactions matching `getAnalyticsCacheKey()` or computes filtered array using `getAnalyticsRange()` and caches it. |
| `script.js` | `isDateInRange(dateStr, start, end)` | `dateStr: string, start: Date, end: Date` | `boolean` | Checks if parsed `dateStr` is between `start` and `end` inclusive. |
| `script.js` | `parseCsvLine(line)` | `line: string` | `string[]` | Parses CSV row respecting double quotes and escaped quotes (`""`). |
| `script.js` | `toCsvSafeValue(value)` | `value: any` | `string` | Returns quoted string with all internal double quotes escaped as `""`. |
| `script.js` | `exportTransactions()` | None | `void` | Exports transactions as `transactions_detailed_{date}.csv`, `transactions_basic_{date}.csv`, or `moneytracker_backup_{date}.json` blob download. |
| `script.js` | `importTransactionsFromCsvFile(file)` | `file: File` | `Promise<void>` | Reads file text, identifies column mapping from header, deduplicates against existing records via signature string `${date}\|${type}\|${amount.toFixed(2)}\|${category}\|${description}`, normalizes fields, prepends new records to `this.transactions`, saves to Firestore. |
| `script.js` | `persistDocWithRetry(docName, payload, options)` | `docName: string, payload: object, options: { retries?: number, delayMs?: number, markPendingKey?: string, silent?: boolean }` | `Promise<boolean>` | Attempts Firestore set with exponential backoff (`delayMs * 2^attempt`). Marks `this.pendingSync[markPendingKey]` on failure; displays toast if offline or sync fails unless silent. |
| `script.js` | `retryPendingSync()` | None | `Promise<void>` | When connection returns, replays pending writes for transactions, categories, anomalies, autopays, and budgetGoal; displays success toast if all succeed. |
| `script.js` | `getDaySuffix(day)` | `day: number` | `string` | Returns ordinal suffix (`"st"`, `"nd"`, `"rd"`, `"th"`). |

---

## 4. Firestore Reads and Writes

| Document Path | Operation | Data Shape | When Called |
| :--- | :--- | :--- | :--- |
| `users/{uid}/data/transactions` | **Read** (`.get()`) | `{ items: Transaction[], updatedAt?: Timestamp }` | `MoneyTracker.loadTransactions()` during initial load after authentication. |
| `users/{uid}/data/transactions` | **Write** (`.set()`) | `{ items: Transaction[], updatedAt: Date }` | `MoneyTracker.saveTransactions()` when adding a transaction, deleting a transaction, dismissing an anomaly (delete), executing scheduled autopay, or importing CSV transactions. |
| `users/{uid}/data/categories` | **Read** (`.get()`) | `{ items: { income: string[], expense: string[] }, updatedAt?: Timestamp }` | `MoneyTracker.loadCustomCategories()` during app initialization. |
| `users/{uid}/data/categories` | **Write** (`.set()`) | `{ items: { income: string[], expense: string[] }, updatedAt: Date }` | `MoneyTracker.saveCustomCategories()` when adding a custom category via `addCustomCategory()`. |
| `users/{uid}/data/anomalies` | **Read** (`.get()`) | `{ items: string[] (transaction IDs), updatedAt?: Timestamp }` | `MoneyTracker.loadApprovedAnomalies()` during app initialization. |
| `users/{uid}/data/anomalies` | **Write** (`.set()`) | `{ items: string[], updatedAt: Date }` | `MoneyTracker.saveApprovedAnomalies()` when approving an anomaly or dismissing an anomaly that was previously approved. |
| `users/{uid}/data/autopays` | **Read** (`.get()`) | `{ items: AutopayItem[], updatedAt?: Timestamp }` | `MoneyTracker.loadAutopays()` during app initialization. |
| `users/{uid}/data/autopays` | **Write** (`.set()`) | `{ items: AutopayItem[], updatedAt: Date }` | `MoneyTracker.saveAutopays()` when adding, toggling (pause/resume), deleting, or processing an autopay item. |
| `users/{uid}/data/budgetGoal` | **Read** (`.get()`) | `{ monthlyExpenseLimit: number, thresholdPercent: number, updatedAt?: Timestamp }` | `MoneyTracker.loadBudgetGoal()` during app initialization. |
| `users/{uid}/data/budgetGoal` | **Write** (`.set()`) | `{ monthlyExpenseLimit: number, thresholdPercent: number, updatedAt: Date }` | `MoneyTracker.saveBudgetGoal()` when saving from `#budgetGoalForm`. |
| `users/{uid}/data/*` and `users/{uid}` | **Delete** (`.delete()`) | Deletes all docs in `data` subcollection and user doc | In `deleteAccountBtn` click handler after double confirmation in profile modal. |

---

## 5. Firebase Configuration Key Names

The application references the following runtime configuration keys on `window.__APP_CONFIG__` (values are never logged, printed, or committed):
1. `firebaseApiKey`
2. `firebaseAuthDomain`
3. `firebaseProjectId`
4. `firebaseStorageBucket`
5. `firebaseMessagingSenderId`
6. `firebaseAppId`

---

## 6. External Scripts and Stylesheets Loaded in HTML

1. **Font Awesome**:
   - URL: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css`
   - Version: `6.0.0`
2. **Tailwind CSS**:
   - URL: `https://cdn.tailwindcss.com`
   - Version: `3.x` (Play CDN latest build)
3. **Local Stylesheet**:
   - URL: `styles.css?v=3`
   - Version: Local file (cache-busted query `v=3`)
4. **Firebase App Compat**:
   - URL: `https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js`
   - Version: `10.7.1`
5. **Firebase Firestore Compat**:
   - URL: `https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js`
   - Version: `10.7.1`
6. **Firebase Auth Compat**:
   - URL: `https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js`
   - Version: `10.7.1`
7. **Chart.js**:
   - URL: `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js`
   - Version: `3.9.1`
8. **Google Fonts**:
   - No external Google Fonts `<link>` or `@import` is present.
   - The app specifies `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif` directly in `styles.css`.

---

## 7. Tailwind Classes vs Custom CSS in `styles.css`

- **Tailwind Classes Usage**:
  - Confined strictly to the **Authentication Modal** (`#authModal`) and its immediate descendants.
  - Used for layout, flexbox, grid, backdrop blurs, gradients, shadows, text sizing, and color classes (e.g., `fixed inset-0 z-[10000] flex items-center justify-center`, `bg-slate-100/80`, `filter blur-3xl`, `rounded-3xl shadow-xl w-full max-w-md`, `border border-slate-200`, `focus:ring-2 focus:ring-slate-100`, `disabled:opacity-70`).
  - Loading spinner SVGs inside buttons (`animate-spin h-5 w-5`).

- **Custom CSS in `styles.css` Usage**:
  - Covers 100% of the authenticated application interface (`#appContainer`):
    - App Header & brand identity (`.header`, `.brand`, `.brand-icon`, `.user-badge`, `.h-btn`).
    - Tab navigation (`.nav-tabs`, `.nav-tab`).
    - Dashboard cards, income/expense/balance counters, budget progress bars, and recent activity feeds.
    - Add transaction form, large currency hero input, inline custom category addition.
    - Custom select dropdown styling, chevron rotation, ripple effect, option list popup.
    - Custom date picker calendar, month header, weekday header, day grid, today & clear actions.
    - Transactions feed, search input, filter controls, badge counter, pagination buttons.
    - Autopay setup forms, day selector grid (1–31 and Last Day), active/paused card displays, upcoming cards.
    - Analytics toolbar, quick preset pills, period/month/year selectors, summary grid, chart containers, stats breakdown boxes.
    - Toast notification stack (`.toast-container`, `.toast`, `.toast--show`, `.toast--hide`, `.toast--[type]`).
    - Confirm dialog modal (`.confirm-modal`, `.confirm-backdrop`, `.confirm-card`).
    - Profile management modal (`.profile-modal-overlay`, `.profile-modal`, `.danger-zone`).
    - Responsive mobile breakpoints (`@media (max-width: 768px)`, `@media (max-width: 480px)`).

---

## 8. UI Behavior Implemented in JavaScript

- **Animations**:
  - Blob motion: CSS `@keyframes blob` (7s loop with scale and coordinate offsets).
  - Fade-in upwards: CSS `@keyframes fadeInUp` (0.6s ease-out on auth modal card).
  - Shake animation: CSS `@keyframes shake` triggered dynamically on `#authError` by clearing and reapplying `animation` property with `offsetHeight` reflow.
  - Button spinner animations: SVG spin animations and Font Awesome `fa-spinner fa-spin` toggled on submit buttons (`setSignInLoading`, `setSignUpLoading`, `setGoogleLoading`, `setPasswordLoading`, `setSubmitLoading`).
  - Click ripple effect (`createRipple`): Appends a `.ripple` span inside clicked custom options positioned at click coordinates, scaled to element diameter, and automatically removed after 600ms.
  - Toast transitions: Adds `.toast--show` via `requestAnimationFrame` on injection; replaces with `.toast--hide` and awaits `transitionend` before removing from DOM.
  - Cog icon rotation: Rotates `#toggleBudgetFormBtn` 180 degrees (`transform: rotate(180deg)`) when expanding budget form.

- **Transitions**:
  - Tab navigation: Switches `.active` class across tab buttons and corresponding `.tab-content` divs. Triggers view-specific updates (`updateDashboard`, `displayTransactions`, `displayAutopays`, `createCharts`).
  - Dropdown expand/collapse: Toggles `.open` class on `.custom-select-wrapper`, closing other open selects.
  - Date picker expand/collapse: Toggles `.open` class on `#datePickerDropdown` and `.active` on `#datePickerTrigger`.
  - Autopay day picker calendar expand/collapse: Toggles `.active` class on `#autopayDayCalendar`.
  - Budget form drawer expand/collapse: Toggles `.hidden-form` on `#budgetGoalForm`.

- **Focus & Accessibility Handling**:
  - Custom select dropdowns: Focuses first `.custom-option` upon opening; returns focus to trigger on `Escape`.
  - Date picker trigger: Attributes `role="button"`, `tabindex="0"`, `aria-label="Open date picker"`, `aria-haspopup="dialog"`, `aria-expanded`.
  - Form validation: Highlights fields with `.input-error` / `.has-error`, sets `aria-invalid="true"`, appends `.field-error` message elements, and clears errors on subsequent input.
  - Modal dialogs: `aria-modal="true"`, `aria-labelledby`, `aria-describedby` on confirm dialog.

- **Keyboard Shortcuts**:
  - `Enter` inside `#authForm` submits login.
  - `Escape` dismisses open custom dropdowns.
  - `Escape` dismisses open custom date picker.
  - `Escape` cancels and closes `#confirmModal`.
  - Arrow Down / Arrow Up navigates through options in custom select dropdowns.
  - `Enter` or `Space` activates custom select trigger or chooses focused option.
  - `Enter` or `Space` toggles the custom date picker.

- **Modals**:
  - Auth Modal: Full-screen modal overlay active when not logged in.
  - Confirm Modal: Dynamic Promise-based confirmation (`showConfirm(message, options)`) with customizable title, confirm/cancel labels, and variant ('warning' or 'danger'). Resolves `true` on confirm or `false` on cancel/escape/backdrop click.
  - Profile Modal: Opens via `#profileBtn`, closes via close button or clicking outside overlay (`#profileModal`).

- **Date Picker**:
  - Calculates start day and day count for current month, fills previous month and next month padding days with `.other-month` style.
  - Highlights current day with `.today` and selected date with `.selected`.
  - Previous/Next month navigation updates calendar grid in real time.
  - "Today" button selects current date; "Clear" button resets selection and hidden input.
  - Sets hidden `#date` input with ISO string (`YYYY-MM-DD`) and formats display string (`"ddd, D MMM YYYY"`).

- **Toasts**:
  - `showToast(message, type = "info", duration = 3800)` creates polymorphic toast notification (success, error, warning, info) with corresponding Font Awesome icons.
  - Auto-dismisses with timeout; includes close button (`fa-xmark`) for immediate user dismissal.
