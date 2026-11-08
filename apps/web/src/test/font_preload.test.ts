import { describe, it, expect } from 'vitest';
import indexHtml from '../../index.html?raw';

describe('Font Preload and FOIT/FOUT Handling (PERF-7)', () => {
  it('preloads Instrument Sans 400 body font with crossorigin attribute', () => {
    expect(indexHtml).toContain('rel="preload" href="/src/assets/fonts/instrument-sans-400.woff2" as="font" type="font/woff2" crossorigin');
  });

  it('preloads Bricolage Grotesque 600 display font with crossorigin attribute to prevent FOIT/FOUT', () => {
    expect(indexHtml).toContain('rel="preload" href="/src/assets/fonts/bricolage-grotesque-600.woff2" as="font" type="font/woff2" crossorigin');
  });
});
