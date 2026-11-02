import { useState, useEffect, lazy, Suspense } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { TrackerProvider } from './context/TrackerContext';
import { AppLayout } from './components/layout/AppLayout';

// Dev-only routes /design and /audit, completely pruned from production builds via import.meta.env.DEV
const DevDesignPage = import.meta.env.DEV
  ? lazy(() => import('./components/dev/DesignSystemDevPage'))
  : null;

const DevStateAuditPage = import.meta.env.DEV
  ? lazy(() => import('./components/dev/StateAuditDevPage'))
  : null;

function useDevRoute() {
  const [devRoute, setDevRoute] = useState<'design' | 'audit' | null>(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/design' || hash.startsWith('#design')) return 'design';
    if (path === '/audit' || hash.startsWith('#audit')) return 'audit';
    return null;
  });

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return;
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/design' || hash.startsWith('#design')) setDevRoute('design');
      else if (path === '/audit' || hash.startsWith('#audit')) setDevRoute('audit');
      else setDevRoute(null);
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  return devRoute;
}

export function App() {
  const devRoute = useDevRoute();

  if (import.meta.env.DEV && devRoute === 'audit' && DevStateAuditPage) {
    return (
      <LazyMotion features={domAnimation} strict>
        <Suspense fallback={<div style={{ padding: 24 }}>Loading state audit...</div>}>
          <DevStateAuditPage />
        </Suspense>
      </LazyMotion>
    );
  }

  if (import.meta.env.DEV && devRoute === 'design' && DevDesignPage) {
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
