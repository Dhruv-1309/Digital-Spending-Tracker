import { describe, it, expect } from 'vitest';
import indexHtml from '../../index.html?raw';

describe('SEO, Canonical URLs, and Social Previews (WEB-9)', () => {
  it('defines page title and meta description for SEO', () => {
    expect(indexHtml).toContain('<title>MoneyTracker — Owned, Privacy-First Personal Finance</title>');
    expect(indexHtml).toContain('<meta name="description"');
    expect(indexHtml).toContain('content="MoneyTracker is an owned, integer-precise personal finance engine engineered for privacy.');
  });

  it('defines canonical link to prevent duplicate content indexing', () => {
    expect(indexHtml).toContain('<link rel="canonical" href="https://moneytracker.app/" />');
  });

  it('declares Open Graph tags for rich previews across platforms', () => {
    expect(indexHtml).toContain('<meta property="og:type" content="website" />');
    expect(indexHtml).toContain('<meta property="og:url" content="https://moneytracker.app/" />');
    expect(indexHtml).toContain('<meta property="og:title" content="MoneyTracker — Owned, Privacy-First Personal Finance" />');
    expect(indexHtml).toContain('<meta property="og:description"');
    expect(indexHtml).toContain('<meta property="og:image" content="https://moneytracker.app/og-image.png" />');
    expect(indexHtml).toContain('<meta property="og:site_name" content="MoneyTracker" />');
  });

  it('declares Twitter summary_large_image card tags', () => {
    expect(indexHtml).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(indexHtml).toContain('<meta name="twitter:url" content="https://moneytracker.app/" />');
    expect(indexHtml).toContain('<meta name="twitter:title" content="MoneyTracker — Owned, Privacy-First Personal Finance" />');
    expect(indexHtml).toContain('<meta name="twitter:description"');
    expect(indexHtml).toContain('<meta name="twitter:image" content="https://moneytracker.app/og-image.png" />');
  });
});

describe('Touch Icons, Theme Color, and PWA Headers (WEB-11)', () => {
  it('configures light and dark theme-color meta headers', () => {
    expect(indexHtml).toContain('<meta name="theme-color" content="#2563EB" media="(prefers-color-scheme: light)" />');
    expect(indexHtml).toContain('<meta name="theme-color" content="#0F172A" media="(prefers-color-scheme: dark)" />');
  });

  it('configures apple-touch-icon and web app capable headers', () => {
    expect(indexHtml).toContain('<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />');
    expect(indexHtml).toContain('<meta name="mobile-web-app-capable" content="yes" />');
    expect(indexHtml).toContain('<meta name="apple-mobile-web-app-capable" content="yes" />');
    expect(indexHtml).toContain('<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />');
    expect(indexHtml).toContain('<meta name="apple-mobile-web-app-title" content="MoneyTracker" />');
  });
});

describe('Structured Data Schema.org JSON-LD (WEB-19)', () => {
  it('embeds valid SoftwareApplication JSON-LD snippet', () => {
    expect(indexHtml).toContain('<script type="application/ld+json">');
    expect(indexHtml).toContain('"@type": "SoftwareApplication"');
    expect(indexHtml).toContain('"applicationCategory": "FinanceApplication"');
    expect(indexHtml).toContain('"name": "MoneyTracker"');
    expect(indexHtml).toContain('"price": "0"');
    expect(indexHtml).toContain('"priceCurrency": "INR"');
  });
});
