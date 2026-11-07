import { describe, it, expect } from 'vitest';
import robotsTxt from '../../public/robots.txt?raw';
import sitemapXml from '../../public/sitemap.xml?raw';

describe('Robots and Sitemap Discovery (WEB-10)', () => {
  it('configures robots.txt to permit public pages and restrict dev routes', () => {
    expect(robotsTxt).toContain('User-agent: *');
    expect(robotsTxt).toContain('Allow: /landing');
    expect(robotsTxt).toContain('Allow: /terms');
    expect(robotsTxt).toContain('Allow: /privacy');
    expect(robotsTxt).toContain('Disallow: /audit');
    expect(robotsTxt).toContain('Disallow: /design');
    expect(robotsTxt).toContain('Sitemap: https://moneytracker.app/sitemap.xml');
  });

  it('declares valid sitemap.xml with canonical public routes and priorities', () => {
    expect(sitemapXml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemapXml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemapXml).toContain('<loc>https://moneytracker.app/</loc>');
    expect(sitemapXml).toContain('<loc>https://moneytracker.app/landing</loc>');
    expect(sitemapXml).toContain('<loc>https://moneytracker.app/terms</loc>');
    expect(sitemapXml).toContain('<loc>https://moneytracker.app/privacy</loc>');
  });
});
