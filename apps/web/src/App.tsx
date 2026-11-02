import { LazyMotion, domAnimation } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { TrackerProvider } from './context/TrackerContext';
import { AppLayout } from './components/layout/AppLayout';

export function App() {
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
