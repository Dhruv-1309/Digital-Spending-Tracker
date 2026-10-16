# MoneyTracker Feature Parity Checklist

This checklist tracks complete like-for-like feature and behavior parity between the vanilla JavaScript application and the migrated React 19 application. Every user-visible feature, interaction, and edge case must be verified.

---

## 1. Authentication Screen
- [ ] Animated colorful background blobs with continuous 7-second looping motion (`@keyframes blob`)
- [ ] Centered auth card with 0.6s upward fade-in animation (`@keyframes fadeInUp`)
- [ ] Email input field with email icon and focus state styling
- [ ] Password input field with lock icon, bullet placeholders, and focus styling
- [ ] Password visibility toggle button toggles eye icon (`fa-eye` / `fa-eye-slash`) and input type (`password` / `text`)
- [ ] "Forgot password?" button validates email presence, calls `sendPasswordResetEmail`, and displays error or success feedback
- [ ] Error alert container with icon, error message text, and 0.5s shake animation on error
- [ ] "Sign In" button with arrow icon, loading spinner state during authentication, and submission via Enter key
- [ ] Automatic account creation fallback when user credentials do not exist or on new email
- [ ] "Continue with Google" button with official multi-colored Google SVG icon and loading spinner
- [ ] Google Sign-In popup authentication with specific error messages (popup blocked, unauthorized domain, network failure, etc.)
- [ ] Security footer text: "Your data is encrypted & secure" with shield icon

---

## 2. Navigation & Header
- [ ] Wallet brand icon, "MoneyTracker" heading, and "Overview & Analysis" subtitle
- [ ] User email badge displaying the authenticated user's email address
- [ ] Profile button (`fa-user`) opening the Profile settings modal
- [ ] Sign out button (`fa-sign-out-alt`) signing the user out and restoring the Auth modal
- [ ] Navigation tabs bar with 5 tabs: Dashboard, Add Transaction, Transactions, Autopay, Analytics
- [ ] Active tab state highlighting with blue accent styling
- [ ] Tab switching hides previous view and activates chosen view without full page reload
- [ ] Responsive navigation layout collapsing cleanly on tablet and mobile viewports

---

## 3. Dashboard Screen
- [ ] Total Income summary card showing sum of current month's income transactions formatted in Indian numbering (₹)
- [ ] Total Expenses summary card showing sum of current month's expense transactions formatted in Indian numbering (₹)
- [ ] Current Balance summary card (`Income - Expenses`) colored green for non-negative balances and red for negative balances
- [ ] Monthly Budget Goal card displaying spent amount this month and monthly limit
- [ ] Budget progress bar calculating percentage spent, clamped at 100%, with dynamic warning/over-budget color classes
- [ ] Budget status chip showing "Not set", "On track", "Near limit", or "Over budget"
- [ ] Budget metadata footer: remaining amount or over-budget amount and alert threshold percentage
- [ ] Budget settings cog icon toggling the budget configuration form with a 180-degree rotation animation
- [ ] Budget form inline validation: monthly limit > 0, threshold between 1% and 100%
- [ ] Budget threshold toast notifications on crossing warning point or exceeding budget limit
- [ ] Weekly Activity line chart rendering 7-day trends with dual gradient areas (green for income, red for expense)
- [ ] Anomaly Alert Section detecting statistical outliers (Z-score > 2)
- [ ] Anomaly requirement: categories with fewer than 3 transactions are skipped and excluded from anomaly alerts
- [ ] Anomaly alert card shows transaction category, amount, Z-score, date, payment method, percentage above category mean, description, and typical category baseline
- [ ] Anomaly "Approve (Legitimate)" button adds transaction ID to approved anomalies list, persists to cloud, and removes alert
- [ ] Anomaly "Dismiss" button permanently deletes the transaction from records, updates balance, and refreshes displays
- [ ] Recent Transactions sidebar displaying the 5 most recent transactions with type icon, category, date, payment method, and amount
- [ ] "View All" link on Recent Transactions navigating directly to the Transactions tab
- [ ] Empty state fallback messages for recent transactions and anomaly alerts

---

