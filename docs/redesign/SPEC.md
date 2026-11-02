# MoneyTracker UI/UX Redesign Spec

Nov 2, 2026 · @Dhruv

## 1. Summary and design principles

The redesign changes how MoneyTracker looks, moves and responds; it adds no features and changes no behavior. The direction is light and warm, with one accent colour, purposeful motion, and CSS first with Motion used only where CSS cannot do the job.

1. **Figures first.** Money amounts are the largest, highest-contrast elements on every screen.
2. **One accent.** Cobalt marks interactive elements and the current selection. Everything else is warm neutral.
3. **Colour carries meaning.** Income is green, over-limit is red, approaching-limit is amber. Ordinary expenses stay in ink, so a normal purchase never looks like an alert.
4. **Motion explains.** Each animation shows a state change, a cause and effect, or a hierarchy. There are no decorative loops except loading skeletons.
5. **Every state is designed.** Interactive elements define default, hover, focus, active and disabled, plus loading and error where they apply.
6. **Fast by construction.** Animate only transform and opacity, use skeletons instead of spinners for lists, and keep layout stable so nothing jumps.
7. **Mobile is a real layout.** Phone screens get their own arrangement (bottom navigation, cards instead of tables), not a shrunk desktop.

## 2. Constraints and assumptions

This spec is written from the v2.0 PRD only; I have not seen the current code or screenshots, so Phase 0 makes the coding agent inventory the real screens before it changes anything.

**Constraints**

1. UI and UX only. Functional requirements FR-1 to FR-6, data models, services and the sync layer do not change, so the redesign works the same on the current Firestore build or the v3.0 API build.
2. The v2.0 requirement of strict visual parity with legacy.css (NFR 5.3) is intentionally replaced by this spec. Update the PRD after Phase 8.
3. The existing 54 tests must keep passing. Tests may change only where markup changed (selectors, roles); none are deleted.
4. Architecture rules stay: src/lib untouched, components never call the Firebase SDK or the API directly, one typed component per file.
5. Tailwind stays on 3.4.17 (no major upgrade during the redesign). Chart.js 4.5.1 stays.
6. Fonts are self-hosted, not loaded from a font CDN, to keep the zero-third-party-requests principle.
7. Font Awesome is replaced by inline SVG icon components from one open-licensed set (such as Lucide), so there is one icon style and no icon CSS or font download.
8. Git: all work on a branch, a baseline tag first, one commit per step, and no push until you ask.

**Where Motion is allowed**

CSS handles hover, focus, transitions, keyframes, skeletons and scroll reveals. Motion (loaded with LazyMotion and the m component) is allowed only for: exit animations of conditionally rendered elements (modal, toast, anomaly banner, dropdown), and shared-layout transitions when a list re-sorts or filters. If the production bundle passes 350 kB gzipped with Motion included, those two cases fall back to CSS.

## 3. Design tokens

All values live as CSS variables on :root and are mapped in tailwind.config, so components never hold a raw hex value. Text colours below meet WCAG AA (4.5:1) on the surfaces named; dark mode is out of scope, but variables make it addable later.

**Colour**

| Token | Value | Use |
| --- | --- | --- |
| --bg | #FAF7F2 | App background |
| --surface | #FFFFFF | Cards, inputs, modals |
| --surface-2 | #F3EEE6 | Hover fills, table stripes, skeleton base |
| --line | #E6DFD3 | Default borders and dividers |
| --line-strong | #D3C9B9 | Input borders, hovered borders |
| --ink | #1F1B16 | Primary text, figures |
| --ink-2 | #5C554B | Secondary text |
| --ink-3 | #766E62 | Placeholders, captions (AA on --bg) |
| --accent | #2A4FD6 | Primary buttons, links, focus ring, selection |
| --accent-tint | #E6EBFB | Selected rows, active segment background |
| --income | #2E7D5B | Income amounts and positive balance |
| --income-tint | #E4F2EA | Income badges |
| --warning | #9A6700 | Approaching-limit text and bar |
| --warning-tint | #F6E8C8 | Warning banners |
| --danger | #B3261E | Exceeded limit, destructive actions, errors |
| --danger-tint | #F8E1DE | Error and danger backgrounds |

Expense amounts use --ink, not red. Negative balance uses --danger.

