# MoneyTracker Production Bundle Analysis

**Audit Target:** `QA-16` (Bundle analyzer report generation and visual artifact archiving)  
**Executed:** November 8, 2026  
**Bundler:** Rolldown-Vite v7.2.5  
**Visual Artifact:** [`docs/bundle-stats.html`](./bundle-stats.html)  

---

## 1. Executive Summary

A comprehensive production bundle audit was performed with `rollup-plugin-visualizer`. The frontend single-page application is partitioned using route-level lazy loading (`React.lazy()`) and granular manual vendor chunking (`vite.config.ts`), guaranteeing that no single chunk exceeds the 500 kB budget.

| Asset / Chunk | Raw Size | Gzip Size | Compression Ratio | Type |
| :--- | :--- | :--- | :--- | :--- |
| `index.html` | 3.56 kB | 1.18 kB | 66.8% | HTML Shell |
| `index-[hash].css` | 58.24 kB | 11.27 kB | 80.6% | Stylesheet (Tailwind & CSS Tokens) |
| `index-[hash].js` | 445.43 kB | 117.08 kB | 73.7% | Main Application Core |
| `vendor-react-[hash].js` | 212.47 kB | 66.56 kB | 68.7% | React 19 Core & React-DOM |
| `vendor-charts-[hash].js` | 191.20 kB | 66.29 kB | 65.3% | Chart.js 4 & react-chartjs-2 |
| `vendor-motion-[hash].js` | 148.79 kB | 50.15 kB | 66.3% | Motion (Framer Motion v14) |
| `vendor-firebase-[hash].js` | 117.13 kB | 34.53 kB | 70.5% | Firebase Auth SDK |
| `TransactionsTab-[hash].js` | 100.22 kB | 24.12 kB | 75.9% | Lazy-Loaded Tab Component |
| `AnalyticsTab-[hash].js` | 59.17 kB | 14.51 kB | 75.5% | Lazy-Loaded Tab Component |
| `AutopayTab-[hash].js` | 39.12 kB | 11.61 kB | 70.3% | Lazy-Loaded Tab Component |
| `AddTransactionTab-[hash].js`| 7.43 kB | 2.80 kB | 62.3% | Lazy-Loaded Tab Component |
| `rolldown-runtime-[hash].js`| 0.55 kB | 0.35 kB | 36.4% | Module Runtime |

---

## 2. Dependency Justification

### 2.1 Chart.js (`vendor-charts`: 66.29 kB gzip)
- **Role in Application:** Powers the interactive Doughnut breakdown, 7-day Simple Moving Average (SMA) trend lines, and day-of-week spend distribution histograms on the Dashboard and Analytics tabs.
- **Why It Is Essential:** Financial clarity requires rich, responsive data visualization. Chart.js provides canvas-rendered, GPU-accelerated charting that scales smoothly across mobile touch screens and desktop displays.
- **Optimization Strategy:**
  1. Chart.js components are registered tree-shaken with only required controllers (`BarController`, `DoughnutController`, `LineController`) and elements (`BarElement`, `ArcElement`, `PointElement`, `LineElement`).
  2. Isolated into dedicated chunk `vendor-charts-[hash].js` that is cached immutably by client browsers.
  3. Paired with semantic HTML accessible tables (`sr-only` fallback tables) for screen readers and WCAG AA compliance.

### 2.2 Motion (`vendor-motion`: 50.15 kB gzip)
- **Role in Application:** Powers fluid drawer animations (`AnimatePresence`), tab transitions, slide-over sheets, count-up numeric transitions, and modal dialog entries/exits.
- **Why It Is Essential:** High-end financial applications demand deliberate spatial context and tactile feedback when opening filters, slide-overs, and confirmation prompts.
- **Optimization Strategy:**
  1. Isolated into `vendor-motion-[hash].js` so changes to core business logic do not invalidate the motion cache.
  2. Respects user system `prefers-reduced-motion` settings everywhere across UI tokens.

---

## 3. Font Asset Sizes

All typography assets are self-hosted WOFF2 fonts with `font-display: swap` to eliminate layout shift (CLS) and Flash of Invisible Text (FOIT):

| Font File | Format | File Size | Usage |
| :--- | :--- | :--- | :--- |
| `instrument-sans-400.woff2` | WOFF2 | 30.09 kB | Body text & UI labels (Preloaded) |
| `bricolage-grotesque-600.woff2` | WOFF2 | 40.01 kB | Currency metrics & Section headings (Preloaded) |
| `instrument-sans-400-ext.woff2` | WOFF2 | 11.23 kB | Extended Latin glyphs |
| `instrument-sans-500-ext.woff2` | WOFF2 | 11.22 kB | Semi-bold extended glyphs |
| `bricolage-grotesque-600-ext.woff2` | WOFF2 | 17.74 kB | Heading extended glyphs |

---

## 4. How to Inspect Visual Treemap

Open the interactive HTML treemap directly in any modern browser:

\`\`\`bash
# Generated at docs/bundle-stats.html
start docs/bundle-stats.html   # Windows
open docs/bundle-stats.html    # macOS
\`\`\`

To regenerate fresh bundle statistics:

\`\`\`bash
npm run build:analyze
\`\`\`