## 4. Add Transaction Screen
- [ ] Prominent large currency hero input with ₹ symbol and placeholder `0.00`
- [ ] Transaction Type custom dropdown (Income / Expense)
- [ ] Type selection dynamically updates the Category dropdown options to match the chosen flow type
- [ ] Custom Date Picker trigger button displaying selected date formatted as `ddd, D MMM YYYY`
- [ ] Custom Date Picker dropdown calendar with month/year header, prev/next month navigation buttons, weekday headers, and interactive day grid
- [ ] Date picker highlights today's date (`.today`) and selected date (`.selected`), with padding days for adjacent months (`.other-month`)
- [ ] Date picker "Today" button selects current date and closes picker; "Clear" button resets date
- [ ] Date picker auto-closes when clicking outside or pressing `Escape`
- [ ] Category custom dropdown with standard default categories and custom categories tagged with "(Custom)"
- [ ] Payment Method custom dropdown: Cash, Credit/Debit Card, Bank Transfer, UPI, Digital Wallet, Other
- [ ] Description text input with alignment icon
- [ ] Inline custom category adder: input and "Add" button
- [ ] Custom category validation: prevents duplicates, appends to user's custom category list in Firestore, and auto-selects newly created category
- [ ] Form submission validation: validates amount > 0, type selected, category selected, payment method selected, date selected
- [ ] Inline error highlights (`.input-error`, `.field-error`, `aria-invalid="true"`) cleared dynamically on user input
- [ ] "Save Transaction" submit button with loading spinner, prepends to transaction list, resets form, and restores default date to today
- [ ] Success toast notification on save; warning toast if saved locally during offline state

---

## 5. Transactions Screen
- [ ] Header counter badge displaying total count of filtered transactions
- [ ] Export format selector: "CSV Detailed", "CSV Basic", "JSON Backup"
- [ ] "Export" button generates and triggers browser download of chosen format with ISO date in filename
- [ ] "Import CSV" button triggers hidden file input
- [ ] CSV import parsing supports quoted fields and escaped quotation marks (`""`)
- [ ] CSV import header mapping flexibly matches Date, Amount/Value, Type, Category, Description, Payment Method
- [ ] CSV import deduplication: skips duplicate records using composite signature `date|type|amount|category|description`
- [ ] CSV import toast feedback displaying count of imported transactions and count of skipped duplicates
- [ ] "New" shortcut button switches directly to the Add Transaction tab
- [ ] Search input box filters transactions in real time with 180ms debounce across category and description
- [ ] Type filter dropdown (All Types / Income / Expense)
- [ ] Month filter auto-extraction: dynamically extracts unique `YYYY-MM` months from all existing transactions, sorts descending, and formats as "Mon YYYY"
- [ ] Sort dropdown: "Date: Newest", "Date: Oldest", "Month: Newest", "Month: Oldest"
- [ ] Transaction card feed showing colored icon wrapper (green arrow down for income, red arrow up for expense), category, date, payment method, description, recurring `AUTO` badge (if autopay), and signed amount
- [ ] Transaction delete button with trash icon triggers confirmation modal before deletion
- [ ] 20-per-page pagination: limits feed to 20 transactions per page
- [ ] Pagination controls: "Prev" and "Next" buttons with disabled states at boundaries, and "Page X of Y" info indicator
- [ ] Empty state with search icon when no transactions match active search and filter criteria

---

## 6. Autopay (Recurring Plans) Screen
- [ ] Add Recurring Plan form: Payment Name input, Amount hero input with ₹ symbol
- [ ] Recurring Type selector (Expense / Income)
- [ ] Category selector dynamically filtered by recurring type
- [ ] Deduction Day calendar selector: input with toggle button opening a 1–31 calendar grid
- [ ] Deduction Day calendar includes "Clear" button and dedicated "Last Day" button for end-of-month scheduling
- [ ] Optional description input
- [ ] "Add Recurring Plan" submit button saves new autopay rule and updates display
- [ ] Monthly Flow summary card displaying net monthly projection (`+₹Income / -₹Expense`)
- [ ] Recurring plans list showing name, type badge (Income/Expense), status badge (Active/Paused), amount, category, scheduled day with ordinal suffix ("1st", "2nd", "3rd", "Last day"), and optional description
- [ ] Autopay active/pause toggle button updates state and saves to cloud
- [ ] Autopay delete button prompts confirmation before removing item
- [ ] "Upcoming This Month" section displaying recurring events scheduled for remaining days of the current month
- [ ] Edge case - "Last Day" autopay: dynamically calculates the actual last day of the current calendar month (e.g. 28, 29, 30, or 31)
- [ ] Edge case - No double posting in a month: checks `lastProcessed` timestamp against current year and month to ensure an autopay posts at most once per calendar month
- [ ] Automated execution: when an active autopay's day has arrived or passed in the current month, auto-creates a transaction tagged `[Autopay]` or `[Recurring Income]` and updates `lastProcessed`

