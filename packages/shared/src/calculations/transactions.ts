import { rupeesToPaise, paiseToRupees } from '../currency/paise.js';
import { computeSha256Hex } from '../crypto/sha256.js';

export type TransactionSortOption =
  | 'date-desc'
  | 'date-asc'
  | 'month-desc'
  | 'month-asc'
  | 'amount-desc'
  | 'amount-asc'
  | 'category-asc';

export function computeImportHash(row: {
  date: string;
  type: string;
  category: string;
  amountPaise: number;
  paymentMethod: string;
  description?: string;
}): string {
  const norm = `${row.date}|${row.type}|${row.category.trim().toLowerCase()}|${row.amountPaise}|${row.paymentMethod.trim().toLowerCase()}|${(row.description || '').trim()}`;
  return computeSha256Hex(norm);
}

export function parseCsvRecords(content: string): string[][] {
  // Strip UTF-8 BOM if present (CORE-12, QA-2)
  const cleanContent = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;

  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanContent.length; i += 1) {
    const char = cleanContent[i];
    const nextChar = cleanContent[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRecord.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }
      currentRecord.push(currentField.trim());
      currentField = '';
      if (currentRecord.length > 1 || (currentRecord.length === 1 && currentRecord[0] !== '')) {
        records.push(currentRecord);
      }
      currentRecord = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRecord.length > 0) {
    currentRecord.push(currentField.trim());
    if (currentRecord.length > 1 || (currentRecord.length === 1 && currentRecord[0] !== '')) {
      records.push(currentRecord);
    }
  }

  return records;
}

export function parseCsvLine(line: string): string[] {
  const records = parseCsvRecords(line);
  return records[0] || [];
}

export function toCsvSafeValue(value: unknown): string {
  let text = value == null ? '' : String(value);
  // Neutralize formula injection / DDE (OWASP CWE-1236):
  if (/^[\t\r]/.test(text) || /^\s*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportTransactionsCsv(
  transactions: any[],
  format: 'csv-detailed' | 'csv-basic',
): string {
  if (format === 'csv-basic') {
    const header = [
      'Date',
      'Type',
      'Category',
      'Description',
      'Payment Method',
      'Amount',
    ];
    const lines = [header.join(',')];

    transactions.forEach((t) => {
      const dateStr = t.date || (t.txnDate instanceof Date ? t.txnDate.toISOString().slice(0, 10) : typeof t.txnDate === 'string' ? t.txnDate.slice(0, 10) : '');
      const amountVal = t.amount ?? (t.amountPaise != null ? Number(t.amountPaise) / 100 : 0);
      lines.push(
        [
          dateStr,
          t.type,
          toCsvSafeValue(t.category),
          toCsvSafeValue(t.description || ''),
          t.paymentMethod || 'cash',
          amountVal,
        ].join(','),
      );
    });

    return `${lines.join('\n')}\n`;
  }

  // Detailed format
  const header = [
    'ID',
    'Date',
    'Type',
    'Category',
    'Amount',
    'Payment Method',
    'Description',
    'Source',
    'Autopay ID',
    'Is Anomaly',
  ];
  const lines = [header.join(',')];

  transactions.forEach((t) => {
    const dateStr = t.date || (t.txnDate instanceof Date ? t.txnDate.toISOString().slice(0, 10) : typeof t.txnDate === 'string' ? t.txnDate.slice(0, 10) : '');
    const amountVal = t.amount ?? (t.amountPaise != null ? Number(t.amountPaise) / 100 : 0);
    lines.push(
      [
        t.id,
        dateStr,
        t.type,
        toCsvSafeValue(t.category),
        amountVal,
        t.paymentMethod || 'cash',
        toCsvSafeValue(t.description || ''),
        t.source || 'manual',
        t.autopayId || '',
        t.isAnomaly || t.anomaly === 'flagged' ? 'yes' : 'no',
      ].join(','),
    );
  });

  return `${lines.join('\n')}\n`;
}

export function exportTransactionsJson(data: {
  transactions: any[];
  autopays: any[];
  budgetGoal: any;
}): string {
  const totalIncomePaise = data.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amountPaise != null ? Number(t.amountPaise) : rupeesToPaise(t.amount ?? 0)), 0);

  const totalExpensePaise = data.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amountPaise != null ? Number(t.amountPaise) : rupeesToPaise(t.amount ?? 0)), 0);

  const totalIncome = paiseToRupees(totalIncomePaise);
  const totalExpense = paiseToRupees(totalExpensePaise);
  const balance = paiseToRupees(totalIncomePaise - totalExpensePaise);

  const sha256Checksum = computeSha256Hex(JSON.stringify(data.transactions));

  const payload = {
    schemaVersion: '1.0',
    sha256Checksum,
    exportedAt: new Date().toISOString(),
    summary: {
      transactionCount: data.transactions.length,
      recurringCount: data.autopays.length,
      totalIncome,
      totalExpense,
      balance,
    },
    budgetGoal: data.budgetGoal,
    recurringPlans: data.autopays,
    transactions: data.transactions,
  };

  return JSON.stringify(payload, null, 2);
}

