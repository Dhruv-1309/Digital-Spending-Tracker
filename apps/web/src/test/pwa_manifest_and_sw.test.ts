import { describe, it, expect, vi, afterEach } from 'vitest';
import { registerServiceWorker } from '../registerServiceWorker';
import manifestRaw from '../../public/manifest.json?raw';
import swRaw from '../../public/sw.js?raw';
import indexHtmlRaw from '../../index.html?raw';

describe('PWA Web App Manifest & Service Worker (PERF-9, PERF-14)', () => {
  it('manifest.json exists and is valid JSON', () => {
    expect(manifestRaw).toBeDefined();
    const manifest = JSON.parse(manifestRaw);
    expect(manifest).toBeDefined();
    expect(typeof manifest).toBe('object');
  });

  it('manifest contains required PWA metadata according to W3C spec', () => {
    const manifest = JSON.parse(manifestRaw);

    expect(manifest.name).toBe('MoneyTracker — Personal Spending Tracker');
    expect(manifest.short_name).toBe('MoneyTracker');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#2563EB');
    expect(manifest.background_color).toBe('#FBF8F4');
    expect(Array.isArray(manifest.categories)).toBe(true);
    expect(manifest.categories).toContain('finance');
  });

  it('manifest includes standard and maskable icons (PERF-14)', () => {
    const manifest = JSON.parse(manifestRaw);
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(4);

    const maskableIcons = manifest.icons.filter(
      (icon: { purpose?: string }) => icon.purpose && icon.purpose.includes('maskable'),
    );
    expect(maskableIcons.length).toBeGreaterThanOrEqual(2);

    const maskable192 = maskableIcons.find((i: { sizes: string }) => i.sizes === '192x192');
    const maskable512 = maskableIcons.find((i: { sizes: string }) => i.sizes === '512x512');
    expect(maskable192).toBeDefined();
    expect(maskable512).toBeDefined();

    const standard192 = manifest.icons.find(
      (i: { sizes: string; purpose?: string }) =>
        i.sizes === '192x192' && (!i.purpose || i.purpose.includes('any')),
    );
    const standard512 = manifest.icons.find(
      (i: { sizes: string; purpose?: string }) =>
        i.sizes === '512x512' && (!i.purpose || i.purpose.includes('any')),
    );
    expect(standard192).toBeDefined();
    expect(standard512).toBeDefined();
  });

  it('manifest defines standard and maskable icons with png type and valid paths', () => {
    const manifest = JSON.parse(manifestRaw);
    const expectedIcons = [
      '/pwa-192x192.png',
      '/pwa-512x512.png',
      '/pwa-maskable-192x192.png',
      '/pwa-maskable-512x512.png',
    ];
    for (const expectedSrc of expectedIcons) {
      const match = manifest.icons.find((icon: { src: string }) => icon.src === expectedSrc);
      expect(match).toBeDefined();
      expect(match.type).toBe('image/png');
    }
  });

  it('manifest defines quick shortcuts for core app workflows', () => {
    const manifest = JSON.parse(manifestRaw);
    expect(Array.isArray(manifest.shortcuts)).toBe(true);
    expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(3);

    const addShortcut = manifest.shortcuts.find(
      (s: { url: string }) => s.url === '/add-transaction',
    );
    const txShortcut = manifest.shortcuts.find((s: { url: string }) => s.url === '/transactions');
    const analyticsShortcut = manifest.shortcuts.find((s: { url: string }) => s.url === '/analytics');

    expect(addShortcut).toBeDefined();
    expect(txShortcut).toBeDefined();
    expect(analyticsShortcut).toBeDefined();
  });

  it('service worker sw.js exists and defines lifecycle handlers', () => {
    expect(swRaw).toBeDefined();

    // Verification of service worker lifecycle events
    expect(swRaw).toContain("addEventListener('install'");
    expect(swRaw).toContain("addEventListener('activate'");
    expect(swRaw).toContain("addEventListener('fetch'");

    // Verifies pre-caching app shell assets
    expect(swRaw).toContain('STATIC_PRECACHE');
    expect(swRaw).toContain("'/index.html'");
    expect(swRaw).toContain("'/offline.html'");
    expect(swRaw).toContain("'/manifest.json'");

    // Verifies security/bypass rules for API and Auth
    expect(swRaw).toContain("url.pathname.startsWith('/api')");
    expect(swRaw).toContain("url.hostname.includes('firebase')");
  });

  it('index.html links to manifest.json', () => {
    expect(indexHtmlRaw).toContain('<link rel="manifest" href="/manifest.json" />');
  });

  describe('registerServiceWorker()', () => {
    const originalNavigator = globalThis.navigator;

    afterEach(() => {
      vi.restoreAllMocks();
      Object.defineProperty(globalThis, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
    });

    it('does not register sw in development environment', () => {
      const mockRegister = vi.fn();
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          serviceWorker: {
            register: mockRegister,
          },
        },
        configurable: true,
      });

      registerServiceWorker();
      window.dispatchEvent(new Event('load'));

      // In test mode import.meta.env.PROD is false
      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('gracefully handles missing navigator.serviceWorker without throw', () => {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        configurable: true,
      });

      expect(() => {
        registerServiceWorker();
        window.dispatchEvent(new Event('load'));
      }).not.toThrow();
    });
  });
});
