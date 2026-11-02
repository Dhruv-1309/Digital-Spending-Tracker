import { useState, useEffect, lazy, Suspense } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { TrackerProvider } from './context/TrackerContext';
import { AppLayout } from './components/layout/AppLayout';

// Dev-only route /design, completely pruned from production builds via import.meta.env.DEV
const DevDesignPage = import.meta.env.DEV
  ? lazy(() => import('./components/dev/DesignSystemDevPage'))
  : null;

function useIsDesignRoute() {
  const [isDesign, setIsDesign] = useState(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return false;
    return window.location.pathname === '/design' || window.location.hash === '#design';
  });

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') return;
    const handleLocationChange = () => {
      setIsDesign(window.location.pathname === '/design' || window.location.hash === '#design');
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  return isDesign;
}

export function App() {
  const isDesign = useIsDesignRoute();

  if (import.meta.env.DEV && isDesign && DevDesignPage) {
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