---

## 7. Analytics Screen
- [ ] Quick preset filter buttons: "This Week" (Monday to current day), "This Month" (1st to end of current month), "Last 30 Days" (rolling 30 days)
- [ ] Period dropdown: "Overall", "Monthly", "Yearly"
- [ ] Dynamic filter visibility: Month dropdown shown only when period is "Monthly"; Year dropdown hidden when period is "Overall"
- [ ] Year dropdown dynamically populated from unique years present in transactions
- [ ] Summary cards grid: Total Income, Total Expenses, Net Balance (green if >= 0, red if < 0), and Transaction Count for selected range
- [ ] Analytics caching: caches range calculations using revision key `${transactionsRevision}|${preset}|${period}|${year}|${month}`
- [ ] Daily Expenses bar chart showing expense totals for up to the last 30 active dates with hover tooltips
- [ ] Expense by Category doughnut chart with distinct color palette, percentage breakdown tooltips, and bottom legend
- [ ] Time Series Analysis line chart plotting actual daily spending across complete date range (missing days filled with 0)
- [ ] Time Series 7-Day SMA forecast dashed line predicting upcoming 7 days
- [ ] Time Series statistics box: Total Period (days), Days with Spending, Days without Spending, Average Daily Spending, Maximum/Minimum Daily Spending, Total Spending, and Spending Frequency %
- [ ] 7-Day SMA Forecast statistics: Predicted Daily Average, Total Forecast (7 days), Forecast Confidence ("high", "medium", "low" based on coefficient of variation), and Data Variance (% CV)
- [ ] Money Runway Prediction: Current Balance, Days Until Depleted (`balance / avgDailySpend`), Estimated Depletion Date, and Daily Burn Rate %
- [ ] Runway edge cases: balance <= 0 reports "Already Depleted" (0 days, 100% burn rate); zero average spending reports "∞ (Sustainable)"
- [ ] Spending Heatmap (Day-of-Week Analysis) bar chart ordering days Monday through Sunday with dynamic red color gradient based on spending intensity
- [ ] Heatmap statistics box: Highest Spending Day, Lowest Spending Day, Total Weekly Spending, Average per Day, and contextual Spending Pattern Insight text
- [ ] Empty state canvas handling: displays friendly text message when insufficient data exists for charts

---

## 8. Profile Modal & Danger Zone
- [ ] Triggered from user icon button in header; closes via 'X' button or backdrop click
- [ ] Account Information section: Email, Account Type (Email/Password, Google, or Google + Email/Password), Member Since date, Last Sign In timestamp
- [ ] Display Name section: text input and "Save" button updates Firebase user profile `displayName`
- [ ] Password Settings section:
  - If signed in via Google without password: shows warning notice "No password set" and button labeled "Set Password"
  - If password exists: shows New Password and Confirm Password inputs with visibility toggle buttons and "Update Password" button
  - Password validation: minimum 6 characters, passwords must match
  - Success and error alerts with appropriate styling
- [ ] Danger Zone section: "Delete Account" button
- [ ] Double confirmation dialog required for account deletion
- [ ] Account deletion cascade: deletes all user documents from `users/{uid}/data/*`, deletes `users/{uid}`, and deletes Firebase Auth user record

---

## 9. Global Modals, Toasts & Network Handling
- [ ] Toast notification system with 4 variants: success (`fa-check-circle`), error (`fa-circle-xmark`), warning (`fa-triangle-exclamation`), info (`fa-circle-info`)
- [ ] Toast animations: slide in via `requestAnimationFrame` and slide out on dismissal awaiting `transitionend`
- [ ] Toast close button allows immediate dismissal
- [ ] Accessible confirmation modal (`showConfirm`): Promise-based API with title, message, customizable confirm/cancel labels, and 'warning' / 'danger' variants
- [ ] Confirm modal dismisses on `Escape` key or backdrop click, resolving to `false`
- [ ] Offline detection: displays warning toast "You are offline. New changes will be stored locally and synced later."
- [ ] Offline write queueing: marks `pendingSync` flags for transactions, categories, anomalies, autopays, and budget
- [ ] Reconnection listener: window `online` event displays "Connection restored. Syncing pending changes..." toast and triggers `retryPendingSync()`
- [ ] Post-reconnect sync toast: "Back online. Pending cloud sync completed." on successful background flush
