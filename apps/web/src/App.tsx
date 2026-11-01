import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { TrackerProvider } from './context/TrackerContext';
import { AppLayout } from './components/layout/AppLayout';

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <TrackerProvider>
            <AppLayout />
          </TrackerProvider>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
