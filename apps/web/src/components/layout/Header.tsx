import { useContext } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { TrackerContext } from '../../context/trackerContextDef';
import {
  UserIcon,
  LogOutIcon,
  PlusIcon,
  WifiOffIcon,
} from '../common/icons';
import { Button } from '../common/Button';

export interface HeaderProps {
  onOpenProfile: () => void;
  onOpenAdd?: () => void;
  title?: string;
}

export function Header({ onOpenProfile, onOpenAdd, title = 'Overview' }: HeaderProps) {
  const { user, signOut } = useAuth();
  const tracker = useContext(TrackerContext);
  const isOnline = tracker?.isOnline ?? true;
  const pendingSyncCount = tracker?.pendingSyncCount ?? 0;

  return (
    <header className="header sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-8 bg-surface/90 backdrop-blur-md border-b border-line">
      {/* Title / Section info */}
      <div className="flex items-center gap-2">
        <span className="font-display text-section-title font-semibold text-ink capitalize">
          {title}
        </span>
      </div>

      {/* Right Side: Offline chip, Add Button, Profile & Sync status */}
      <div className="header-right flex items-center gap-3">
        {/* Offline / Pending Sync chip */}
        {(!isOnline || pendingSyncCount > 0) && (
          <div
            className="sync-status-indicator inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-medium border"
            data-testid="sync-status-indicator"
            style={{
              backgroundColor: !isOnline ? 'var(--danger-tint)' : 'var(--warning-tint)',
              borderColor: !isOnline ? 'var(--danger)' : 'var(--warning)',
              color: !isOnline ? 'var(--danger)' : 'var(--warning)',
            }}
            title={
              !isOnline
                ? 'Working offline. Changes will sync when reconnected.'
                : `${pendingSyncCount} changes pending sync`
            }
          >
            {!isOnline ? <WifiOffIcon size={13} /> : <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />}
            <span>
              {!isOnline
                ? 'Offline'
                : `${pendingSyncCount} pending`}
            </span>
          </div>
        )}

        {/* Global Add Transaction Button (with N keyboard shortcut indicator) */}
        {onOpenAdd && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAdd}
            className="hidden sm:inline-flex items-center gap-1.5"
            leftIcon={<PlusIcon size={15} />}
          >
            <span>Add</span>
            <kbd className="hidden lg:inline-block ml-1 px-1.5 py-0.2 bg-white/20 text-white rounded text-[10px] font-mono">
              N
            </kbd>
          </Button>
        )}

        {/* User Badge / Profile trigger */}
        <div className="user-badge flex items-center gap-2 pl-2 border-l border-line">
          <span
            id="userEmail"
            className="user-email-text hidden xl:inline-block text-caption font-medium text-ink-2 max-w-[180px] truncate"
            title={user?.email || ''}
          >
            {user?.email || ''}
          </span>

          <div className="header-actions flex items-center gap-1">
            <button
              id="profileBtn"
              className="h-btn p-1.5 rounded-btn hover:bg-surface-2 text-ink-2 hover:text-ink transition-colors"
              title="Profile"
              aria-label="Open profile settings"
              type="button"
              onClick={onOpenProfile}
            >
              <div className="w-7 h-7 rounded-full bg-accent-tint text-accent flex items-center justify-center font-semibold text-caption border border-accent/20">
                {user?.displayName ? (
                  user.displayName.charAt(0).toUpperCase()
                ) : user?.email ? (
                  user.email.charAt(0).toUpperCase()
                ) : (
                  <UserIcon size={14} />
                )}
              </div>
            </button>

            <button
              id="signOutBtn"
              className="h-btn logout p-1.5 rounded-btn hover:bg-danger-tint text-ink-3 hover:text-danger transition-colors"
              title="Sign Out"
              aria-label="Sign out"
              type="button"
              onClick={() => signOut()}
            >
              <LogOutIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
