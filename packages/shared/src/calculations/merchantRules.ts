import { rupeesToPaise, paiseToRupees } from '../currency/paise.js';
import { parseCsvRecords } from './transactions.js';

export interface MerchantRule {
  id: string;
  pattern: string;
  category: string;
  type?: 'expense' | 'income';
  isSystem?: boolean;
}

export const DEFAULT_MERCHANT_RULES: MerchantRule[] = [
  // Food & Dining
  { id: 'sys_food_1', pattern: 'SWIGGY', category: 'Food & Dining', type: 'expense', isSystem: true },
  { id: 'sys_food_2', pattern: 'ZOMATO', category: 'Food & Dining', type: 'expense', isSystem: true },
  { id: 'sys_food_3', pattern: 'BLINKIT', category: 'Food & Dining', type: 'expense', isSystem: true },
  { id: 'sys_food_4', pattern: 'ZEPTO', category: 'Food & Dining', type: 'expense', isSystem: true },
  { id: 'sys_food_5', pattern: 'INSTAMART', category: 'Food & Dining', type: 'expense', isSystem: true },
  { id: 'sys_food_6', pattern: 'STARBUCKS', category: 'Food & Dining', type: 'expense', isSystem: true },
  { id: 'sys_food_7', pattern: 'MCDONALD', category: 'Food & Dining', type: 'expense', isSystem: true },
  { id: 'sys_food_8', pattern: 'DOMINO', category: 'Food & Dining', type: 'expense', isSystem: true },
  { id: 'sys_food_9', pattern: 'KFC', category: 'Food & Dining', type: 'expense', isSystem: true },
  { id: 'sys_food_10', pattern: 'PIZZA HUT', category: 'Food & Dining', type: 'expense', isSystem: true },
  { id: 'sys_food_11', pattern: 'BURGER KING', category: 'Food & Dining', type: 'expense', isSystem: true },
  { id: 'sys_food_12', pattern: 'CHAAYOS', category: 'Food & Dining', type: 'expense', isSystem: true },
  { id: 'sys_food_13', pattern: 'CHAI POINT', category: 'Food & Dining', type: 'expense', isSystem: true },
  { id: 'sys_food_14', pattern: 'HALDIRAM', category: 'Food & Dining', type: 'expense', isSystem: true },
  { id: 'sys_food_15', pattern: 'SUBWAY', category: 'Food & Dining', type: 'expense', isSystem: true },
  { id: 'sys_food_16', pattern: 'EATSURE', category: 'Food & Dining', type: 'expense', isSystem: true },

  // Transportation
  { id: 'sys_trans_1', pattern: 'UBER', category: 'Transportation', type: 'expense', isSystem: true },
  { id: 'sys_trans_2', pattern: 'OLA', category: 'Transportation', type: 'expense', isSystem: true },
  { id: 'sys_trans_3', pattern: 'RAPIDO', category: 'Transportation', type: 'expense', isSystem: true },
  { id: 'sys_trans_4', pattern: 'IRCTC', category: 'Transportation', type: 'expense', isSystem: true },
  { id: 'sys_trans_5', pattern: 'METRO', category: 'Transportation', type: 'expense', isSystem: true },
  { id: 'sys_trans_6', pattern: 'INDIGO', category: 'Transportation', type: 'expense', isSystem: true },
  { id: 'sys_trans_7', pattern: 'AIR INDIA', category: 'Transportation', type: 'expense', isSystem: true },
  { id: 'sys_trans_8', pattern: 'FASTAG', category: 'Transportation', type: 'expense', isSystem: true },
  { id: 'sys_trans_9', pattern: 'HPCL', category: 'Transportation', type: 'expense', isSystem: true },
  { id: 'sys_trans_10', pattern: 'BPCL', category: 'Transportation', type: 'expense', isSystem: true },
  { id: 'sys_trans_11', pattern: 'IOCL', category: 'Transportation', type: 'expense', isSystem: true },
  { id: 'sys_trans_12', pattern: 'SHELL', category: 'Transportation', type: 'expense', isSystem: true },
  { id: 'sys_trans_13', pattern: 'PETROL', category: 'Transportation', type: 'expense', isSystem: true },

  // Subscriptions & Entertainment
  { id: 'sys_sub_1', pattern: 'NETFLIX', category: 'Subscriptions', type: 'expense', isSystem: true },
  { id: 'sys_sub_2', pattern: 'SPOTIFY', category: 'Subscriptions', type: 'expense', isSystem: true },
  { id: 'sys_sub_3', pattern: 'AMAZON PRIME', category: 'Subscriptions', type: 'expense', isSystem: true },
  { id: 'sys_sub_4', pattern: 'HOTSTAR', category: 'Subscriptions', type: 'expense', isSystem: true },
  { id: 'sys_sub_5', pattern: 'DISNEY', category: 'Subscriptions', type: 'expense', isSystem: true },
  { id: 'sys_sub_6', pattern: 'YOUTUBE', category: 'Subscriptions', type: 'expense', isSystem: true },
  { id: 'sys_sub_7', pattern: 'APPLE.COM', category: 'Subscriptions', type: 'expense', isSystem: true },
  { id: 'sys_sub_8', pattern: 'GOOGLE PLAY', category: 'Subscriptions', type: 'expense', isSystem: true },
  { id: 'sys_sub_9', pattern: 'BOOKMYSHOW', category: 'Subscriptions', type: 'expense', isSystem: true },
  { id: 'sys_sub_10', pattern: 'SONYLIV', category: 'Subscriptions', type: 'expense', isSystem: true },
  { id: 'sys_sub_11', pattern: 'ZEE5', category: 'Subscriptions', type: 'expense', isSystem: true },

  // Shopping
  { id: 'sys_shop_1', pattern: 'AMAZON', category: 'Shopping', type: 'expense', isSystem: true },
  { id: 'sys_shop_2', pattern: 'FLIPKART', category: 'Shopping', type: 'expense', isSystem: true },
  { id: 'sys_shop_3', pattern: 'MYNTRA', category: 'Shopping', type: 'expense', isSystem: true },
  { id: 'sys_shop_4', pattern: 'AJIO', category: 'Shopping', type: 'expense', isSystem: true },
  { id: 'sys_shop_5', pattern: 'NYKAA', category: 'Shopping', type: 'expense', isSystem: true },
  { id: 'sys_shop_6', pattern: 'TATA CLIQ', category: 'Shopping', type: 'expense', isSystem: true },
  { id: 'sys_shop_7', pattern: 'DECATHLON', category: 'Shopping', type: 'expense', isSystem: true },
  { id: 'sys_shop_8', pattern: 'MEESHO', category: 'Shopping', type: 'expense', isSystem: true },
  { id: 'sys_shop_9', pattern: 'IKEA', category: 'Shopping', type: 'expense', isSystem: true },
  { id: 'sys_shop_10', pattern: 'ZARA', category: 'Shopping', type: 'expense', isSystem: true },
  { id: 'sys_shop_11', pattern: 'H&M', category: 'Shopping', type: 'expense', isSystem: true },
  { id: 'sys_shop_12', pattern: 'DMART', category: 'Shopping', type: 'expense', isSystem: true },

  // Utilities & Bills
  { id: 'sys_util_1', pattern: 'ELECTRICITY', category: 'Utilities', type: 'expense', isSystem: true },
  { id: 'sys_util_2', pattern: 'BESCOM', category: 'Utilities', type: 'expense', isSystem: true },
  { id: 'sys_util_3', pattern: 'TNEB', category: 'Utilities', type: 'expense', isSystem: true },
  { id: 'sys_util_4', pattern: 'MAHADISCOM', category: 'Utilities', type: 'expense', isSystem: true },
  { id: 'sys_util_5', pattern: 'AIRTEL', category: 'Utilities', type: 'expense', isSystem: true },
  { id: 'sys_util_6', pattern: 'JIO', category: 'Utilities', type: 'expense', isSystem: true },
  { id: 'sys_util_7', pattern: 'ACT FIBERNET', category: 'Utilities', type: 'expense', isSystem: true },
  { id: 'sys_util_8', pattern: 'TATA PLAY', category: 'Utilities', type: 'expense', isSystem: true },
  { id: 'sys_util_9', pattern: 'GAS', category: 'Utilities', type: 'expense', isSystem: true },
  { id: 'sys_util_10', pattern: 'INDANE', category: 'Utilities', type: 'expense', isSystem: true },
  { id: 'sys_util_11', pattern: 'WATER', category: 'Utilities', type: 'expense', isSystem: true },

  // Healthcare
  { id: 'sys_health_1', pattern: 'APOLLO', category: 'Healthcare', type: 'expense', isSystem: true },
  { id: 'sys_health_2', pattern: 'PHARMEASY', category: 'Healthcare', type: 'expense', isSystem: true },
  { id: 'sys_health_3', pattern: '1MG', category: 'Healthcare', type: 'expense', isSystem: true },
  { id: 'sys_health_4', pattern: 'NETMEDS', category: 'Healthcare', type: 'expense', isSystem: true },
  { id: 'sys_health_5', pattern: 'MEDPLUS', category: 'Healthcare', type: 'expense', isSystem: true },
  { id: 'sys_health_6', pattern: 'HOSPITAL', category: 'Healthcare', type: 'expense', isSystem: true },
  { id: 'sys_health_7', pattern: 'CLINIC', category: 'Healthcare', type: 'expense', isSystem: true },

  // Salary & Income
  { id: 'sys_sal_1', pattern: 'SALARY', category: 'Salary', type: 'income', isSystem: true },
  { id: 'sys_sal_2', pattern: 'PAYROLL', category: 'Salary', type: 'income', isSystem: true },
  { id: 'sys_sal_3', pattern: 'STIPEND', category: 'Salary', type: 'income', isSystem: true },
  { id: 'sys_sal_4', pattern: 'DIVIDEND', category: 'Investments', type: 'income', isSystem: true },
  { id: 'sys_sal_5', pattern: 'INTEREST CREDIT', category: 'Investments', type: 'income', isSystem: true },
  { id: 'sys_sal_6', pattern: 'REFUND', category: 'Other Income', type: 'income', isSystem: true },

  // Investments
  { id: 'sys_inv_1', pattern: 'ZERODHA', category: 'Investments', type: 'expense', isSystem: true },
  { id: 'sys_inv_2', pattern: 'GROWW', category: 'Investments', type: 'expense', isSystem: true },
  { id: 'sys_inv_3', pattern: 'UPSTOX', category: 'Investments', type: 'expense', isSystem: true },
  { id: 'sys_inv_4', pattern: 'MUTUAL FUND', category: 'Investments', type: 'expense', isSystem: true },
  { id: 'sys_inv_5', pattern: 'CAMS', category: 'Investments', type: 'expense', isSystem: true },
];

