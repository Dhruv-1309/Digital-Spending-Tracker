# MoneyTracker UI/UX Redesign - Baseline Report (Phase 0)

Date: Nov 2, 2026
Branch: `redesign/ui-v1`
Tag: `pre-redesign`

## 1. Safety and Git Foundation
- **Base Branch:** `v3-fullstack` (commit `a6120c0`)
- **Redesign Branch:** `redesign/ui-v1`
- **Baseline Git Tag:** `pre-redesign`
- **Remote Operations:** None (`git push` forbidden; `master` untouched).

## 2. Test Suite Status
- **Framework:** Vitest 5.0.5 + Testing Library
- **Total Test Files:** 13
- **Total Tests:** 53 passed (0 failing, 0 skipped)
  - `src/test/categories.test.ts` (2 tests)
  - `src/test/transactions.test.ts` (8 tests)
  - `src/test/validation.test.ts` (3 tests)
  - `src/test/anomalies.test.ts` (2 tests)
  - `src/test/analytics.test.ts` (9 tests)
  - `src/test/formatters.test.ts` (3 tests)
  - `src/test/autopay.test.ts` (4 tests)
  - `src/test/budget.test.ts` (3 tests)
  - `src/test/ui_primitives.test.tsx` (6 tests)
  - `src/test/smoke.test.ts` (1 test)
  - `src/test/services.test.ts` (2 tests)
  - `src/test/syncQueue.test.ts` (5 tests)
  - `src/test/feature_components.test.tsx` (5 tests)

## 3. Build & Bundle Size Baseline
- **Build Command:** `npm --workspace=apps/web run build` (`tsc -b && vite build`)
- **TypeScript:** 0 errors
- **Linter (`eslint .`):** 0 errors (19 warnings in legacy services)
- **Asset Breakdown:**
  - `dist/index.html`: 0.98 kB (gzipped: 0.51 kB)
  - `dist/assets/index-CGcL2YyN.css`: 65.91 kB (gzipped: 13.10 kB)
  - `dist/assets/apiClient-BpjPGimM.js`: 0.08 kB (gzipped: 0.09 kB)
  - `dist/assets/index-CbiTYsJz.js`: 720.90 kB (gzipped: 223.63 kB)
- **Total Gzipped Bundle:** **237.33 kB** (Budget: < 350 kB)

## 4. Screen and Component Inventory

### Screens & Views
| Screen | File | Key Current Elements |
| --- | --- | --- |
| Auth Modal | `src/components/auth/AuthModal.tsx` | Centered modal, email/password fields, Google button, forgot password inline |
| Dashboard | `src/components/dashboard/DashboardTab.tsx` | Balance, income, expense cards, budget progress, 7-day weekly activity chart, anomaly alert cards, recent transactions feed |
| Weekly Chart | `src/components/dashboard/WeeklyActivityChart.tsx` | Chart.js line chart with gradients |
| Add Transaction | `src/components/transactions/AddTransactionTab.tsx` | Large amount input, type custom dropdown, custom date picker, custom category & payment dropdowns |
| Transactions | `src/components/transactions/TransactionsTab.tsx` | Filter bar (search, type, month, sort), transaction list cards, export/import buttons, 20-item pagination |
| Autopay | `src/components/autopay/AutopayTab.tsx` | Add plan form, monthly flow card, autopay list with status toggle and day-of-month grid, upcoming list |
| Analytics | `src/components/analytics/AnalyticsTab.tsx` | Preset buttons (This Week, This Month, Last 30 Days), period dropdowns, 4 summary cards, Daily Expenses bar chart, Category doughnut, Time Series & 7-day SMA forecast, Runway card, Day-of-week heatmap |
| Profile | `src/components/profile/ProfileModal.tsx` | Account info, display name edit, password reset, Danger Zone account deletion |

### Primitives & Layout
| Component | File | Current Mechanism |
| --- | --- | --- |
| App Shell | `src/components/layout/AppLayout.tsx` | Top header + horizontal navigation tabs |
| Header | `src/components/layout/Header.tsx` | Title, user email badge, profile button, sign-out |
| Navigation Tabs | `src/components/layout/NavigationTabs.tsx` | 5 tab buttons (Dashboard, Add, Transactions, Autopay, Analytics) |
| Date Picker | `src/components/common/CustomDatePicker.tsx` | Custom popup calendar with month/year navigation |
| Select Dropdown | `src/components/common/CustomSelect.tsx` | Custom dropdown with options list |
| Autopay Day Picker | `src/components/common/AutopayDayPicker.tsx` | 1-31 grid + Last Day button |
| Confirm Modal | `src/components/common/ConfirmModal.tsx` | Global confirmation dialog for deletions |
| Toast Container | `src/components/common/ToastContainer.tsx` | Bottom-right toast stack (success, error, warning, info) |

### Legacy CSS Inventory
- `src/styles/legacy.css`: 2,139 lines (78 kB). Contains legacy visual styles (`.btn-primary`, `.card`, `.modal-overlay`, `.table-container`, `.toast-item`, `.tab-btn`), hardcoded color palettes (`#1a1f36`, `#4f46e5`, `#10b981`, `#ef4444`), and Font Awesome classes (`fa`, `fa-*`).

## 5. Baseline Screenshots Archive
Baseline snapshots preserved in `docs/redesign/baseline/`:
- `auth-1440.png`, `auth-390.png`
- `dashboard-1440.png`, `dashboard-390.png`
- `add-transaction-1440.png`, `add-transaction-390.png`
- `transactions-1440.png`, `transactions-390.png`
- `autopay-1440.png`, `autopay-390.png`
- `analytics-1440.png`, `analytics-390.png`
- `profile-modal-1440.png`, `profile-modal-390.png`
- `confirm-modal-1440.png`, `confirm-modal-390.png`
- `toast-1440.png`, `toast-390.png`
