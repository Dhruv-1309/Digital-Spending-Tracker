import { useState, useEffect, lazy, Suspense } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { TrackerProvider } from './context/TrackerContext';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { NotFoundPage } from './components/common/NotFoundPage';
import { TermsPage } from './components/legal/TermsPage';
import { PrivacyPage } from './components/legal/PrivacyPage';
import { HelpPage } from './components/help/HelpPage';
import { LandingPage } from './components/landing/LandingPage';
import { type AppRoute, resolveAppRoute, navigateTo } from './lib/routes';

// Dev-only routes /design and /audit, completely pruned from production builds via import.meta.env.DEV
const DevDesignPage = import.meta.env.DEV
  ? lazy(() => import('./components/dev/DesignSystemDevPage'))
  : null;

const DevStateAuditPage = import.meta.env.DEV
  ? lazy(() => import('./components/dev/StateAuditDevPage'))
  : null;

function useAppRoute(): AppRoute {
  const [route, setRoute] = useState<AppRoute>(() => {
    if (typeof window === 'undefined') return null;
    return resolveAppRoute(window.location.pathname, window.location.hash);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocationChange = () => {
      setRoute(resolveAppRoute(window.location.pathname, window.location.hash));
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  return route;
}

export function App() {
  const route = useAppRoute();

  // Dynamic document.title for public, legal, and auxiliary routes (UX-13)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    switch (route) {
      case 'landing':
        document.title = 'MoneyTracker — Smart Cashflow & Spending Tracker';
        break;
      case 'terms':
        document.title = 'Terms and Conditions — MoneyTracker';
        break;
      case 'privacy':
        document.title = 'Privacy Policy — MoneyTracker';
        break;
      case 'help':
        document.title = 'Help & Support — MoneyTracker';
        break;
      case 'not-found':
        document.title = 'Page Not Found — MoneyTracker';
        break;
      case 'design':
        document.title = 'Design System — MoneyTracker Dev';
        break;
      case 'audit':
        document.title = 'State Audit — MoneyTracker Dev';
        break;
      default:
        // Main application views set their document.title via AppShell / AppLayout
        break;
    }
  }, [route]);

  const handleBackToApp = () => {
    navigateTo('/');
  };

  const handleNavigateLegal = (path: '/terms' | '/privacy' | '/help') => (e: React.MouseEvent) => {
    e.preventDefault();
    navigateTo(path);
  };

  if (route === 'landing') {
    return (
      <LazyMotion features={domAnimation} strict>
        <LandingPage
          onGetStarted={handleBackToApp}
          onNavigateLegal={handleNavigateLegal}
        />
      </LazyMotion>
    );
  }

  if (route === 'terms') {
    return (
      <LazyMotion features={domAnimation} strict>
        <TermsPage onBack={handleBackToApp} />
      </LazyMotion>
    );
  }

  if (route === 'privacy') {
    return (
      <LazyMotion features={domAnimation} strict>
        <PrivacyPage onBack={handleBackToApp} />
      </LazyMotion>
    );
  }

  if (route === 'help') {
    return (
      <LazyMotion features={domAnimation} strict>
        <HelpPage onBack={handleBackToApp} />
      </LazyMotion>
    );
  }

  if (route === 'not-found') {
    return (
      <LazyMotion features={domAnimation} strict>
        <NotFoundPage onBack={handleBackToApp} />
      </LazyMotion>
    );
  }

  if (import.meta.env.DEV && route === 'audit' && DevStateAuditPage) {
    return (
      <LazyMotion features={domAnimation} strict>
        <Suspense fallback={<div style={{ padding: 24 }}>Loading state audit...</div>}>
          <DevStateAuditPage />
        </Suspense>
      </LazyMotion>
    );
  }

  if (import.meta.env.DEV && route === 'design' && DevDesignPage) {
    return (
      <LazyMotion features={domAnimation} strict>
        <Suspense fallback={<div style={{ padding: 24 }}>Loading design tokens...</div>}>
          <DevDesignPage />
        </Suspense>
      </LazyMotion>
    );
  }

  return (
    <ErrorBoundary>
      <LazyMotion features={domAnimation} strict>
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              <TrackerProvider>
                <AppLayout />
              </TrackerProvider>
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </LazyMotion>
    </ErrorBoundary>
  );
}

export default App;