/**
 * Matches a transaction description against custom user-learned rules,
 * falling back to system presets.
 */
export function matchMerchantRule(
  description: string,
  customRules: MerchantRule[] = [],
): MerchantRule | null {
  if (!description) return null;
  const upperDesc = description.toUpperCase();

  // 1. Check user-defined / learned rules first (user preference takes priority)
  for (const rule of customRules) {
    if (upperDesc.includes(rule.pattern.toUpperCase())) {
      return rule;
    }
  }

  // 2. Fall back to system presets
  for (const rule of DEFAULT_MERCHANT_RULES) {
    if (upperDesc.includes(rule.pattern.toUpperCase())) {
      return rule;
    }
  }

  return null;
}

/**
 * Normalizes varied bank statement date representations to standard YYYY-MM-DD.
 * Handles DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, MM/DD/YYYY, etc.
 */
export function parseBankDate(dateStr: string, preferredFormat?: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();

  // ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? '' : trimmed;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10);
    let year = parseInt(dmyMatch[3], 10);

    if (year < 100) {
      year += 2000;
    }

    // Handle MM/DD/YYYY if preferred
    if (preferredFormat === 'MM/DD/YYYY' && month <= 12 && day <= 31) {
      const temp = day;
      day = month;
      month = temp;
    } else if (month > 12 && day <= 12) {
      // Automatic swap if month exceeds 12
      const temp = day;
      day = month;
      month = temp;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const mm = String(month).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    }
  }

  // Fallback to standard JS Date
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