export function importTransactionsFromCsv(
  content: string,
  existingTransactions: any[],
): {
  newTransactions: any[];
  skippedCount: number;
  error?: string;
} {
  const records = parseCsvRecords(content);

  if (records.length < 2) {
    return {
      newTransactions: [],
      skippedCount: 0,
      error: 'CSV file is empty or missing data rows.',
    };
  }

  const headers = records[0].map((h) =>
    h.toLowerCase().replace(/\s+/g, ' ').trim(),
  );

  const getIndex = (names: string[]) =>
    names.map((name) => headers.indexOf(name)).find((idx) => idx >= 0) ?? -1;

  const indexMap = {
    date: getIndex(['date']),
    type: getIndex(['type']),
    category: getIndex(['category']),
    description: getIndex(['description']),
    paymentMethod: getIndex([
      'payment method',
      'paymentmethod',
      'payment_method',
    ]),
    amount: getIndex(['amount', 'value']),
  };

  if (indexMap.amount < 0 || indexMap.date < 0) {
    return {
      newTransactions: [],
      skippedCount: 0,
      error: 'CSV must include at least Date and Amount columns.',
    };
  }

  const existingSignatures = new Set(
    existingTransactions.map(
      (t) =>
        `${t.date}|${t.type}|${Number(t.amount ?? (t.amountPaise ? t.amountPaise / 100 : 0)).toFixed(2)}|${t.category}|${(t.description || '').trim()}`,
    ),
  );

  const imported: any[] = [];
  let skipped = 0;

  for (let i = 1; i < records.length; i += 1) {
    const cols = records[i];
    const dateRaw = cols[indexMap.date] || '';
    const parsedDate = new Date(dateRaw);
    const date = !isNaN(parsedDate.getTime())
      ? parsedDate.toISOString().split('T')[0]
      : '';

    const amountNum = Math.abs(parseFloat(cols[indexMap.amount] || '0'));
    if (!date || isNaN(amountNum) || amountNum <= 0) {
      skipped += 1;
      continue;
    }

    const typeRaw = (cols[indexMap.type] || '').toLowerCase().trim();
    const type = typeRaw === 'income' ? 'income' : 'expense';
    const category = (cols[indexMap.category] || '').trim() || (type === 'income' ? 'Other Income' : 'Other Expenses');
    const description = (cols[indexMap.description] || '').trim();
    const paymentMethod = (cols[indexMap.paymentMethod] || 'cash').trim().toLowerCase();

    const signature = `${date}|${type}|${amountNum.toFixed(2)}|${category}|${description}`;
    if (existingSignatures.has(signature)) {
      skipped += 1;
      continue;
    }

    existingSignatures.add(signature);
    imported.push({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      amount: amountNum,
      type,
      category,
      paymentMethod,
      description,
      date,
      createdAt: new Date().toISOString(),
      source: 'csv_import',
    });
  }

  return {
    newTransactions: imported,
    skippedCount: skipped,
  };
}

export interface JsonBackupImportResult {
  newTransactions: any[];
  skippedCount: number;
  recurringPlans?: any[];
  budgetGoal?: any;
  summary?: {
    transactionCount: number;
    recurringCount: number;
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
  error?: string;
}

export function importBackupFromJson(
  jsonContent: string,
  existingTransactions: any[] = [],
): JsonBackupImportResult {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonContent);
  } catch (_err: unknown) {
    return {
      newTransactions: [],
      skippedCount: 0,
      error: 'Invalid JSON format. Please upload a valid JSON backup file.',
    };
  }

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.transactions)) {
    return {
      newTransactions: [],
      skippedCount: 0,
      error: 'Backup JSON is missing a valid transactions list.',
    };
  }

  // Integrity Check: Validate SHA-256 checksum if provided to detect file corruption or tampering (X-4)
  if (parsed.sha256Checksum) {
    const computedChecksum = computeSha256Hex(JSON.stringify(parsed.transactions));
    if (computedChecksum !== parsed.sha256Checksum) {
      return {
        newTransactions: [],
        skippedCount: 0,
        error: 'Checksum verification failed: Backup file appears to be corrupted or tampered with.',
      };
    }
  }

  const existingSignatures = new Set(
    existingTransactions.map(
      (t) =>
        t.id ||
        `${t.date}|${t.type}|${Number(t.amount ?? (t.amountPaise ? t.amountPaise / 100 : 0)).toFixed(2)}|${t.category}|${(t.description || '').trim()}`,
    ),
  );

  const imported: any[] = [];
  let skipped = 0;

  for (const raw of parsed.transactions) {
    if (!raw || typeof raw !== 'object') {
      skipped += 1;
      continue;
    }

    const date = typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw.date)
      ? raw.date.slice(0, 10)
      : '';
    const amountNum = Math.abs(parseFloat(String(raw.amount ?? (raw.amountPaise ? raw.amountPaise / 100 : 0))));

    if (!date || isNaN(amountNum) || amountNum <= 0) {
      skipped += 1;
      continue;
    }

    const type = raw.type === 'income' ? 'income' : 'expense';
    const category = (raw.category || '').trim() || (type === 'income' ? 'Other Income' : 'Other Expenses');
    const description = (raw.description || '').trim();
    const paymentMethod = (raw.paymentMethod || 'cash').trim().toLowerCase();
    const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const sigById = id;
    const sigByContent = `${date}|${type}|${amountNum.toFixed(2)}|${category}|${description}`;

    if (existingSignatures.has(sigById) || existingSignatures.has(sigByContent)) {
      skipped += 1;
      continue;
    }

    existingSignatures.add(sigById);
    existingSignatures.add(sigByContent);

    imported.push({
      id,
      amount: amountNum,
      type,
      category,
      paymentMethod,
      description,
      date,
      createdAt: raw.createdAt || new Date().toISOString(),
      source: raw.source || 'json_backup',
      autopayId: raw.autopayId,
      isAnomaly: Boolean(raw.isAnomaly),
    });
  }

  return {
    newTransactions: imported,
    skippedCount: skipped,
    recurringPlans: Array.isArray(parsed.recurringPlans) ? parsed.recurringPlans : undefined,
    budgetGoal: parsed.budgetGoal && typeof parsed.budgetGoal === 'object' ? parsed.budgetGoal : undefined,
    summary: parsed.summary,
  };
}

