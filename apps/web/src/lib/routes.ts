import { logger } from './logger';

export type AppRoute = 'landing' | 'terms' | 'privacy' | 'design' | 'audit' | 'not-found' | null;

export function resolveAppRoute(pathname: string, hash: string): AppRoute {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const cleanHash = hash.replace(/^#\/?/, '');

  if (cleanPath === '/landing' || cleanHash === 'landing' || cleanPath === '/about' || cleanHash === 'about') return 'landing';
  if (cleanPath === '/terms' || cleanHash === 'terms') return 'terms';
  if (cleanPath === '/privacy' || cleanHash === 'privacy') return 'privacy';

  if (import.meta.env.DEV) {
    if (cleanPath === '/design' || cleanHash === 'design') return 'design';
    if (cleanPath === '/audit' || cleanHash === 'audit') return 'audit';
  }

  if (cleanPath === '/' && (!cleanHash || cleanHash === '')) {
    return null;
  }

  return 'not-found';
}

/**
 * Programmatic client-side navigation helper with fallback and error logging (QA-9).
 */
export function navigateTo(path: string): void {
  if (typeof window === 'undefined') return;
  const clean = path.startsWith('/') ? path : `/${path}`;
  const hashKey = clean === '/' ? '' : clean.replace(/^\//, '');
  window.location.hash = hashKey;
  try {
    window.history.pushState({}, '', clean);
  } catch (err: unknown) {
    logger.warn('Failed to update browser history in pushState', err, { path: clean });
  }
  window.dispatchEvent(new Event('popstate'));
}