export interface BankColumnMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn?: string;
  debitColumn?: string;
  creditColumn?: string;
  typeColumn?: string;
  categoryColumn?: string;
  paymentMethodColumn?: string;
  dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'DD-MM-YYYY' | 'MM/DD/YYYY' | 'AUTO';
}

export interface BankTemplate {
  id: string;
  name: string;
  mapping: BankColumnMapping;
  isSystem?: boolean;
}

export const DEFAULT_BANK_TEMPLATES: BankTemplate[] = [
  {
    id: 'tmpl_hdfc',
    name: 'HDFC Bank',
    mapping: {
      dateColumn: 'Date',
      descriptionColumn: 'Narration',
      debitColumn: 'Withdrawal Amt.',
      creditColumn: 'Deposit Amt.',
      dateFormat: 'DD/MM/YYYY',
    },
    isSystem: true,
  },
  {
    id: 'tmpl_sbi',
    name: 'State Bank of India (SBI)',
    mapping: {
      dateColumn: 'Txn Date',
      descriptionColumn: 'Description',
      debitColumn: 'Debit',
      creditColumn: 'Credit',
      dateFormat: 'DD/MM/YYYY',
    },
    isSystem: true,
  },
  {
    id: 'tmpl_icici',
    name: 'ICICI Bank',
    mapping: {
      dateColumn: 'Transaction Date',
      descriptionColumn: 'Transaction Remarks',
      debitColumn: 'Withdrawal Amount (INR )',
      creditColumn: 'Deposit Amount (INR )',
      dateFormat: 'DD/MM/YYYY',
    },
    isSystem: true,
  },
  {
    id: 'tmpl_generic',
    name: 'Standard CSV',
    mapping: {
      dateColumn: 'Date',
      descriptionColumn: 'Description',
      amountColumn: 'Amount',
      typeColumn: 'Type',
      categoryColumn: 'Category',
      dateFormat: 'AUTO',
    },
    isSystem: true,
  },
];

