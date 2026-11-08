/**
 * Category Badge Colors & Stable Hash Assignment (SPEC Section 3)
 * Eight muted tint and ink pairs from SPEC:
 * terracotta, olive, teal, rose, sand, sky, moss, slate.
 */

export interface CategoryPalette {
  name: string;
  tint: string;
  ink: string;
  tokenTint: string;
  tokenInk: string;
}

export const CATEGORY_PALETTE: CategoryPalette[] = [
  { name: 'terracotta', tint: '#F3DCD2', ink: '#8A3A1F', tokenTint: 'var(--cat-terracotta-tint)', tokenInk: 'var(--cat-terracotta-ink)' },
  { name: 'olive', tint: '#E8EBCF', ink: '#55601A', tokenTint: 'var(--cat-olive-tint)', tokenInk: 'var(--cat-olive-ink)' },
  { name: 'teal', tint: '#D7ECE9', ink: '#1E5F58', tokenTint: 'var(--cat-teal-tint)', tokenInk: 'var(--cat-teal-ink)' },
  { name: 'rose', tint: '#F5DCE3', ink: '#8A2A47', tokenTint: 'var(--cat-rose-tint)', tokenInk: 'var(--cat-rose-ink)' },
  { name: 'sand', tint: '#EFE3CB', ink: '#7A5A12', tokenTint: 'var(--cat-sand-tint)', tokenInk: 'var(--cat-sand-ink)' },
  { name: 'sky', tint: '#DCE8F5', ink: '#245A8C', tokenTint: 'var(--cat-sky-tint)', tokenInk: 'var(--cat-sky-ink)' },
  { name: 'moss', tint: '#DDEBD9', ink: '#2F6A32', tokenTint: 'var(--cat-moss-tint)', tokenInk: 'var(--cat-moss-ink)' },
  { name: 'slate', tint: '#E3E6EA', ink: '#3C4654', tokenTint: 'var(--cat-slate-tint)', tokenInk: 'var(--cat-slate-ink)' },
];

/**
 * Pure function: deterministic category color assignment by djb2 hash (SPEC Section 3).
 * Always maps the same category name to the same palette among the 8 colors.
 */
export function getCategoryBadgeColor(categoryName: string): CategoryPalette {
  if (!categoryName) return CATEGORY_PALETTE[7]; // slate fallback
  const normalized = categoryName.trim().toLowerCase();

  let hash = 5381;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash << 5) + hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CATEGORY_PALETTE.length;
  return CATEGORY_PALETTE[index];
}
