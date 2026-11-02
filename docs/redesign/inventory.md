# MoneyTracker Application Inventory

This inventory documents all routes/screens, components, legacy CSS usages, Font Awesome icons, and Chart.js configurations in MoneyTracker prior to the UI/UX redesign.

---

## 1. Routes and Screens

| Screen / View | URL / State Identifier | Primary Purpose |
|---|---|---|
| **Auth Screen / Modal** | Default state when unauthenticated (`!user`) | Sign In, Sign Up, Password Reset, Google OAuth |
| **Dashboard** | Tab `'dashboard'` | Hero balance, income/expense breakdown, monthly budget progress, 7-day weekly activity chart, anomaly alert cards, recent transactions feed |
| **Add Transaction** | Tab `'add-transaction'` | Fast transaction creation with live formatted amount input, type selector, category picker, payment method selector, date picker |
| **Transactions Feed** | Tab `'transactions'` | Full transaction history, search bar, type filtering, category filtering, month filtering, sorting, pagination, CSV import/export, delete with undo |
| **Autopay (Recurring)** | Tab `'autopay'` | Recurring monthly payment plans, active/pause toggles, projected monthly flow banner, upcoming due agenda timeline, day-of-month picker |
| **Analytics & Trends** | Tab `'analytics'` | Spending summary metrics, daily expense bar chart, category doughnut chart, 7-day SMA expense trend time series, runway projection, weekday heatmap |
| **Profile Settings** | Modal (`showProfileModal`) | User account details, display name inline editor, password change, Danger Zone account deletion |
| **Confirm Dialog** | Modal (`confirmModalState`) | Global modal dialog for destructive action confirmations |
| **Toast Notifications** | Overlay (`ToastContainer`) | Temporary alert messages with status badges and optional action buttons (e.g. Undo) |
| **Design System Dev Page** | Route hash `#design` | Component showcase, token inventory, responsive inspection harness |

---

## 2. Component Inventory (`apps/web/src/components`)

| Component | File Path | Exports / Description |
|---|---|---|
| `AnalyticsTab` | `apps/web/src/components/analytics/AnalyticsTab.tsx` | Analytics tab with metric cards, Bar chart, Doughnut chart, Line chart, runway, and heatmap |
| `AuthModal` | `apps/web/src/components/auth/AuthModal.tsx` | Authentication modal with split brand view, sign-in/up toggle, and reset form |
| `AutopayTab` | `apps/web/src/components/autopay/AutopayTab.tsx` | Recurring plans manager, upcoming timeline, monthly flow calculation |
| `AutopayDayPicker` | `apps/web/src/components/common/AutopayDayPicker.tsx` | Dropdown calendar day selector (days 1-31 or last day) for recurring rules |
| `Badge` | `apps/web/src/components/common/Badge.tsx` | Status pill badges and category color tags |
| `Button` | `apps/web/src/components/common/Button.tsx` | Standardized button primitive (`primary`, `secondary`, `danger`, `ghost`, `link`) |
| `Card` | `apps/web/src/components/common/Card.tsx` | Card surface container with optional header, footer, and interactive hover |
| `ConfirmModal` | `apps/web/src/components/common/ConfirmModal.tsx` | High-contrast confirmation modal dialog |
| `CustomDatePicker` | `apps/web/src/components/common/CustomDatePicker.tsx` | Custom accessible calendar popup datepicker |
| `CustomSelect` | `apps/web/src/components/common/CustomSelect.tsx` | Styled custom select dropdown with option search and icons |
| `Input` | `apps/web/src/components/common/Input.tsx` | TextInput, AmountInput (Indian grouping), and SelectInput primitives |
| `ProgressBar` | `apps/web/src/components/common/ProgressBar.tsx` | Animated progress bar with threshold indicator |
| `SegmentedControl` | `apps/web/src/components/common/SegmentedControl.tsx` | Segmented sliding toggle for binary or multi-option choices |
| `Skeleton` | `apps/web/src/components/common/Skeleton.tsx` | Shimmer loading placeholders (`SkeletonCard`, `SkeletonTableRow`, `SkeletonText`) |
| `ToastContainer` | `apps/web/src/components/common/ToastContainer.tsx` | Actionable toast notification stack |
| `Icons` | `apps/web/src/components/common/icons/index.tsx` | 27 clean inline SVG icon components |
| `DashboardTab` | `apps/web/src/components/dashboard/DashboardTab.tsx` | Main dashboard view with KPI metrics, hero balance, and budget meters |
| `WeeklyActivityChart` | `apps/web/src/components/dashboard/WeeklyActivityChart.tsx` | 7-day activity line chart with Chart.js |
| `DesignSystemDevPage` | `apps/web/src/components/dev/DesignSystemDevPage.tsx` | Design system preview, documentation, and headless capture harness |
| `AppLayout` | `apps/web/src/components/layout/AppLayout.tsx` | Responsive shell: 232px desktop left rail, 64px mobile bottom dock |
| `Header` | `apps/web/src/components/layout/Header.tsx` | Top application header with sync status indicator and profile trigger |
| `NavigationTabs` | `apps/web/src/components/layout/NavigationTabs.tsx` | Navigation tab links with icons and active indicators |
| `ProfileModal` | `apps/web/src/components/profile/ProfileModal.tsx` | User profile modal with account management and danger zone |
| `AddTransactionTab` | `apps/web/src/components/transactions/AddTransactionTab.tsx` | Transaction creation form with category memory and date chips |
| `TransactionsTab` | `apps/web/src/components/transactions/TransactionsTab.tsx` | Transaction list with date grouping, search/filter bar, and batch tools |

