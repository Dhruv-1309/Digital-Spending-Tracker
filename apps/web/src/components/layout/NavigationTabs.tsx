import { useTracker } from '../../hooks/useTracker';
import { prefetchTab } from '../../lib/prefetch';
import { MAIN_NAV_ITEMS } from './navItems';

export interface NavigationTabsProps {
  className?: string;
}

/**
 * Tablet & Phone Bottom Tab Bar (SPEC Section 5 & 6)
 * - Renders on viewport widths under 1025px
 * - Displays 4 items (Dashboard, Transactions, Autopay, Analytics)
 * - Each item includes icon, label, and aria-current="page" when active
 * - Accessible keyboard navigation and touch targets >= 44x44px
 */
export function NavigationTabs({ className = '' }: NavigationTabsProps) {
  const { currentTab, setCurrentTab } = useTracker();

  return (
    <nav
      aria-label="Main Navigation Tabs"
      className={`nav-tabs min-[1025px]:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line h-16 flex items-center justify-around px-2 shadow-1 safe-area-bottom ${className}`}
    >
      {MAIN_NAV_ITEMS.map((item) => {
        const isActive = currentTab === item.id;
        const IconComponent = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            data-tab={item.id}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => setCurrentTab(item.id)}
            onMouseEnter={() => prefetchTab(item.id)}
            onFocus={() => prefetchTab(item.id)}
            className={`nav-tab flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] py-1 text-xs font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive
                ? 'active text-accent font-semibold'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            <IconComponent
              size={20}
              className={isActive ? 'text-accent shrink-0' : 'text-ink-3 shrink-0'}
            />
            <span className="mt-1 leading-tight text-[11px] sm:text-xs">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default NavigationTabs;
