export type AppRoute = 'terms' | 'privacy' | 'design' | 'audit' | 'not-found' | null;

export function resolveAppRoute(pathname: string, hash: string): AppRoute {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const cleanHash = hash.replace(/^#\/?/, '');

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
