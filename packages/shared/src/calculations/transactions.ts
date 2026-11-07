import { rupeesToPaise, paiseToRupees } from '../currency/paise.js';

export type TransactionSortOption =
  | 'date-desc'
  | 'date-asc'
  | 'month-desc'
  | 'month-asc';

// Pure standard SHA-256 for universal execution in both Node and Browser
function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const words: number[] = [];
  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const utf8: number[] = [];
  for (let bi = 0; bi < ascii.length; bi++) {
    let charcode = ascii.charCodeAt(bi);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      bi++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (ascii.charCodeAt(bi) & 0x3ff));
      utf8.push(0xf0 | (charcode >> 18), 0x80 | ((charcode >> 12) & 0x3f), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    }
  }

  for (let b = 0; b < utf8.length; b++) {
    words[b >> 2] |= utf8[b] << ((3 - (b % 4)) * 8);
  }

  words[utf8.length >> 2] |= 0x80 << ((3 - (utf8.length % 4)) * 8);
  words[(((utf8.length + 8) >> 6) << 4) + 15] = utf8.length * 8;

  for (let b = 0; b < words.length; b += 16) {
    const w = words.slice(b, b + 16);
    const oldHash = [...hash];

    for (let i = 0; i < 64; i++) {
      if (i >= 16) {
        const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }

      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[i] + w[i]) | 0;
      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;

      hash = [
        (temp1 + temp2) | 0,
        hash[0],
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6],
      ];
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  let result = '';
  for (let i = 0; i < 8; i++) {
    result += (hash[i] >>> 0).toString(16).padStart(8, '0');
  }

  return result;
}

export function computeImportHash(row: {
  date: string;
  type: string;
  category: string;
  amountPaise: number;
  paymentMethod: string;
  description?: string;
}): string {
  const norm = `${row.date}|${row.type}|${row.category.trim().toLowerCase()}|${row.amountPaise}|${row.paymentMethod.trim().toLowerCase()}|${(row.description || '').trim()}`;
  return sha256(norm);
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

  const payload = {
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

export function filterTransactions<T extends { date: string; type: string; category: string; description?: string; createdAt?: string }>(
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
