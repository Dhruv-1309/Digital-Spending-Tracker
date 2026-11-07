import type { NavTab } from '../types';
import { logger } from './logger';

export type AppRoute = 'landing' | 'terms' | 'privacy' | 'about' | 'accessibility' | 'help' | 'design' | 'audit' | 'not-found' | null;

export const VALID_NAV_TABS: readonly NavTab[] = [
  'dashboard',
  'transactions',
  'autopay',
  'analytics',
  'add-transaction',
] as const;

export function isValidNavTab(tab: string): tab is NavTab {
  return VALID_NAV_TABS.includes(tab as NavTab);
}

/**
 * Extracts the intended NavTab from pathname, hash, or search params (?redirect=/transactions or ?tab=analytics).
 */
export function getTabFromRoute(pathname: string, hash: string, search: string = ''): NavTab | null {
  // Check search query param (?redirect=/transactions or ?tab=analytics)
  if (search) {
    try {
      const searchStr = search.startsWith('?') ? search.slice(1) : search;
      const params = new URLSearchParams(searchStr);
      const redirectParam = params.get('redirect') || params.get('tab');
      if (redirectParam) {
        const cleanParam = redirectParam.replace(/^\/+/, '').replace(/^#\/?/, '').split('?')[0];
        if (isValidNavTab(cleanParam)) {
          return cleanParam;
        }
      }
    } catch {
      // ignore malformed query string
    }
  }

  // Check hash first (e.g. #transactions, #autopay)
  const cleanHash = hash.replace(/^#\/?/, '').split('?')[0];
  if (isValidNavTab(cleanHash)) {
    return cleanHash;
  }

  // Check path (e.g. /transactions, /autopay)
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const pathSegment = cleanPath.replace(/^\/+/, '').split('?')[0];
  if (isValidNavTab(pathSegment)) {
    return pathSegment;
  }

  return null;
}

export function resolveAppRoute(pathname: string, hash: string): AppRoute {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const cleanHash = hash.replace(/^#\/?/, '').split('?')[0];

  if (cleanPath === '/landing' || cleanHash === 'landing') return 'landing';
  if (cleanPath === '/about' || cleanHash === 'about') return 'about';
  if (cleanPath === '/accessibility' || cleanHash === 'accessibility') return 'accessibility';
  if (cleanPath === '/terms' || cleanHash === 'terms') return 'terms';
  if (cleanPath === '/privacy' || cleanHash === 'privacy') return 'privacy';
  if (cleanPath === '/help' || cleanHash === 'help' || cleanPath === '/faq' || cleanHash === 'faq') return 'help';

  if (import.meta.env.DEV) {
    if (cleanPath === '/design' || cleanHash === 'design') return 'design';
    if (cleanPath === '/audit' || cleanHash === 'audit') return 'audit';
  }

  // Root or login/signin aliases
  if (cleanPath === '/' && (!cleanHash || cleanHash === '')) {
    return null;
  }

  if (cleanPath === '/login' || cleanPath === '/signin' || cleanHash === 'login' || cleanHash === 'signin') {
    return null;
  }

  // Check if it matches an internal application tab (e.g. /transactions, /autopay, etc.)
  const tabFromPath = cleanPath.replace(/^\/+/, '').split('?')[0];
  if (isValidNavTab(tabFromPath) || isValidNavTab(cleanHash)) {
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