/**
 * Automatically detects the best matching bank template based on CSV headers.
 */
export function detectBankTemplate(
  headers: string[],
  templates: BankTemplate[] = DEFAULT_BANK_TEMPLATES,
): BankTemplate | null {
  if (!headers || headers.length === 0) return null;
  const cleanHeaders = headers.map((h) => h.toLowerCase().trim());

  // 1. Check specific bank templates (HDFC, SBI, ICICI)
  for (const template of templates) {
    if (template.id === 'tmpl_generic') continue;

    const m = template.mapping;
    const hasDate = cleanHeaders.includes(m.dateColumn.toLowerCase().trim());
    const hasDesc = cleanHeaders.includes(m.descriptionColumn.toLowerCase().trim());
    const hasDebit = m.debitColumn ? cleanHeaders.includes(m.debitColumn.toLowerCase().trim()) : true;
    const hasCredit = m.creditColumn ? cleanHeaders.includes(m.creditColumn.toLowerCase().trim()) : true;

    if (hasDate && hasDesc && hasDebit && hasCredit) {
      return template;
    }
  }

  // 2. Check Standard CSV template
  const generic = templates.find((t) => t.id === 'tmpl_generic');
  if (generic) {
    const gm = generic.mapping;
    const hasDate = cleanHeaders.includes(gm.dateColumn.toLowerCase().trim());
    const hasDesc = cleanHeaders.includes(gm.descriptionColumn.toLowerCase().trim());
    const hasAmount = gm.amountColumn ? cleanHeaders.includes(gm.amountColumn.toLowerCase().trim()) : false;
    if (hasDate && hasDesc && hasAmount) {
      return generic;
    }
  }

  // 3. Smart fuzzy detection for custom / non-standard statements
  const rawDateCol = headers.find((h) => /date|txn/i.test(h));
  const rawDescCol = headers.find((h) => /desc|narration|particular|detail|remark/i.test(h));
  const rawDebitCol = headers.find((h) => /debit|withdrawal|dr/i.test(h));
  const rawCreditCol = headers.find((h) => /credit|deposit|cr/i.test(h));
  const rawAmountCol = headers.find((h) => /amount|amt/i.test(h) && !/debit|credit|withdrawal|deposit/i.test(h));

  if (rawDateCol && (rawDescCol || rawAmountCol || (rawDebitCol && rawCreditCol))) {
    return {
      id: 'tmpl_inferred',
      name: 'Custom Statement Format',
      mapping: {
        dateColumn: rawDateCol,
        descriptionColumn: rawDescCol || headers[0] || 'Description',
        debitColumn: rawDebitCol,
        creditColumn: rawCreditCol,
        amountColumn: !rawDebitCol && !rawCreditCol ? (rawAmountCol || 'Amount') : undefined,
        dateFormat: 'AUTO',
      },
    };
  }

  // 4. Fallback to standard generic if any header contains date
  if (generic && cleanHeaders.some((h) => h.includes('date'))) {
    return generic;
  }

  return null;
}