**Category badges.** Eight muted tint and ink pairs, assigned by a stable hash of the category name so a category always has the same colour: terracotta (#F3DCD2 / #8A3A1F), olive (#E8EBCF / #55601A), teal (#D7ECE9 / #1E5F58), rose (#F5DCE3 / #8A2A47), sand (#EFE3CB / #7A5A12), sky (#DCE8F5 / #245A8C), moss (#DDEBD9 / #2F6A32), slate (#E3E6EA / #3C4654).

**Typography**

| Role | Font | Notes |
| --- | --- | --- |
| Display and hero figure | Bricolage Grotesque, weight 600 | Self-hosted, variable font |
| UI and body | Instrument Sans, weights 400, 500, 600 | Self-hosted |
| All amounts and dates in tables | Body font with font-variant-numeric: tabular-nums | Check digits 1 and 8 have equal width; if not, switch the body font to Geist |

Scale (size / line height, px): 12/16 caption, 14/20 body small, 16/24 body, 20/28 section title, 28/36 page title, 48/52 hero figure (36/40 on phones). Amounts are grouped in the Indian system (₹1,25,000).

**Shape, space and depth**

| Token | Value |
| --- | --- |
| Spacing | 4 px base: 4, 8, 12, 16, 24, 32, 48, 64 |
| Radius | 6 (chips), 10 (buttons, inputs), 16 (cards, modals), 999 (pills) |
| --shadow-1 | 0 1px 2px rgba(60,40,20,.06), 0 1px 1px rgba(60,40,20,.04) |
| --shadow-2 | 0 4px 12px rgba(60,40,20,.08), 0 1px 2px rgba(60,40,20,.06) |
| --shadow-3 | 0 16px 40px rgba(60,40,20,.14), 0 2px 6px rgba(60,40,20,.08) |
| Focus ring | 2 px --accent with a 2 px --surface gap, on :focus-visible only |
| Layout | Content max width 1200, 12 columns, 24 gutter on desktop, 16 on phones |

Shadows are warm-tinted and used for three elevations only: resting card (1), hovered card or dropdown (2), modal (3).

## 4. Motion system

Motion is defined once as tokens and a short rule set, so every screen moves the same way.

```css
:root {
  --dur-fast: 120ms;   /* hover, press, color changes */
  --dur-base: 200ms;   /* dropdowns, toasts, tab indicator */
  --dur-slow: 320ms;   /* modals, section reveals */
  --dur-chart: 600ms;  /* chart entrance, progress fill */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);   /* entrances */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);       /* exits */
}
```

**Rules**

1. Animate only transform and opacity, plus colour, border-color and box-shadow for hover. Never animate width, height, top or left. Progress bars use transform: scaleX. The one exception is the grid-template-rows 0fr to 1fr trick for reveals such as the anomaly banner.
2. Wrap every hover effect in @media (hover: hover), so touch screens never show a stuck hover.
3. Exits last about 70% as long as entrances.
4. Nothing that sits in the path of a task runs longer than 320 ms, and nothing blocks input while it plays.
5. Entrance choreography runs once, on first mount of a screen, not on every data refresh: sections fade in and rise 8 px, staggered 40 ms apart, at most 6 items.
6. Chart.js animates for 600 ms with easeOutQuart on first render only. Updates from sync pulls set animation to false.
7. The hero balance counts from its previous value to the new one over 800 ms (requestAnimationFrame, ease-out) on first load and on user-caused changes. The final value is in the DOM text immediately for screen readers.
8. At most one large animation is on screen at a time.
9. Reduced motion (prefers-reduced-motion: reduce): remove transforms, stagger, count-up, chart animation and the skeleton shimmer; keep opacity and colour transitions at 120 ms.

**Patterns**

| Pattern | Trigger | Spec | Built with |
| --- | --- | --- | --- |
| Button hover | hover | translateY(-1px), --shadow-2, 120 ms | CSS |
| Button press | active | scale(0.98), 80 ms | CSS |
| Interactive card hover | hover | border to --line-strong, translateY(-2px), shadow 1 to 2, 200 ms | CSS |
| Table row hover | hover | --surface-2 fill; row actions fade from opacity 0 to 1, 120 ms | CSS |
| Link hover | hover | underline grows from the left, 200 ms | CSS (background-size) |
| Segmented control and tabs | selection change | active indicator slides by translateX, 200 ms | CSS transform |
| Dropdown | open and close | opacity 0 to 1, scale 0.96 to 1 from the trigger edge, 160 ms in, 110 ms out | Motion exit |
| Modal | open and close | backdrop fades 200 ms; panel fades, rises 12 px, scales 0.98 to 1 over 320 ms; exit 220 ms | Motion exit |
| Toast | appear and dismiss | rises 16 px and fades in 200 ms; timer bar scaleX 1 to 0 over its lifetime; exit 140 ms | Motion exit |
| Anomaly banner | appear | fade and drop 8 px, 200 ms; space reserved with grid rows | CSS |
| List sort and filter | order change | rows move to new positions, 240 ms | Motion layout |
| Progress bar | value change | scaleX over 600 ms; colour change 200 ms | CSS |
| Skeleton | loading | warm shimmer sweep, 1.4 s linear, repeating | CSS |
| Invalid field | failed validation | existing shake, 240 ms, plus a border to --danger | CSS |

## 5. Component specs

Each component below keeps its current behavior and accessibility (keyboard trapping, arrow-key navigation, Escape handling) and gains the states and motion listed. Hover, focus and press follow section 4.

| Component | Spec |
| --- | --- |
| Button | Primary: --accent fill, white text, 40 px tall (44 px on phones), radius 10. Secondary: --surface with --line-strong border. Ghost: text only. Danger: --danger fill. Disabled: 45% opacity, no hover. Loading: label replaced by a small spinner, width locked so the button does not resize. |
| Text input | Label above the field, never floating. 44 px tall, --line-strong border, radius 10. Focus: border to --accent plus the focus ring. Error: --danger border, message below in --danger, field shakes once. Validation runs on blur, then on change once an error exists. |
| Amount input | Large (20 px), prefix ₹, live Indian grouping as you type, inputmode decimal, tabular figures. Pasting 1,25,000 or 125000 both work. |
| Type toggle (Income / Expense) | Segmented control with a sliding indicator. Selecting Income tints the form's accent edge --income, Expense uses --ink. |
| Custom dropdown | Trigger shows the selected value and a chevron that rotates 180° on open. Panel uses --shadow-2, options are 40 px tall with --surface-2 hover, the selected option shows a check. Arrow keys, Home, End, type-ahead and Escape work. Opens upward if there is no space below. |
| Date picker | Same panel style. Month change slides the grid 16 px in the direction of travel. Today has a dot, the selected day an --accent fill. Quick chips above the grid: Today, Yesterday. |
| Day-of-month picker (Autopay) | 7-column grid of 40 px cells, selected day animates a filled circle in with scale 0.8 to 1. A separate Last Day toggle row below. |
| Card | --surface, --line border, radius 16, --shadow-1. Only cards that are clickable get hover motion; static cards do not move. |
| Metric card | Label in --ink-2, figure in the hero or title scale, a small coloured delta chip. Figures use tabular numbers. |
| Transaction row | Date, category badge, description, payment method, amount right-aligned. Hover reveals edit and delete icon buttons (always visible on touch). Income amounts in --income with a leading plus, expenses in --ink. |
| Category badge | Pill, 12 px text, tint and ink pair from the section 3 hash. |
| Pagination | Previous and Next buttons plus a range label (11–20 of 87). Changing page cross-fades the rows in 160 ms and scrolls the list top into view. |
| Budget progress | 8 px track, fill changes colour at the threshold (--accent below, --warning at threshold, --danger over limit). A tick mark shows the threshold. Label shows spent of limit and percent. |
| Anomaly banner | --warning-tint surface, left 4 px --warning edge, message with the category and amount, Approve (secondary) and Dismiss (ghost danger) buttons. Appears with the section 4 banner animation. |
| Toast | Bottom-right on desktop, top-centre on phones. Icon, message, close button, timer bar. Stacks with 8 px gaps, max 3 visible. Hovering or focusing pauses the timer. |
| Confirm dialog | Centred, --shadow-3, focus moves to the safe button first. Destructive confirm is --danger. Backdrop click and Escape close it. |
| Skeleton | --surface-2 blocks matching the final layout size, with the warm shimmer. Used for cards, rows and charts. Replaces spinners for anything that is a list or card. |
| Empty state | A Haikei-generated SVG shape in the warm palette, one sentence, one primary action (for example Add your first transaction). |
| Chart tooltip | Custom HTML tooltip in --surface with --shadow-2, ₹ values with grouping, same fonts as the page. |
| Navigation | Desktop: 232 px left rail with logo, four items (Dashboard, Transactions, Autopay, Analytics), profile at the bottom. Active item has --accent-tint fill and a 3 px accent bar. Phones: bottom tab bar with the same four items and icons plus labels, profile in the top bar. |

## 6. Screen-by-screen UX changes

Every change below is presentation or interaction only; the data, rules and requirement IDs behind each screen are unchanged.

### All screens

1. Navigation follows the component spec: left rail on desktop, bottom tab bar on phones.
2. An Add transaction button is reachable from every screen (top bar on desktop, a raised button in the tab bar on phones). The key N opens the form when no field has focus.
3. Route changes cross-fade the content in 160 ms.
4. First loads show skeletons that match the final layout; later refreshes keep the old content visible and never blank the screen.
5. A small Offline chip appears in the top bar while the browser is offline (with the queued change count once the v3.0 queue exists). The existing toasts stay.
6. Deleting one transaction removes it immediately and shows a toast with Undo for 5 seconds; the delete is committed when the toast expires. Plan and account deletion keep the confirmation dialog.

### Auth

1. Split layout on desktop: a brand panel with a Haikei wave in the warm palette and the line from the PRD vision (no trackers, no bank logins), and the form beside it. On phones the panel shrinks to a header strip.
2. Sign in and sign up share one form with a sliding two-option switch. Google sign-in is a full-width secondary button with the standard Google mark.
3. Show or hide password toggle, inline errors with the existing shake, button loading state, and password reset opening inline under the form rather than as a separate view.

### Dashboard

1. The hero card shows the current balance as the largest figure on the page, counting up on first load, with income and expense for the month as two chips beside it.
2. The budget bar sits under the hero with the threshold tick and the three-colour behavior from section 5. The limit and threshold form opens in place from an Edit limit ghost button.
3. The weekly income and expense chart gets a card, a one-line title and the custom tooltip.
4. The anomaly banner sits above the hero when present.
5. Recent transactions show as five compact rows with a View all link to Transactions.
6. Cards enter with the staggered reveal, once.

### Transactions

1. A sticky filter bar holds search, type segmented control, month dropdown and sort dropdown. Active filters show as removable chips with a Clear all, and the result count updates live.
2. Rows are grouped under date headers that show the day total. On phones each row becomes a two-line card.
3. The add and edit form opens in a slide-over panel on desktop and a bottom sheet on phones. It remembers the last category and payment method used for each type, shows Today and Yesterday chips, and submits with Enter.
4. Import and Export move into a More menu to declutter the header. Import results appear as a toast with the imported and skipped counts.
5. Sorting and filtering animate rows to their new positions.

### Autopay

1. The monthly flow projection is a banner at the top: net amount large, income and expense totals as chips.
2. Each plan is a card with name, amount, day (the 5th, or Last day), category badge, the next deduction date, and an Active/Paused switch with an animated knob.
3. The upcoming agenda is a vertical timeline. Each entry has a countdown chip; the ones due today use --accent.
4. The plan form uses the same slide-over and bottom-sheet pattern as transactions, with the day-of-month grid.

### Analytics

1. The preset buttons (This Week, This Month, Last 30 Days) are a segmented control with a sliding indicator. Granularity dropdowns sit to the right and the whole bar is sticky.
2. Every chart sits in a card with a title and a one-sentence reading underneath, written from the data (for example, the highest category).
3. Category doughnut: hovering a segment lifts it 6 px and shows its name and amount in the centre; the legend beside it lists categories with percent bars, and hovering either one highlights the other.
4. Forecast: the projected 7 days continue the actual line in a dashed style; the confidence score shows as a labelled chip.
5. Money runway: days remaining as a large figure with the depletion date and daily burn rate beneath.
6. Weekday heatmap: bar colour runs from --accent-tint to --accent by amount, with the insight sentence underneath.

### Profile

1. Initial-letter avatar, display name editable in place, password change in its own card, and account deletion in a separate Danger zone card that uses the existing confirmation dialog.

## 7. Accessibility and performance budgets

The redesign must not slow the app down or make it harder to use with a keyboard or screen reader.

| Area | Requirement |
| --- | --- |
| Contrast | Text at least 4.5:1, large text and UI borders at least 3:1, checked against the section 3 tokens |
| Focus | Visible focus ring on every interactive element via :focus-visible; focus order follows visual order; focus returns to the trigger when a dialog, dropdown or panel closes |
| Touch targets | At least 44 by 44 px on phones |
| Keyboard | Everything reachable and operable without a mouse; existing arrow-key behavior in dropdowns and pickers preserved |
| Screen readers | Charts have a text summary or data table alternative; toasts use role status (errors role alert); the count-up never hides the final value; icon-only buttons have labels |
| Reduced motion | Behavior defined in section 4 rule 9 and tested by turning the OS setting on |
| Colour independence | Status is never colour alone: warning and danger also carry an icon and text |
| Initial load | Keeps the v2.0 targets: under 1.2 s on 4G, under 350 kB gzipped total |
| Layout stability | Cumulative Layout Shift at or below 0.05; images and skeletons have fixed dimensions |
| Frame rate | Animations and chart interactions hold 60 fps on a mid-range phone; no animation of layout properties |
| Fonts | Two families, WOFF2 only, subset to Latin plus the ₹ symbol, font-display swap, preload the body font |
| Lighthouse (mobile, production build) | Performance 90 or higher, Accessibility 95 or higher, Best Practices 95 or higher |
| Bundle check | Record the gzipped size at Phase 0, after Phase 1 (fonts, icons, Motion) and at the end; stop and report if the budget is exceeded |

## 8. What to avoid

These are the patterns that make a finance app look templated. Each phase's review checks the screen against this list.

- [ ] Purple-to-blue gradients, gradient text, or glowing blobs behind content
- [ ] Glassmorphism or backdrop blur on ordinary cards
- [ ] Every card styled the same with the same large radius and shadow regardless of importance
- [ ] Emoji used as icons, or a mix of icon styles and weights
- [ ] Red for every expense, green for everything else; colour used without meaning
- [ ] Centred, symmetrical layouts for data screens; numbers should align right in tabular columns
- [ ] Decorative looping animation, bouncing, or parallax
- [ ] Hover effects on things that cannot be clicked
- [ ] Spinners where a skeleton would keep the layout
- [ ] Placeholder-only form labels
- [ ] Generic marketing copy ("Take control of your finances") inside the app; labels say what the thing is
- [ ] More than one accent colour competing on a screen
- [ ] Animation that delays a task: a user should never wait for a transition to finish before acting
- [ ] Layout that only works on desktop width

## 9. Phased plan and QA

The work runs in ten phases on one branch. Each phase ends with a commit, a green test run and screenshots for your review before the next phase starts. The matching paste-ready prompts are in the companion Antigravity prompt pack.

| Phase | Scope | Done when |
| --- | --- | --- |
| 0. Safety and baseline | Branch redesign/ui-v1, tag pre-redesign, inventory of screens, components and legacy.css, baseline screenshots at 390 and 1440 px, Lighthouse and bundle size | Tag exists, baseline report committed, 54 tests pass |
| 1. Foundations | CSS variable tokens, Tailwind mapping, self-hosted fonts, SVG icon components, motion tokens, LazyMotion setup, reduced-motion handling | A dev-only design page shows every token; bundle size recorded; tests pass |
| 2. Primitives | Button, Input, Amount input, Segmented control, Dropdown, Date picker, Card, Badge, Skeleton, Toast, Dialog, Progress bar | Each primitive has all states on the design page and passes keyboard checks |
| 3. App shell | Left rail, bottom tab bar, top bar with Add button and Offline chip, route transitions | Every route renders in the new shell at 390 and 1440 px |
| 4. Dashboard | Hero balance, budget bar, weekly chart, anomaly banner, recent rows, skeletons and empty state | Matches section 6; tests pass |
| 5. Transactions | Filter bar, grouped rows, slide-over and bottom-sheet form, More menu, undo delete | Matches section 6; import and export still work |
| 6. Autopay | Flow banner, plan cards, switch, agenda timeline, plan form | Matches section 6; processing behavior unchanged |
| 7. Analytics | Segmented presets, restyled charts, doughnut linking, forecast, runway, heatmap | Matches section 6; chart numbers identical to before |
| 8. Auth and profile | Split auth layout, inline reset, profile cards | Matches section 6; all auth flows still work |
| 9. Polish and cleanup | State audit (loading, empty, error), accessibility pass, performance pass, removal of legacy.css and Font Awesome, PRD update | Lighthouse targets met, no legacy references left, section 8 list clear |

**Final QA checklist**

- [ ] Every screen checked at 390, 768 and 1440 px wide
- [ ] Every screen checked in loading, empty, error and populated states
- [ ] Full keyboard pass on each screen, including dialogs, dropdowns and the date picker
- [ ] OS reduced-motion setting on: no transforms, stagger or count-up
- [ ] Browser offline: chip, toasts and queued writes behave as before
- [ ] Totals, charts and forecasts show the same numbers as the pre-redesign tag for the same data
- [ ] tsc -b, ESLint, tests and the production build report zero errors
- [ ] Lighthouse and bundle budgets from section 7 met
- [ ] Nothing pushed to the remote
