import {
  DEFAULT_MERCHANT_RULES,
  DEFAULT_BANK_TEMPLATES,
  type MerchantRule,
  type BankTemplate,
} from '@moneytracker/shared';

export * from '@moneytracker/shared';

const STORAGE_KEY_TEMPLATES = 'moneytracker_bank_templates_v1';
const STORAGE_KEY_RULES = 'moneytracker_merchant_rules_v1';

export function loadSavedBankTemplates(): BankTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_BANK_TEMPLATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    if (!raw) return DEFAULT_BANK_TEMPLATES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_BANK_TEMPLATES;
    // Merge system defaults with saved custom templates
    const custom = parsed.filter((t: BankTemplate) => !t.isSystem);
    return [...DEFAULT_BANK_TEMPLATES, ...custom];
  } catch {
    return DEFAULT_BANK_TEMPLATES;
  }
}

export function saveBankTemplate(template: BankTemplate): BankTemplate[] {
  const current = loadSavedBankTemplates();
  const filtered = current.filter((t) => t.id !== template.id);
  const updated = [...filtered, template];
  try {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated.filter((t) => !t.isSystem)));
  } catch {
    // ignore storage quota error
  }
  return updated;
}

export function loadLearnedMerchantRules(): MerchantRule[] {
  if (typeof window === 'undefined') return DEFAULT_MERCHANT_RULES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RULES);
    if (!raw) return DEFAULT_MERCHANT_RULES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_MERCHANT_RULES;
    const custom = parsed.filter((r: MerchantRule) => !r.isSystem);
    return [...custom, ...DEFAULT_MERCHANT_RULES];
  } catch {
    return DEFAULT_MERCHANT_RULES;
  }
}

export function saveLearnedMerchantRule(rule: MerchantRule): MerchantRule[] {
  const current = loadLearnedMerchantRules();
  // Filter out any existing rule with same pattern to update it
  const customOnly = current.filter((r) => !r.isSystem && r.pattern.toUpperCase() !== rule.pattern.toUpperCase());
  const updatedCustom = [rule, ...customOnly];
  try {
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(updatedCustom));
  } catch {
    // ignore storage quota error
  }
  return [...updatedCustom, ...DEFAULT_MERCHANT_RULES];
}
