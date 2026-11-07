import type { NavTab } from '../types';

/**
 * Predictive Route Chunk Prefetching (PERF-15)
 * Dynamically imports code-split tab bundles when the user hovers or focuses
 * a navigation item, reducing perceived navigation latency to 0ms.
 */
export function prefetchTab(tab: NavTab): void {
  switch (tab) {
    case 'add-transaction':
      import('../components/transactions/AddTransactionTab');
      break;
    case 'transactions':
      import('../components/transactions/TransactionsTab');
      break;
    case 'autopay':
      import('../components/autopay/AutopayTab');
      break;
    case 'analytics':
      import('../components/analytics/AnalyticsTab');
      break;
    default:
      break;
  }
}
