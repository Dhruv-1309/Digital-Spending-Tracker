import { useAuth } from '../../hooks/useAuth';

export interface HeaderProps {
  onOpenProfile: () => void;
}

export function Header({ onOpenProfile }: HeaderProps) {
  const { user, signOut } = useAuth();

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
