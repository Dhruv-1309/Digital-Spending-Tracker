import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  LogOutIcon,
  MenuIcon,
  XIcon,
  PanelLeftIcon,
  PanelLeftOpenIcon,
  SettingsIcon,
} from '../icons';

export interface AppShellProps {
  children: React.ReactNode;
  onOpenProfile: () => void;
  defaultSidebarCollapsed?: boolean;
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
 * AppShell Component — Google Gemini Web-Browser Style Layout
 *
 * 1. Desktop (>= 1025px):
 *    - Expanded State (256px): Brand & hamburger toggle at top, prominent "+ New Transaction"
 *      capsule pill, smooth rounded-full navigation items with active accent styling,
 *      and full profile footer.
 *    - Collapsed State (68px Slim Rail): Centered hamburger button, centered circular "+" button,
 *      centered icon navigation with floating hover tooltips, and compact avatar button.
 * 2. Tablet & Phone (< 1025px):
 *    - Top bar has hamburger menu icon that slides out a Gemini-style drawer overlay with backdrop blur.
 *    - Also preserves one-thumb bottom tab navigation for quick mobile ergonomics.
 * 3. Keyboard Shortcuts:
 *    - Pressing 'N' when no input has focus triggers "+ New Transaction".
 *    - Pressing 'Ctrl+B' or 'Cmd+B' smoothly toggles the sidebar between expanded and collapsed rail.
 */
export function AppShell({ children, onOpenProfile, defaultSidebarCollapsed }: AppShellProps) {
  const { user, signOut } = useAuth();
  const { currentTab, setCurrentTab, isOnline } = useTracker();

  // Desktop sidebar collapsed state (persisted in localStorage or driven by URL param)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (defaultSidebarCollapsed !== undefined) return defaultSidebarCollapsed;
    try {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        if (hash.includes('sidebar=collapsed') || search.includes('sidebar=collapsed')) {
          return true;
        }
        if (hash.includes('sidebar=expanded') || search.includes('sidebar=expanded')) {
          return false;
        }
        return localStorage.getItem('moneytracker_sidebar_collapsed') === 'true';
      }
    } catch {
      return false;
    }
    return false;
  });

  // Mobile drawer state (< 1025px)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('moneytracker_sidebar_collapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  // Sync with URL query/hash changes if present
  useEffect(() => {
    const handleUrlChange = () => {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('sidebar=collapsed') || search.includes('sidebar=collapsed')) {
        setIsSidebarCollapsed(true);
      } else if (hash.includes('sidebar=expanded') || search.includes('sidebar=expanded')) {
        setIsSidebarCollapsed(false);
      }
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Keyboard shortcuts:
  // - Pressing 'N' when no input is focused opens add-transaction form
  // - Pressing 'Ctrl+B' or 'Cmd+B' toggles the sidebar
  // - Pressing 'Escape' closes the mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
        return;
      }

      // Toggle sidebar shortcut: Ctrl+B or Cmd+B
      if ((e.key === 'b' || e.key === 'B') && (e.ctrlKey || e.metaKey)) {
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
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Add transaction shortcut: 'N'
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
  }, [setCurrentTab, toggleSidebar, isMobileDrawerOpen]);

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

  const handleNavigateLegal = useCallback(
    (path: string, hash: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      if (typeof window !== 'undefined') {
        window.location.hash = hash;
        try {
          window.history.pushState({}, '', path);
        } catch {
          // Fallback
        }
        window.dispatchEvent(new Event('popstate'));
      }
    },
    [],
  );

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-sans selection:bg-accent-tint selection:text-accent">
      {/* ====================================================================
          Desktop Left Rail (1025px and wider) — Gemini Web Browser Style
          - Expanded: 256px wide, with brand, + New Transaction pill, pill navigation items, and profile footer
          - Collapsed: 68px slim icon rail with tooltips, centered hamburger, + circular button, and icon-only navigation
          ==================================================================== */}
      <aside
        aria-label="Desktop Sidebar"
        style={{ top: 'var(--shell-top-offset, 0px)' }}
        className={`hidden min-[1025px]:flex fixed inset-y-0 left-0 z-30 flex-col justify-between border-r border-line bg-surface transition-[width,padding] duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
          isSidebarCollapsed ? 'w-[68px] p-2 items-center' : 'w-[256px] p-3.5'
        }`}
      >
        <div className="flex flex-col gap-2 w-full">
          {/* Top Header: Gemini-Style Logo & Sidebar Toggle (Images 1, 2, 3) */}
          {isSidebarCollapsed ? (
            /* Collapsed Rail Top: Expense Tracker Logo morphs to Open Sidebar button on hover (Images 1 & 2) */
            <div className="flex flex-col items-center pt-0.5 pb-1 w-full">
              <div className="relative group flex items-center justify-center">
                <button
                  type="button"
                  data-testid="sidebar-collapse-btn"
                  onClick={toggleSidebar}
                  aria-label="Open sidebar"
                  title="Open sidebar (Ctrl+B)"
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-2 hover:text-ink hover:bg-surface-2 transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {/* Default State: Expense Tracker Brand Logo (Image 1) */}
                  <span className="flex items-center justify-center transition-all duration-150 group-hover:opacity-0 group-hover:scale-75">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-tint text-accent shadow-xs">
                      <WalletIcon size={18} />
                    </div>
                  </span>

                  {/* Hover State: Open Sidebar Toggle Icon (Image 2) */}
                  <span className="absolute inset-0 flex items-center justify-center transition-all duration-150 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 text-ink">
                    <PanelLeftOpenIcon size={20} />
                  </span>
                </button>

                {/* Floating Tooltip Pill: "Open sidebar" (Image 2) */}
                <span className="absolute left-full ml-3 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-xl shadow-2 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50">
                  Open sidebar
                </span>
              </div>
            </div>
          ) : (
            /* Expanded Rail Top: Brand Logo + Title on left, Collapse Sidebar button on right (Image 3) */
            <div className="flex items-center justify-between gap-2 px-1 pt-0.5 pb-1">
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent shadow-xs">
                  <WalletIcon size={18} />
                </div>
                <div className="min-w-0">
                  <span className="font-display text-sm font-semibold tracking-tight text-ink block leading-tight truncate">
                    MoneyTracker
                  </span>
                  <span className="text-[10px] text-ink-3 block whitespace-nowrap">Personal Finance</span>
                </div>
              </div>

              <div className="relative group">
                <button
                  type="button"
                  data-testid="sidebar-collapse-btn"
                  onClick={toggleSidebar}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar (Ctrl+B)"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <PanelLeftIcon size={18} />
                </button>
                <span className="absolute right-0 top-full mt-1 px-2.5 py-1 text-xs font-medium text-white bg-slate-900 rounded-md shadow-2 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  Collapse sidebar
                </span>
              </div>
            </div>
          )}

          {/* Navigation Items (Dashboard, Transactions, Autopay, Analytics) */}
          {isSidebarCollapsed ? (
            <nav aria-label="Desktop Navigation" className="flex flex-col gap-1.5 items-center w-full mt-2">
              {MAIN_NAV_ITEMS.map((item) => {
                const isActive = currentTab === item.id;
                const IconComponent = item.icon;

                return (
                  <div key={item.id} className="relative group flex justify-center w-full">
                    <button
                      type="button"
                      data-tab={item.id}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => setCurrentTab(item.id)}
                      aria-label={item.label}
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isActive
                          ? 'bg-accent-tint text-accent shadow-xs font-semibold'
                          : 'text-ink-3 hover:bg-surface-2 hover:text-ink'
                      }`}
                    >
                      {isActive && (
                        <span
                          aria-hidden="true"
                          data-testid="active-accent-bar"
                          className="sr-only"
                        />
                      )}
                      <IconComponent
                        size={20}
                        className={isActive ? 'text-accent' : 'text-ink-3 group-hover:text-ink'}
                      />
                    </button>
                    {/* Floating Tooltip */}
                    <span className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium text-white bg-slate-900 rounded-md shadow-2 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </nav>
          ) : (
            <nav aria-label="Desktop Navigation" className="flex flex-col gap-1 w-full mt-1">
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
                    className={`group relative flex h-10 w-full items-center gap-3.5 rounded-full px-3.5 text-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isActive
                        ? 'bg-accent-tint text-accent font-semibold'
                        : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                    }`}
                  >
                    {/* Active Accent Bar */}
                    {isActive && (
                      <span
                        aria-hidden="true"
                        data-testid="active-accent-bar"
                        className="absolute left-1 top-2.5 bottom-2.5 w-[3px] rounded-full bg-accent"
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
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Profile & Footer Area at Bottom */}
        {isSidebarCollapsed ? (
          <div className="border-t border-line pt-3 mt-auto flex flex-col gap-2 items-center w-full">
            <div className="relative group flex justify-center">
              <button
                id="profileBtn"
                type="button"
                onClick={onOpenProfile}
                aria-label="Open profile settings"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-tint font-display text-sm font-semibold text-accent hover:ring-2 hover:ring-accent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {userInitial}
              </button>
              <span className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium text-white bg-slate-900 rounded-md shadow-2 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                Profile ({displayName})
              </span>
            </div>

            <div className="relative group flex justify-center">
              <button
                id="signOutBtn"
                type="button"
                onClick={() => signOut()}
                aria-label="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <LogOutIcon size={18} />
              </button>
              <span className="absolute left-full ml-3 px-2.5 py-1 text-xs font-medium text-white bg-slate-900 rounded-md shadow-2 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                Sign out
              </span>
            </div>
          </div>
        ) : (
          <div className="border-t border-line pt-3 mt-auto flex flex-col gap-1.5 w-full">
            <button
              id="profileBtn"
              type="button"
              onClick={onOpenProfile}
              aria-label="Open profile settings"
              className="group flex w-full items-center gap-3 rounded-full p-1.5 hover:bg-surface-2 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent text-left"
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
              <SettingsIcon size={18} className="text-ink-3 group-hover:text-ink shrink-0 mr-1" />
            </button>

            <button
              id="signOutBtn"
              type="button"
              onClick={() => signOut()}
              aria-label="Sign out"
              className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-xs font-medium text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <LogOutIcon size={16} className="shrink-0" />
              <span>Sign out</span>
            </button>

            {/* Legal Links at Bottom of Left Rail */}
            <div className="flex items-center justify-center gap-2 pt-2 px-1 text-[11px] text-ink-3 border-t border-line/60">
              <a
                href="/terms"
                onClick={handleNavigateLegal('/terms', 'terms')}
                className="hover:text-ink hover:underline transition-colors"
              >
                Terms
              </a>
              <span>•</span>
              <a
                href="/privacy"
                onClick={handleNavigateLegal('/privacy', 'privacy')}
                className="hover:text-ink hover:underline transition-colors"
              >
                Privacy
              </a>
            </div>
          </div>
        )}
      </aside>

      {/* ====================================================================
          Top Bar (Title, Offline chip, Add transaction button, Mobile Profile)
          ==================================================================== */}
      <header
        aria-label="App Header"
        style={{ top: 'var(--shell-top-offset, 0px)' }}
        className={`fixed top-0 right-0 left-0 h-16 z-20 bg-surface/95 backdrop-blur-sm border-b border-line flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-[left] duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${
          isSidebarCollapsed ? 'min-[1025px]:left-[68px]' : 'min-[1025px]:left-[256px]'
        }`}
      >
        {/* Left: Mobile Hamburger, Desktop Toggle (when collapsed), Page Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Mobile Hamburger Button (< 1025px) */}
          <button
            type="button"
            aria-label="Open navigation menu"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors min-[1025px]:hidden shrink-0"
          >
            <MenuIcon size={20} />
          </button>

          {/* Desktop Sidebar Toggle Button (header toggle for testing / convenience when collapsed) */}
          {isSidebarCollapsed && (
            <button
              type="button"
              data-testid="header-sidebar-toggle"
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              title="Expand sidebar (Ctrl+B)"
              className="hidden min-[1025px]:inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-2 hover:text-ink hover:bg-surface-2 border border-line/60 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
            >
              <PanelLeftOpenIcon size={18} />
            </button>
          )}

          {/* Page Title */}
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink tracking-tight truncate">
            {pageTitle}
          </h1>
        </div>

        {/* Right: Offline Chip, Add Transaction, Mobile Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Offline chip */}
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
          Mobile Slide-in Drawer (< 1025px) — Gemini Web Style
          ==================================================================== */}
      {isMobileDrawerOpen && (
        <div className="min-[1025px]:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm animate-fadeIn"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div
            role="dialog"
            aria-label="Mobile Navigation Menu"
            className="relative w-[280px] max-w-[85vw] bg-surface h-full shadow-3 border-r border-line p-4 flex flex-col justify-between animate-fadeIn z-10"
          >
            <div className="flex flex-col gap-3">
              {/* Drawer Header with Brand & Close Button */}
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-tint text-accent">
                    <WalletIcon size={18} />
                  </div>
                  <span className="font-display text-base font-semibold text-ink">MoneyTracker</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
                >
                  <XIcon size={18} />
                </button>
              </div>

              {/* Mobile Drawer Navigation Items */}
              <nav aria-label="Mobile Drawer Navigation" className="flex flex-col gap-1 mt-2">
                {MAIN_NAV_ITEMS.map((item) => {
                  const isActive = currentTab === item.id;
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCurrentTab(item.id);
                        setIsMobileDrawerOpen(false);
                      }}
                      className={`flex h-11 w-full items-center gap-3 rounded-full px-3.5 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-accent-tint text-accent font-semibold'
                          : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                      }`}
                    >
                      <IconComponent size={20} className={isActive ? 'text-accent' : 'text-ink-3'} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Drawer Profile & Legal Footer */}
            <div className="border-t border-line pt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenProfile();
                  setIsMobileDrawerOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-full p-1.5 hover:bg-surface-2 transition-colors text-left"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-tint font-display text-sm font-semibold text-accent">
                  {userInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{displayName}</p>
                  <p className="truncate text-xs text-ink-3">{user?.email || ''}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  signOut();
                  setIsMobileDrawerOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-xs font-medium text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors"
              >
                <LogOutIcon size={16} />
                <span>Sign out</span>
              </button>

              <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-ink-3 border-t border-line/60">
                <a
                  href="/terms"
                  onClick={(e) => {
                    handleNavigateLegal('/terms', 'terms')(e);
                    setIsMobileDrawerOpen(false);
                  }}
                  className="hover:text-ink hover:underline"
                >
                  Terms
                </a>
                <span>•</span>
                <a
                  href="/privacy"
                  onClick={(e) => {
                    handleNavigateLegal('/privacy', 'privacy')(e);
                    setIsMobileDrawerOpen(false);
                  }}
                  className="hover:text-ink hover:underline"
                >
                  Privacy
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          Main Content Area (160ms CSS Cross-Fade on Route Change)
          ==================================================================== */}
      <main
        style={{ paddingTop: 'calc(4rem + var(--shell-top-offset, 0px))' }}
        className={`flex-1 w-full pt-16 pb-20 min-[1025px]:pb-10 transition-[padding-left] duration-200 ease-[cubic-bezier(0.2,0,0,1)] flex flex-col ${
          isSidebarCollapsed ? 'min-[1025px]:pl-[68px]' : 'min-[1025px]:pl-[256px]'
        }`}
      >
        <div className="mx-auto max-w-content w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col justify-between">
          <div key={currentTab} className="route-fade-content w-full flex-1">
            {children}
          </div>

          {/* ====================================================================
              Footer with Terms & Privacy links (Always at the bottom of the website)
              ==================================================================== */}
          <footer
            id="websiteFooter"
            aria-label="Website Footer"
            className="mt-12 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-3"
          >
            <div>
              <span>MoneyTracker • Personal Finance Manager</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/terms"
                onClick={handleNavigateLegal('/terms', 'terms')}
                className="hover:text-ink transition-colors hover:underline font-medium"
              >
                Terms and Conditions
              </a>
              <span>•</span>
              <a
                href="/privacy"
                onClick={handleNavigateLegal('/privacy', 'privacy')}
                className="hover:text-ink transition-colors hover:underline font-medium"
              >
                Privacy Policy
              </a>
            </div>
          </footer>
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