---

## 3. Legacy CSS Class Usages (`apps/web/src/styles/legacy.css`)

The legacy stylesheet defined monolithic classes and hardcoded color schemes that have been catalogued for elimination:

| Category | Legacy CSS Classes | Original Locations / Files |
|---|---|---|
| **Buttons** | `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-outline`, `.btn-icon` | `AuthModal.tsx`, `TransactionsTab.tsx`, `AutopayTab.tsx`, `ProfileModal.tsx`, `ConfirmModal.tsx` |
| **Cards & Panels** | `.card`, `.card-header`, `.card-body`, `.metric-card`, `.metric-value`, `.metric-label` | `DashboardTab.tsx`, `AnalyticsTab.tsx`, `AutopayTab.tsx`, `TransactionsTab.tsx` |
| **Modals** | `.modal-overlay`, `.modal-container`, `.modal-header`, `.modal-close`, `.modal-body`, `.modal-footer` | `AuthModal.tsx`, `ProfileModal.tsx`, `ConfirmModal.tsx` |
| **Tables & Lists** | `.table-container`, `.table-row`, `.table-header`, `.transaction-item`, `.autopay-item` | `TransactionsTab.tsx`, `AutopayTab.tsx`, `DashboardTab.tsx` |
| **Form Controls** | `.form-control`, `.input-group`, `.datepicker-popup`, `.custom-select-menu`, `.autopay-day-picker-grid` | `CustomDatePicker.tsx`, `CustomSelect.tsx`, `AutopayDayPicker.tsx`, `AddTransactionTab.tsx` |
| **Tabs & Nav** | `.tab-btn`, `.tab-btn-active`, `.nav-rail-item`, `.bottom-nav-item` | `NavigationTabs.tsx`, `AppLayout.tsx` |
| **Toasts** | `.toast-item`, `.toast-success`, `.toast-error`, `.toast-warning`, `.toast-info` | `ToastContainer.tsx` |

---

## 4. Font Awesome Icon Inventory

Font Awesome (`fa`, `fas`, `far`) classes and icons used across the codebase before redesign:

