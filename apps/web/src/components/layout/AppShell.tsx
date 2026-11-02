import React, { useEffect, useMemo } from 'react';
import type { NavTab } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useTracker } from '../../hooks/useTracker';
import { Button } from '../ui/Button';
import { NavigationTabs } from './NavigationTabs';
import { MAIN_NAV_ITEMS } from './navItems';
import {
  WalletIcon,
  PlusIcon,
  WifiOffIcon,
  UserIcon,
  LogOutIcon,
} from '../icons';

export interface AppShellProps {
  children: React.ReactNode;
  onOpenProfile: () => void;
}

function getPageTitle(tab: NavTab): string {
  switch (tab) {
    case 'dashboard':
      return 'Dashboard';
    case 'transactions':
      return 'Transactions';
    case 'autopay':
      return 'Autopay';
    case 'analytics':
      return 'Analytics';
    case 'add-transaction':
      return 'Add Transaction';
    default:
      return 'Dashboard';
  }
}

/**
 * AppShell Component (SPEC Section 5 Navigation & Section 6 All Screens)
 *
 * 1. Desktop (>= 1025px): 232px left rail with logo, 4 items (Dashboard,
 *    Transactions, Autopay, Analytics), profile entry at the bottom.
 *    Active item has accent-tint fill and 3px accent bar.
 * 2. Tablet & Phone (< 1025px): Bottom tab bar with same 4 items, icons and labels;
 *    profile entry in the top bar.
 * 3. Top bar with page title, Add transaction button, and Offline chip.
 *    Pressing 'N' when no input has focus opens the add-transaction form.
 * 4. Content area with 160ms route cross-fade (instant swap under reduced motion).
 */
export function AppShell({ children, onOpenProfile }: AppShellProps) {
  const { user, signOut } = useAuth();
  const { currentTab, setCurrentTab, isOnline } = useTracker();

  // Keyboard shortcut: Pressing 'N' when no input is focused opens add-transaction form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'n' && e.key !== 'N') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      // Do not trigger if any modal dialog is currently open
      if (document.querySelector('dialog[open], [role="dialog"]')) {
        return;
      }

      e.preventDefault();
      setCurrentTab('add-transaction');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setCurrentTab]);

  const userInitial = useMemo(() => {
    const name = user?.displayName || user?.email || 'U';
    return name.trim().charAt(0).toUpperCase();
  }, [user]);

  const displayName = useMemo(() => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  }, [user]);

  const pageTitle = getPageTitle(currentTab);

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-sans selection:bg-accent-tint selection:text-accent">
      {/* ====================================================================
          Desktop Left Rail (1025px and wider)
          Width: 232px (--nav-rail-width), fixed left
          ==================================================================== */}
      <aside
        aria-label="Desktop Sidebar"
        className="hidden min-[1025px]:flex fixed inset-y-0 left-0 z-30 w-[232px] flex-col justify-between border-r border-line bg-surface p-4"
      >
        <div className="flex flex-col gap-6">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-btn bg-accent-tint text-accent">
              <WalletIcon size={22} />
            </div>
            <div className="min-w-0">
              <span className="font-display text-lg font-semibold tracking-tight text-ink block leading-snug">
                MoneyTracker
              </span>
              <span className="text-xs text-ink-3 block">Personal Finance</span>
            </div>
          </div>

          {/* Navigation Items (4 items: Dashboard, Transactions, Autopay, Analytics) */}
          <nav aria-label="Desktop Navigation" className="flex flex-col gap-1.5">
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
                  className={`group relative flex h-11 w-full items-center gap-3 rounded-btn px-3 text-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isActive
                      ? 'bg-accent-tint text-accent font-semibold'
                      : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  {/* 3px Accent Bar */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      data-testid="active-accent-bar"
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent"
                    />
                  )}
                  <IconComponent
                    size={20}
                    className={
                      isActive
                        ? 'text-accent shrink-0'
                        : 'text-ink-3 group-hover:text-ink shrink-0 transition-colors duration-fast'
                    }
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Entry at Bottom of Left Rail */}
        <div className="border-t border-line pt-3 mt-auto flex flex-col gap-1.5">
          <button
            id="profileBtn"
            type="button"
            onClick={onOpenProfile}
            aria-label="Open profile settings"
            className="group flex w-full items-center gap-3 rounded-btn p-2 hover:bg-surface-2 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-left"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-tint font-display text-sm font-semibold text-accent">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-ink group-hover:text-accent transition-colors duration-fast">
                {displayName}
              </p>
              <p id="userEmail" className="truncate text-xs text-ink-3">
                {user?.email || ''}
              </p>
            </div>
            <UserIcon size={16} className="text-ink-3 group-hover:text-ink shrink-0" />
          </button>

          <button
            id="signOutBtn"
            type="button"
            onClick={() => signOut()}
            aria-label="Sign out"
            className="flex w-full items-center gap-3 rounded-btn px-3 py-2 text-xs font-medium text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <LogOutIcon size={16} className="shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ====================================================================
          Top Bar (Title, Offline chip, Add transaction button, Mobile Profile)
          ==================================================================== */}
      <header
        aria-label="App Header"
        className="fixed top-0 right-0 left-0 min-[1025px]:left-[232px] h-16 z-20 bg-surface/95 backdrop-blur-sm border-b border-line flex items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        {/* Left: Page Title & Mobile Brand Icon */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-btn bg-accent-tint text-accent min-[1025px]:hidden shrink-0">
            <WalletIcon size={20} />
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink tracking-tight truncate">
            {pageTitle}
          </h1>
        </div>

        {/* Right: Offline Chip, Add Transaction, Mobile Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Offline chip driven by existing isOnline detection (FR-6.3) */}
          {!isOnline && (
            <div
              id="offlineChip"
              role="status"
              data-testid="sync-status-indicator"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip text-xs font-medium bg-warning-tint text-warning border border-warning/30"
            >
              <WifiOffIcon size={14} className="shrink-0" />
              <span>Offline</span>
            </div>
          )}

          {/* Add Transaction Button */}
          <Button
            variant="primary"
            size="md"
            onClick={() => setCurrentTab('add-transaction')}
            className="flex items-center gap-2"
            aria-label="Add transaction (Press N)"
          >
            <PlusIcon size={18} />
            <span className="hidden sm:inline">Add transaction</span>
            <span className="sm:hidden">Add</span>
            <kbd className="hidden lg:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-sans font-semibold rounded bg-white/20 text-white">
              N
            </kbd>
          </Button>

          {/* Mobile Profile Entry (top bar on tablet and phone) */}
          <button
            id="mobileProfileBtn"
            type="button"
            onClick={onOpenProfile}
            aria-label="Open mobile profile settings"
            className="min-[1025px]:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent font-display text-sm font-semibold hover:bg-accent/20 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {userInitial}
          </button>
        </div>
      </header>

      {/* ====================================================================
          Main Content Area (160ms CSS Cross-Fade on Route Change)
          ==================================================================== */}
      <main className="flex-1 w-full min-[1025px]:pl-[232px] pt-16 pb-20 min-[1025px]:pb-10">
        <div className="mx-auto max-w-content px-4 sm:px-6 lg:px-8 py-6">
          <div key={currentTab} className="route-fade-content w-full">
            {children}
          </div>
        </div>
      </main>

      {/* ====================================================================
          Tablet & Phone Bottom Tab Bar (< 1025px)
          ==================================================================== */}
      <NavigationTabs />
    </div>
  );
}

export default AppShell;
