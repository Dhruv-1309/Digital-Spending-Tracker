import { describe, it, expect } from 'vitest';
import vercelConfig from '../../vercel.json';
import rawHeaders from '../../public/_headers?raw';

describe('Security Headers Configuration (SEC-4)', () => {
  it('vercel.json specifies required security headers with strict CSP and frame-ancestors', () => {
    expect(vercelConfig.headers).toBeDefined();
    const routeHeaders = vercelConfig.headers[0].headers;
    const headerMap = new Map(routeHeaders.map((h: { key: string; value: string }) => [h.key, h.value]));

    expect(headerMap.has('Content-Security-Policy')).toBe(true);
    const csp = headerMap.get('Content-Security-Policy');
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");

    expect(headerMap.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headerMap.get('X-Frame-Options')).toBe('DENY');
    expect(headerMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headerMap.get('Permissions-Policy')).toContain('camera=()');
    expect(headerMap.get('Permissions-Policy')).toContain('microphone=()');
    expect(headerMap.get('Permissions-Policy')).toContain('geolocation=()');
    expect(headerMap.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
  });

  it('public/_headers specifies required security headers for static deployments', () => {
    expect(rawHeaders).toContain("frame-ancestors 'none'");
    expect(rawHeaders).toContain('X-Content-Type-Options: nosniff');
    expect(rawHeaders).toContain('X-Frame-Options: DENY');
    expect(rawHeaders).toContain('Referrer-Policy: strict-origin-when-cross-origin');
    expect(rawHeaders).toContain('camera=(), microphone=(), geolocation=()');
    expect(rawHeaders).toContain('Cross-Origin-Opener-Policy: same-origin');
  });
});
