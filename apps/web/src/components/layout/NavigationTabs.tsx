import type { NavTab } from '../../types';
import { useTracker } from '../../hooks/useTracker';

const tabs: { id: NavTab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
  { id: 'add-transaction', label: 'Add Transaction', icon: 'fa-plus-circle' },
  { id: 'transactions', label: 'Transactions', icon: 'fa-list' },
  { id: 'autopay', label: 'Autopay', icon: 'fa-sync-alt' },
  { id: 'analytics', label: 'Analytics', icon: 'fa-chart-pie' },
];

export function NavigationTabs() {
  const { currentTab, setCurrentTab } = useTracker();

  return (
    <div className="nav-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`nav-tab ${currentTab === tab.id ? 'active' : ''}`}
          data-tab={tab.id}
          onClick={() => setCurrentTab(tab.id)}
        >
          <i className={`fas ${tab.icon}`} /> {tab.label}
        </button>
      ))}
    </div>
  );
}