| Icon Class | Icon Name | Components / Usages |
|---|---|---|
| `fa-wallet` | Wallet | `Header.tsx`, `CustomSelect.tsx`, `DashboardTab.tsx` |
| `fa-chart-line` | Chart Line | `NavigationTabs.tsx`, `WeeklyActivityChart.tsx`, `CustomSelect.tsx` |
| `fa-chart-pie` | Chart Pie | `NavigationTabs.tsx`, `AnalyticsTab.tsx` |
| `fa-chart-bar` | Chart Bar | `AnalyticsTab.tsx` |
| `fa-chart-area` | Chart Area | `AnalyticsTab.tsx` |
| `fa-plus-circle` | Plus Circle | `NavigationTabs.tsx`, `AddTransactionTab.tsx`, `AutopayTab.tsx` |
| `fa-plus` | Plus | `TransactionsTab.tsx`, `AddTransactionTab.tsx`, `AutopayTab.tsx` |
| `fa-list` | List | `NavigationTabs.tsx` |
| `fa-list-check` | List Check | `AutopayTab.tsx` |
| `fa-sync-alt` | Sync Alt | `NavigationTabs.tsx`, `Header.tsx` |
| `fa-arrow-up` | Arrow Up | `DashboardTab.tsx`, `TransactionsTab.tsx`, `AddTransactionTab.tsx`, `CustomSelect.tsx` |
| `fa-arrow-down` | Arrow Down | `DashboardTab.tsx`, `TransactionsTab.tsx`, `AddTransactionTab.tsx`, `CustomSelect.tsx` |
| `fa-arrow-right` | Arrow Right | `AuthModal.tsx` |
| `fa-calendar` | Calendar | `AutopayTab.tsx`, `TransactionsTab.tsx`, `CustomSelect.tsx` |
| `fa-calendar-alt` | Calendar Alt | `CustomDatePicker.tsx`, `AutopayTab.tsx`, `CustomSelect.tsx` |
| `fa-calendar-day` | Calendar Day | `AutopayDayPicker.tsx` |
| `fa-trash` / `fa-trash-alt` | Trash / Trash Alt | `TransactionsTab.tsx`, `AutopayTab.tsx`, `ProfileModal.tsx` |
| `fa-chevron-down` | Chevron Down | `CustomDatePicker.tsx`, `CustomSelect.tsx`, `AutopayDayPicker.tsx` |
| `fa-chevron-left` | Chevron Left | `CustomDatePicker.tsx`, `TransactionsTab.tsx` |
| `fa-chevron-right` | Chevron Right | `CustomDatePicker.tsx`, `TransactionsTab.tsx` |
| `fa-search` | Search | `TransactionsTab.tsx` |
| `fa-file-import` | File Import | `TransactionsTab.tsx` |
| `fa-download` | Download | `TransactionsTab.tsx` |
| `fa-times` / `fa-xmark` | Times / Xmark | `ConfirmModal.tsx`, `ProfileModal.tsx`, `DashboardTab.tsx` |
| `fa-user` | User | `Header.tsx`, `ProfileModal.tsx` |
| `fa-id-card` | ID Card | `ProfileModal.tsx` |
| `fa-envelope` | Envelope | `AuthModal.tsx` |
| `fa-lock` | Lock | `AuthModal.tsx`, `ProfileModal.tsx` |
| `fa-key` | Key | `ProfileModal.tsx` |
| `fa-eye` / `fa-eye-slash` | Eye / Eye Slash | `AuthModal.tsx`, `ProfileModal.tsx` |
| `fa-shield-alt` | Shield Alt | `AuthModal.tsx` |
| `fa-sign-out-alt` | Sign Out Alt | `Header.tsx` |
| `fa-save` | Save | `ProfileModal.tsx` |
| `fa-tag` | Tag | `AutopayTab.tsx` |
| `fa-folder` | Folder | `AutopayTab.tsx` |
| `fa-align-left` | Align Left | `AddTransactionTab.tsx`, `AutopayTab.tsx` |
| `fa-pause` / `fa-play` | Pause / Play | `AutopayTab.tsx` |
| `fa-triangle-exclamation` / `fa-exclamation-triangle` | Exclamation Triangle | `ConfirmModal.tsx`, `ProfileModal.tsx`, `DashboardTab.tsx` |
| `fa-exclamation-circle` | Exclamation Circle | `AuthModal.tsx`, `ProfileModal.tsx` |
| `fa-check-circle` | Check Circle | `AuthModal.tsx`, `ToastContainer.tsx` |
| `fa-info-circle` | Info Circle | `ProfileModal.tsx`, `ToastContainer.tsx` |
| `fa-clock` | Clock | `DashboardTab.tsx` |
| `fa-fire` | Fire | `AnalyticsTab.tsx` |
| `fa-crystal-ball` | Crystal Ball | `AnalyticsTab.tsx` |
| `fa-hourglass-half` | Hourglass Half | `AnalyticsTab.tsx` |
| `fa-money-bill-wave` | Cash | `CustomSelect.tsx` |
| `fa-credit-card` | Credit Card | `CustomSelect.tsx` |
| `fa-university` | Bank Transfer | `CustomSelect.tsx` |
| `fa-mobile-alt` | UPI | `CustomSelect.tsx` |
| `fa-utensils` | Food & Dining | `CustomSelect.tsx` |
| `fa-car` | Transportation | `CustomSelect.tsx` |
| `fa-film` | Entertainment | `CustomSelect.tsx` |
| `fa-bolt` | Utilities | `CustomSelect.tsx` |
| `fa-shopping-cart` | Shopping | `CustomSelect.tsx` |
| `fa-heartbeat` | Healthcare | `CustomSelect.tsx` |
| `fa-graduation-cap` | Education | `CustomSelect.tsx` |
| `fa-briefcase` | Salary | `CustomSelect.tsx` |
| `fa-laptop-code` | Freelance | `CustomSelect.tsx` |

---

## 5. Chart.js Configurations

Chart.js components and registration points:

1. **`apps/web/src/components/dashboard/WeeklyActivityChart.tsx`**:
   - Registered components: `Chart as ChartJS`, `CategoryScale`, `LinearScale`, `PointElement`, `LineElement`, `Title`, `Tooltip`, `Legend`, `Filler`.
   - Element: `<Line />` from `react-chartjs-2`.
   - Purpose: Renders 7-day spending trends with area fill gradient, custom tooltip labels, and INR currency formatting.

2. **`apps/web/src/components/analytics/AnalyticsTab.tsx`**:
   - Registered components: `BarElement`, `ArcElement`, `DoughnutController`, `BarController`.
   - Charts:
     - **Daily Expenses Bar Chart**: `<Bar />` tracking day-by-day expenditure over selected timeframe (This Week, This Month, Last 30 Days).
     - **Category Distribution Doughnut**: `<Doughnut />` mapping relative category proportions with cut-out ratio and legend synchronization.
     - **Expense Trends & 7-Day SMA**: `<Line />` overlaying raw daily expenses with 7-day Simple Moving Average dashed prediction line.
