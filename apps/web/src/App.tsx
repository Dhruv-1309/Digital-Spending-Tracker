import { useState, useEffect, lazy, Suspense } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { TrackerProvider } from './context/TrackerContext';
import { AppLayout } from './components/layout/AppLayout';
import { TermsPage } from './components/legal/TermsPage';
import { PrivacyPage } from './components/legal/PrivacyPage';

// Dev-only routes /design and /audit, completely pruned from production builds via import.meta.env.DEV
const DevDesignPage = import.meta.env.DEV
  ? lazy(() => import('./components/dev/DesignSystemDevPage'))
  : null;

const DevStateAuditPage = import.meta.env.DEV
  ? lazy(() => import('./components/dev/StateAuditDevPage'))
  : null;

type AppRoute = 'terms' | 'privacy' | 'design' | 'audit' | null;

function useAppRoute(): AppRoute {
  const [route, setRoute] = useState<AppRoute>(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const hash = window.location.hash;

    if (path === '/terms' || hash.startsWith('#terms')) return 'terms';
    if (path === '/privacy' || hash.startsWith('#privacy')) return 'privacy';

    if (import.meta.env.DEV) {
      if (path === '/design' || hash.startsWith('#design')) return 'design';
      if (path === '/audit' || hash.startsWith('#audit')) return 'audit';
    }
    return null;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      if (path === '/terms' || hash.startsWith('#terms')) {
        setRoute('terms');
      } else if (path === '/privacy' || hash.startsWith('#privacy')) {
        setRoute('privacy');
      } else if (import.meta.env.DEV && (path === '/design' || hash.startsWith('#design'))) {
        setRoute('design');
      } else if (import.meta.env.DEV && (path === '/audit' || hash.startsWith('#audit'))) {
        setRoute('audit');
      } else {
        setRoute(null);
      }
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

  const handleBackToApp = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = '';
      try {
        window.history.pushState({}, '', '/');
      } catch {
        // Fallback
      }
      window.dispatchEvent(new Event('popstate'));
    }
  };

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
  );
}

export default App;
