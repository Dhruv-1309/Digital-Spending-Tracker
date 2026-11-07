import type {
  Transaction,
  AutopayPlan,
  BudgetGoal,
  TransactionSortOption,
} from '../types';

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
  transactions: Transaction[],
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
      lines.push(
        [
          t.date,
          t.type,
          toCsvSafeValue(t.category),
          toCsvSafeValue(t.description || ''),
          t.paymentMethod || 'cash',
          t.amount,
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
    lines.push(
      [
        t.id,
        t.date,
        t.type,
        toCsvSafeValue(t.category),
        t.amount,
        t.paymentMethod || 'cash',
        toCsvSafeValue(t.description || ''),
        t.source || 'manual',
        t.autopayId || '',
        t.isAnomaly ? 'yes' : 'no',
      ].join(','),
    );
  });

  return `${lines.join('\n')}\n`;
}

export function exportTransactionsJson(data: {
  transactions: Transaction[];
  autopays: AutopayPlan[];
  budgetGoal: BudgetGoal;
}): string {
  const totalIncome = data.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = data.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const payload = {
    exportedAt: new Date().toISOString(),
    summary: {
      transactionCount: data.transactions.length,
      recurringCount: data.autopays.length,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    },
    budgetGoal: data.budgetGoal,
    recurringPlans: data.autopays,
    transactions: data.transactions,
  };

  return JSON.stringify(payload, null, 2);
}

export function importTransactionsFromCsv(
  content: string,
  existingTransactions: Transaction[],
): {
  newTransactions: Transaction[];
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
        `${t.date}|${t.type}|${Number(t.amount).toFixed(2)}|${t.category}|${(t.description || '').trim()}`,
    ),
  );

  const imported: Transaction[] = [];
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
    const paymentMethod = (cols[indexMap.paymentMethod] || 'other').trim().toLowerCase();

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
  newTransactions: Transaction[];
  skippedCount: number;
  recurringPlans?: AutopayPlan[];
  budgetGoal?: BudgetGoal;
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
  existingTransactions: Transaction[] = [],
): JsonBackupImportResult {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonContent);
  } catch {
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

  const existingSignatures = new Set(
    existingTransactions.map(
      (t) =>
        t.id ||
        `${t.date}|${t.type}|${Number(t.amount).toFixed(2)}|${t.category}|${(t.description || '').trim()}`,
    ),
  );

  const imported: Transaction[] = [];
  let skipped = 0;

  for (const raw of parsed.transactions) {
    if (!raw || typeof raw !== 'object') {
      skipped += 1;
      continue;
    }

    const date = typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw.date)
      ? raw.date.slice(0, 10)
      : '';
    const amountNum = Math.abs(parseFloat(String(raw.amount ?? 0)));

    if (!date || isNaN(amountNum) || amountNum <= 0) {
      skipped += 1;
      continue;
    }

    const type = raw.type === 'income' ? 'income' : 'expense';
    const category = (raw.category || '').trim() || (type === 'income' ? 'Other Income' : 'Other Expenses');
    const description = (raw.description || '').trim();
    const paymentMethod = (raw.paymentMethod || 'other').trim().toLowerCase();
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

export function filterTransactions(
  transactions: Transaction[],
  query: string,
  typeFilter: string,
  monthFilter: string,
  sortOption: TransactionSortOption,
): Transaction[] {
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
    switch (sortOption) {
      case 'date-desc':
        return b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || '');
      case 'date-asc':
        return a.date.localeCompare(b.date) || (a.createdAt || '').localeCompare(b.createdAt || '');
      case 'month-desc': {
        const ma = a.date.slice(0, 7);
        const mb = b.date.slice(0, 7);
        return mb.localeCompare(ma) || b.date.localeCompare(a.date);
      }
      case 'month-asc': {
        const ma = a.date.slice(0, 7);
        const mb = b.date.slice(0, 7);
        return ma.localeCompare(mb) || a.date.localeCompare(b.date);
      }
      default:
        return b.date.localeCompare(a.date);
    }
  });

  return result;
}

export function paginateTransactions(
  transactions: Transaction[],
  page: number,
  pageSize: number = 20,
): {
  paginatedItems: Transaction[];
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
  transactions: Transaction[],
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