export interface BankImportRowPreview {
  rowIndex: number;
  raw: Record<string, string>;
  parsed: {
    date: string;
    amount: number;
    amountPaise: number;
    type: 'expense' | 'income';
    category: string;
    description: string;
    paymentMethod: string;
  };
  isDuplicate: boolean;
  duplicateReason?: string;
  isUncategorized: boolean;
  matchedRule?: MerchantRule;
  selected: boolean;
}

export interface BankImportPreviewResult {
  headers: string[];
  rows: BankImportRowPreview[];
  totalRows: number;
  duplicateCount: number;
  uncategorizedCount: number;
  readyToImportCount: number;
  totalIncome: number;
  totalExpense: number;
  detectedTemplateId?: string;
  error?: string;
}

/**
 * Generates an interactive preview of parsed bank statement transactions with
 * column mapping, duplicate detection, and merchant category rule matching.
 */
export function generateBankImportPreview(params: {
  csvContent: string;
  mapping: BankColumnMapping;
  existingTransactions: Array<{
    date: string;
    amount?: number;
    amountPaise?: number | bigint;
    type: string;
    category: string;
    description?: string;
  }>;
  customRules?: MerchantRule[];
}): BankImportPreviewResult {
  const records = parseCsvRecords(params.csvContent);
  if (records.length < 2) {
    return {
      headers: [],
      rows: [],
      totalRows: 0,
      duplicateCount: 0,
      uncategorizedCount: 0,
      readyToImportCount: 0,
      totalIncome: 0,
      totalExpense: 0,
      error: 'CSV statement is empty or missing data rows.',
    };
  }

  const rawHeaders = records[0];
  const cleanHeaders = rawHeaders.map((h) => h.trim());
  const headerIndexMap = new Map<string, number>();
  cleanHeaders.forEach((h, idx) => {
    headerIndexMap.set(h.toLowerCase(), idx);
  });

  const getColIdx = (colName?: string) => {
    if (!colName) return -1;
    return headerIndexMap.get(colName.toLowerCase()) ?? -1;
  };

  const m = params.mapping;
  const dateIdx = getColIdx(m.dateColumn);
  const descIdx = getColIdx(m.descriptionColumn);
  const amountIdx = getColIdx(m.amountColumn);
  const debitIdx = getColIdx(m.debitColumn);
  const creditIdx = getColIdx(m.creditColumn);
  const typeIdx = getColIdx(m.typeColumn);
  const catIdx = getColIdx(m.categoryColumn);
  const methodIdx = getColIdx(m.paymentMethodColumn);

  // Set of existing transaction signatures for duplicate detection
  const existingSignatures = new Set(
    params.existingTransactions.map((t) => {
      const amtPaise = Number(t.amountPaise ?? rupeesToPaise(t.amount || 0));
      return `${t.date}|${t.type}|${amtPaise}|${(t.description || '').trim().toLowerCase()}`;
    }),
  );

  const existingDateAmountSignatures = new Set(
    params.existingTransactions.map((t) => {
      const amtPaise = Number(t.amountPaise ?? rupeesToPaise(t.amount || 0));
      return `${t.date}|${t.type}|${amtPaise}`;
    }),
  );

  const seenInBatchSignatures = new Set<string>();

  const rows: BankImportRowPreview[] = [];
  let duplicateCount = 0;
  let uncategorizedCount = 0;
  let readyToImportCount = 0;
  let totalIncomePaise = 0;
  let totalExpensePaise = 0;

  for (let i = 1; i < records.length; i += 1) {
    const line = records[i];
    // Skip empty lines
    if (line.every((cell) => !cell.trim())) continue;

    const raw: Record<string, string> = {};
    cleanHeaders.forEach((header, idx) => {
      raw[header] = line[idx] || '';
    });

    const dateRaw = dateIdx >= 0 ? line[dateIdx] || '' : '';
    const parsedDate = parseBankDate(dateRaw, m.dateFormat);

    const descRaw = descIdx >= 0 ? line[descIdx] || '' : '';
    const description = descRaw.trim();

    let amount = 0;
    let type: 'expense' | 'income' = 'expense';

    if (debitIdx >= 0 || creditIdx >= 0) {
      const debitRaw = debitIdx >= 0 ? line[debitIdx] || '' : '';
      const creditRaw = creditIdx >= 0 ? line[creditIdx] || '' : '';

      const cleanNum = (str: string) => Math.abs(parseFloat(str.replace(/,/g, '').trim()) || 0);
      const debitVal = cleanNum(debitRaw);
      const creditVal = cleanNum(creditRaw);

      if (creditVal > 0) {
        amount = creditVal;
        type = 'income';
      } else if (debitVal > 0) {
        amount = debitVal;
        type = 'expense';
      } else {
        // Skip zero rows
        continue;
      }
    } else if (amountIdx >= 0) {
      const rawAmtStr = (line[amountIdx] || '').replace(/,/g, '').trim();
      const rawAmt = parseFloat(rawAmtStr);
      if (isNaN(rawAmt) || rawAmt === 0) continue;

      amount = Math.abs(rawAmt);
      if (typeIdx >= 0) {
        const rawType = (line[typeIdx] || '').toLowerCase().trim();
        type = rawType === 'income' || rawType === 'cr' || rawType === 'credit' ? 'income' : 'expense';
      } else {
        // Infer from sign (negative = expense, positive = income) if applicable
        type = rawAmt < 0 ? 'expense' : 'income';
      }
    } else {
      continue;
    }

    const amountPaise = rupeesToPaise(amount);

    // Apply merchant rules or existing category
    let category = '';
    const matchedRule = matchMerchantRule(description, params.customRules);
    if (catIdx >= 0 && line[catIdx]?.trim()) {
      category = line[catIdx].trim();
    } else if (matchedRule) {
      category = matchedRule.category;
      if (matchedRule.type) {
        type = matchedRule.type;
      }
    }

    // Duplicate detection
    const sig = `${parsedDate}|${type}|${amountPaise}|${description.toLowerCase()}`;
    const dateAmountSig = `${parsedDate}|${type}|${amountPaise}`;
    let isDuplicate = false;
    let duplicateReason: string | undefined;

    if (existingSignatures.has(sig)) {
      isDuplicate = true;
      duplicateReason = 'Matches an existing transaction in your history';
      duplicateCount += 1;
    } else if (existingDateAmountSignatures.has(dateAmountSig)) {
      isDuplicate = true;
      duplicateReason = 'Matches an existing transaction with identical date and amount';
      duplicateCount += 1;
    } else if (seenInBatchSignatures.has(sig)) {
      isDuplicate = true;
      duplicateReason = 'Duplicate row within this statement';
      duplicateCount += 1;
    } else {
      seenInBatchSignatures.add(sig);
    }

    const isUncategorized = !category || category.toLowerCase() === 'uncategorized';
    if (isUncategorized) {
      category = type === 'income' ? 'Other Income' : 'Uncategorized';
      if (!isDuplicate) {
        uncategorizedCount += 1;
      }
    }

    const paymentMethod = methodIdx >= 0 && line[methodIdx]?.trim()
      ? line[methodIdx].trim()
      : 'net_banking';

    const selected = !isDuplicate;
    if (selected) {
      readyToImportCount += 1;
      if (type === 'income') totalIncomePaise += amountPaise;
      else totalExpensePaise += amountPaise;
    }

    rows.push({
      rowIndex: i,
      raw,
      parsed: {
        date: parsedDate,
        amount,
        amountPaise,
        type,
        category,
        description,
        paymentMethod,
      },
      isDuplicate,
      duplicateReason,
      isUncategorized,
      matchedRule: matchedRule || undefined,
      selected,
    });
  }

  const detected = detectBankTemplate(cleanHeaders);

  return {
    headers: cleanHeaders,
    rows,
    totalRows: rows.length,
    duplicateCount,
    uncategorizedCount,
    readyToImportCount,
    totalIncome: paiseToRupees(totalIncomePaise),
    totalExpense: paiseToRupees(totalExpensePaise),
    detectedTemplateId: detected?.id,
  };
}
