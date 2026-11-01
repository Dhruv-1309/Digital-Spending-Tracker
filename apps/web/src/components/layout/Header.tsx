import { useContext } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { TrackerContext } from '../../context/trackerContextDef';

export interface HeaderProps {
  onOpenProfile: () => void;
}

export function Header({ onOpenProfile }: HeaderProps) {
  const { user, signOut } = useAuth();
  const tracker = useContext(TrackerContext);
  const isOnline = tracker?.isOnline ?? true;
  const pendingSyncCount = tracker?.pendingSyncCount ?? 0;

  return (
    <div className="header">
      <div className="clean-header-content">
        <div className="header-left">
          <div className="brand">
            <div className="brand-icon">
              <i className="fas fa-wallet" />
            </div>
            <div className="brand-text">
              <h1>MoneyTracker</h1>
              <p>Overview &amp; Analysis</p>
            </div>
          </div>
        </div>

        <div className="header-right">
          <div
            className="sync-status-indicator"
            data-testid="sync-status-indicator"
            title={
              !isOnline
                ? 'Offline'
                : pendingSyncCount > 0
                  ? `${pendingSyncCount} changes pending sync`
                  : 'Synced'
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              marginRight: '12px',
              color: 'var(--text-secondary, #94a3b8)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: !isOnline
                  ? '#ef4444'
                  : pendingSyncCount > 0
                    ? '#eab308'
                    : '#22c55e',
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 500 }}>
              {!isOnline
                ? 'Offline'
                : pendingSyncCount > 0
                  ? `${pendingSyncCount} pending`
                  : 'Synced'}
            </span>
          </div>

          <div className="user-badge">
            <span id="userEmail" className="user-email-text">
              {user?.email || ''}
            </span>
            <div className="header-actions">
              <button
                id="profileBtn"
                className="h-btn"
                title="Profile"
                aria-label="Open profile settings"
                type="button"
                onClick={onOpenProfile}
              >
                <i className="fas fa-user" />
              </button>
              <button
                id="signOutBtn"
                className="h-btn logout"
                title="Sign Out"
                aria-label="Sign out"
                type="button"
                onClick={() => signOut()}
              >
                <i className="fas fa-sign-out-alt" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
