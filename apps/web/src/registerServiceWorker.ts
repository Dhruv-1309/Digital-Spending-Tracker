/**
 * MoneyTracker Service Worker Registration (PERF-9, PERF-14)
 * Registers /sw.js in production environments when service workers are supported.
 */

export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  window.dispatchEvent(new CustomEvent('sw-updated'));
                }
              });
            }
          });
        })
        .catch((error: unknown) => {
          window.dispatchEvent(new CustomEvent('sw-registration-failed', { detail: error }));
        });
    });
  }
}
