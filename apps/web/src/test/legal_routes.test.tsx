import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TermsPage } from '../components/legal/TermsPage';
import { PrivacyPage } from '../components/legal/PrivacyPage';
import { AuthModal } from '../components/auth/AuthModal';
import { AuthContext } from '../context/authContextDef';
import { ToastContext } from '../context/toastContextDef';
import { App } from '../App';

describe('Legal & Signup Protection Specifications', () => {
  describe('TermsPage (/terms)', () => {
    it('renders the plain-language terms title and summary badge', () => {
      render(<TermsPage />);
      expect(screen.getByRole('heading', { level: 1, name: /Terms and Conditions/i })).toBeInTheDocument();
      expect(screen.getByText(/Plain-Language Policy/i)).toBeInTheDocument();
    });

    it('covers all required clauses: personal project, as-is, user responsibility, friend-sharing anti-spam, and account deletion', () => {
      render(<TermsPage />);
      // 1. Personal project & as-is with no uptime guarantee
      expect(screen.getByText(/Personal Project & “As-Is” Availability/i)).toBeInTheDocument();
      expect(screen.getByText(/there is no uptime guarantee/i)).toBeInTheDocument();

      // 2. User responsibility
      expect(screen.getByText(/Your Account & What You Log/i)).toBeInTheDocument();
      expect(screen.getByText(/You are solely responsible for keeping your login credentials/i)).toBeInTheDocument();

      // 3. Friend-sharing anti-spam & anti-harassment
      expect(screen.getByText(/Friend-Sharing & Anti-Spam Rules/i)).toBeInTheDocument();
      expect(screen.getByText(/Zero tolerance for spam or harassment/i)).toBeInTheDocument();
      expect(screen.getByText(/Misuse of sharing features or violation of these rules can and will result in immediate, permanent account removal/i)).toBeInTheDocument();

      // 4. Account deletion on request
      expect(screen.getByText(/Account Deletion on Request/i)).toBeInTheDocument();
      expect(screen.getByText(/permanently delete all data associated with it at any time/i)).toBeInTheDocument();
    });

    it('triggers onBack callback when clicking Back to App button', () => {
      const onBackMock = vi.fn();
      render(<TermsPage onBack={onBackMock} />);
      const backBtn = screen.getByRole('button', { name: /Back to App/i });
      fireEvent.click(backBtn);
      expect(onBackMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('PrivacyPage (/privacy)', () => {
    it('renders privacy policy with plain-language assurances and no-trackers principle', () => {
      render(<PrivacyPage />);
      expect(screen.getByRole('heading', { level: 1, name: /Privacy Policy/i })).toBeInTheDocument();
      expect(screen.getByText(/Privacy First — No Trackers, No Data Selling/i)).toBeInTheDocument();
      expect(screen.getByText(/Information We Collect/i)).toBeInTheDocument();
      expect(screen.getByText(/Data Retention & Permanent Deletion/i)).toBeInTheDocument();
    });
  });

  describe('Signup Form Agreement Links (AuthModal)', () => {
    const mockAuthContext = {
      user: null,
      loading: false,
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      signInWithGoogle: vi.fn(),
      sendPasswordReset: vi.fn(),
      signOut: vi.fn(),
      updateDisplayName: vi.fn(),
      updatePassword: vi.fn(),
      deleteAccount: vi.fn(),
    };

    const mockToastContext = {
      toasts: [],
      showToast: vi.fn(),
      dismissToast: vi.fn(),
    };

    it('displays Terms and Conditions and Privacy Policy links on signup mode', () => {
      render(
        <AuthContext.Provider value={mockAuthContext}>
          <ToastContext.Provider value={mockToastContext}>
            <AuthModal />
          </ToastContext.Provider>
        </AuthContext.Provider>,
      );

      // Switch to sign up mode
      const signUpTab = screen.getByRole('radio', { name: /Sign Up/i });
      fireEvent.click(signUpTab);

      // Verify agreement text
      expect(
        screen.getByText(/By creating an account, you agree to our/i),
      ).toBeInTheDocument();

      const termsLinks = screen.getAllByRole('link', { name: /Terms and Conditions/i });
      expect(termsLinks.length).toBeGreaterThan(0);

      const privacyLinks = screen.getAllByRole('link', { name: /Privacy Policy/i });
      expect(privacyLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Route Handling in App', () => {
    it('renders TermsPage when location hash is #terms', () => {
      window.location.hash = '#terms';
      render(<App />);
      expect(screen.getByRole('heading', { level: 1, name: /Terms and Conditions/i })).toBeInTheDocument();
      window.location.hash = '';
    });

    it('renders PrivacyPage when location hash is #privacy', () => {
      window.location.hash = '#privacy';
      render(<App />);
      expect(screen.getByRole('heading', { level: 1, name: /Privacy Policy/i })).toBeInTheDocument();
      window.location.hash = '';
    });
  });
});