export function filterTransactions<
  T extends {
    id?: string;
    date: string;
    type: string;
    category: string;
    amount?: number;
    amountPaise?: number | bigint;
    description?: string;
    createdAt?: string;
  },
>(
  transactions: T[],
  query: string,
  typeFilter: string,
  monthFilter: string,
  sortOption: TransactionSortOption,
): T[] {
  let result = [...transactions];

  if (query.trim() !== '') {
    const q = query.toLowerCase().trim();
    result = result.filter(
      (t) =>
        t.category.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)),
    );
  }

  if (typeFilter && typeFilter !== 'all') {
    result = result.filter((t) => t.type === typeFilter);
  }

  if (monthFilter && monthFilter !== 'all') {
    result = result.filter((t) => t.date.startsWith(monthFilter));
  }

  result.sort((a, b) => {
    const idA = a.id || '';
    const idB = b.id || '';
    const amountA = Number(a.amountPaise ?? Math.round((a.amount ?? 0) * 100));
    const amountB = Number(b.amountPaise ?? Math.round((b.amount ?? 0) * 100));

    switch (sortOption) {
      case 'date-desc':
        return (
          b.date.localeCompare(a.date) ||
          (b.createdAt || '').localeCompare(a.createdAt || '') ||
          idB.localeCompare(idA)
        );
      case 'date-asc':
        return (
          a.date.localeCompare(b.date) ||
          (a.createdAt || '').localeCompare(b.createdAt || '') ||
          idA.localeCompare(idB)
        );
      case 'month-desc': {
        const ma = a.date.slice(0, 7);
        const mb = b.date.slice(0, 7);
        return (
          mb.localeCompare(ma) ||
          b.date.localeCompare(a.date) ||
          (b.createdAt || '').localeCompare(a.createdAt || '') ||
          idB.localeCompare(idA)
        );
      }
      case 'month-asc': {
        const ma = a.date.slice(0, 7);
        const mb = b.date.slice(0, 7);
        return (
          ma.localeCompare(mb) ||
          a.date.localeCompare(b.date) ||
          (a.createdAt || '').localeCompare(b.createdAt || '') ||
          idA.localeCompare(idB)
        );
      }
      case 'amount-desc':
        return (
          amountB - amountA ||
          b.date.localeCompare(a.date) ||
          idB.localeCompare(idA)
        );
      case 'amount-asc':
        return (
          amountA - amountB ||
          a.date.localeCompare(b.date) ||
          idA.localeCompare(idB)
        );
      case 'category-asc':
        return (
          a.category.localeCompare(b.category) ||
          b.date.localeCompare(a.date) ||
          idA.localeCompare(idB)
        );
      default:
        return (
          b.date.localeCompare(a.date) ||
          (b.createdAt || '').localeCompare(a.createdAt || '') ||
          idB.localeCompare(idA)
        );
    }
  });

  return result;
}

export function paginateTransactions<T>(
  transactions: T[],
  page: number,
  pageSize: number = 20,
): {
  paginatedItems: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
} {
  const totalItems = transactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const start = (currentPage - 1) * pageSize;
  const paginatedItems = transactions.slice(start, start + pageSize);

  return {
    paginatedItems,
    totalPages,
    currentPage,
    totalItems,
  };
}

export function extractUniqueMonths(
  transactions: Array<{ date: string }>,
): { value: string; label: string }[] {
  const monthsSet = new Set<string>();

  transactions.forEach((t) => {
    if (t.date && t.date.length >= 7) {
      monthsSet.add(t.date.slice(0, 7));
    }
  });

  const sortedMonths = Array.from(monthsSet).sort().reverse();
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return sortedMonths.map((ym) => {
    const [year, monthStr] = ym.split('-');
    const monthIdx = parseInt(monthStr, 10) - 1;
    const label = `${monthNames[monthIdx] || monthStr} ${year}`;
    return { value: ym, label };
  });
}
