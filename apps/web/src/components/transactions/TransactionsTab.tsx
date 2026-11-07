import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { useTracker } from '../../hooks/useTracker';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { useDebounce } from '../../hooks/useDebounce';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Dropdown } from '../ui/Dropdown';
import { SegmentedControl } from '../ui/SegmentedControl';
import { TextInput } from '../ui/TextInput';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { Card } from '../ui/Card';
import { TransactionSlideOver } from './TransactionSlideOver';
import { BankImportModal } from './BankImportModal';
import {
  filterTransactions,
  paginateTransactions,
  extractUniqueMonths,
  exportTransactionsCsv,
  exportTransactionsJson,
  importTransactionsFromCsv,
  importBackupFromJson,
} from '../../lib/transactions';
import { formatCurrency, formatCalendarDate, getLocalDateString } from '../../lib/formatters';
import { toUserFriendlyError } from '../../lib/errorMessages';
import {
  SearchIcon,
  PlusIcon,
  TrashIcon,
  EditIcon,
  DownloadIcon,
  UploadIcon,
  MoreHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
  RefreshCwIcon,
  AlertCircleIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  UtensilsIcon,
  ShoppingCartIcon,
  LandmarkIcon,
  WalletIcon,
  ZapIcon,
  CarIcon,
  FilmIcon,
  TagIcon,
} from '../icons';
import { EASING } from '../../ui/motion';
import type { Transaction, TransactionSortOption } from '../../types';

/**
 * Category Icon Resolver: renders crisp, thematic SVG icons for common categories.
 */
function getCategoryIcon(category: string, size = 15) {
  const norm = (category || '').toLowerCase();
  if (norm.includes('food') || norm.includes('dining') || norm.includes('restaurant') || norm.includes('cafe')) {
    return <UtensilsIcon size={size} />;
  }
  if (norm.includes('grocer') || norm.includes('supermarket') || norm.includes('market') || norm.includes('shopping')) {
    return <ShoppingCartIcon size={size} />;
  }
  if (norm.includes('salary') || norm.includes('freelance') || norm.includes('income') || norm.includes('paycheck')) {
    return <LandmarkIcon size={size} />;
  }
  if (norm.includes('invest') || norm.includes('dividend') || norm.includes('mutual')) {
    return <WalletIcon size={size} />;
  }
  if (norm.includes('utilit') || norm.includes('bill') || norm.includes('electric') || norm.includes('water')) {
    return <ZapIcon size={size} />;
  }
  if (norm.includes('travel') || norm.includes('transport') || norm.includes('train') || norm.includes('cab') || norm.includes('flight')) {
    return <CarIcon size={size} />;
  }
  if (norm.includes('subscript') || norm.includes('stream') || norm.includes('entertain') || norm.includes('movie')) {
    return <FilmIcon size={size} />;
  }
  return <TagIcon size={size} />;
}

export interface TransactionsTabProps {
  searchDebounceMs?: number;
}

export function TransactionsTab({ searchDebounceMs = 300 }: TransactionsTabProps = {}) {
  const {
    transactions,
    autopays,
    budgetGoal,
    categories,
    addTransaction,
    deleteTransaction,
    importTransactions,
    updateBudgetGoal,
    isLoading,
    loadError,
    refreshData,
  } = useTracker();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const listTopRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, searchDebounceMs);
  const [typeFilter, setTypeFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [sortBy, setSortBy] = useState<TransactionSortOption>('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Slide-over modal state (Add / Edit)
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [slideOverTrigger, setSlideOverTrigger] = useState<HTMLElement | null>(null);
  const [isBankImportOpen, setIsBankImportOpen] = useState(false);

  // Close more menu on click outside or Escape
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreMenuOpen(false);
      }
    };

    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleDocumentClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreMenuOpen]);

  // Month options from transactions
  const monthOptions = useMemo(() => {
    const list = extractUniqueMonths(transactions);
    return [{ value: 'all', label: 'All Months' }, ...list];
  }, [transactions]);

  // Filter transactions using existing FR-3 logic
  const filtered = useMemo(() => {
    return filterTransactions(
      transactions,
      debouncedSearchQuery,
      typeFilter,
      monthFilter,
      sortBy,
    );
  }, [transactions, debouncedSearchQuery, typeFilter, monthFilter, sortBy]);

  // Filtered cashflow summary metrics
  const filteredMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    filtered.forEach((t) => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expense += t.amount;
    });
    return {
      income,
      expense,
      net: income - expense,
      count: filtered.length,
    };
  }, [filtered]);

  // 10-per-page pagination
  const { paginatedItems, totalPages, totalItems } = useMemo(() => {
    return paginateTransactions(filtered, currentPage, 10);
  }, [filtered, currentPage]);

  // Group paginated items under date headers
  const groupedTransactions = useMemo(() => {
    const groups: {
      date: string;
      formattedDate: string;
      dayTotal: number;
      items: Transaction[];
    }[] = [];
    const groupMap = new Map<string, Transaction[]>();

    paginatedItems.forEach((tx) => {
      const dateKey = tx.date;
      if (!groupMap.has(dateKey)) {
        groupMap.set(dateKey, []);
      }
      groupMap.get(dateKey)!.push(tx);
    });

    groupMap.forEach((items, dateKey) => {
      const dayTotal = items.reduce(
        (sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount),
        0,
      );

      const formattedDate = formatCalendarDate(dateKey, {
        includeWeekday: true,
        includeYear: true,
      });

      groups.push({
        date: dateKey,
        formattedDate,
        dayTotal,
        items,
      });
    });

    return groups;
  }, [paginatedItems]);

  // Handle Delete with Confirmation Modal
  const handleDeleteTransaction = useCallback(
    async (tx: Transaction) => {
      const confirmed = await showConfirm(
        'Are you sure you want to delete this transaction?',
        {
          title: 'Delete transaction',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          variant: 'danger',
        },
      );
      if (!confirmed) return;

      try {
        await deleteTransaction(tx.id);
        showToast(
          `Deleted ${tx.category} transaction`,
          'info',
          6000,
          {
            label: 'Undo',
            onClick: async () => {
              try {
                await addTransaction({
                  amount: tx.amount,
                  category: tx.category,
                  date: tx.date,
                  type: tx.type,
                  description: tx.description,
                  paymentMethod: tx.paymentMethod,
                });
                showToast(`Restored ${tx.category} transaction`, 'success');
              } catch (restoreErr: unknown) {
                showToast(toUserFriendlyError(restoreErr, 'Failed to restore transaction.'), 'error');
              }
            },
          },
        );
      } catch (err: unknown) {
        showToast(toUserFriendlyError(err, 'Failed to delete transaction. Please try again.'), 'error');
      }
    },
    [showConfirm, deleteTransaction, addTransaction, showToast],
  );

  const handleDeleteWithUndo = handleDeleteTransaction;

  // Pagination page change: cross-fades and scrolls list top into view
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Open Add slide-over
  const handleOpenAdd = (e: React.MouseEvent<HTMLElement>) => {
    setEditingTransaction(null);
    setSlideOverTrigger(e.currentTarget);
    setIsSlideOverOpen(true);
  };

  // Open Edit slide-over
  const handleOpenEdit = (tx: Transaction, e: React.MouseEvent<HTMLElement>) => {
    setEditingTransaction(tx);
    setSlideOverTrigger(e.currentTarget);
    setIsSlideOverOpen(true);
  };

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setTypeFilter('all');
    setMonthFilter('all');
    setCurrentPage(1);
  }, []);

  // Export handlers
  const handleExport = (format: 'csv-detailed' | 'csv-basic' | 'json-backup') => {
    setIsMoreMenuOpen(false);

    if (transactions.length === 0) {
      showToast('No transactions to export.', 'info');
      return;
    }

    const datePart = getLocalDateString();
    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'csv-basic') {
      content = exportTransactionsCsv(transactions, 'csv-basic');
      filename = `transactions_basic_${datePart}.csv`;
      mimeType = 'text/csv;charset=utf-8';
    } else if (format === 'json-backup') {
      content = exportTransactionsJson({ transactions, autopays, budgetGoal });
      filename = `moneytracker_backup_${datePart}.json`;
      mimeType = 'application/json;charset=utf-8';
    } else {
      content = exportTransactionsCsv(transactions, 'csv-detailed');
      filename = `transactions_detailed_${datePart}.csv`;
      mimeType = 'text/csv;charset=utf-8';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);

    showToast(`Exported ${transactions.length} transactions as ${filename}.`, 'success');
  };

  // 5MB file upload limit (SEC-13)
  const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024;

  // Import handler (SEC-13: 5MB size limit & format validation)
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate extension & MIME type
    const isCsvName = file.name.toLowerCase().endsWith('.csv');
    if (!isCsvName) {
      showToast('Invalid file format. Please upload a .csv file.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsMoreMenuOpen(false);
      return;
    }

    // Validate file size before reading into memory (max 5MB)
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      showToast('File size exceeds the 5MB limit. Please choose a smaller CSV file.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsMoreMenuOpen(false);
      return;
    }

    try {
      const text = await file.text();
      const result = importTransactionsFromCsv(text, transactions);

      if (result.error) {
        showToast(result.error, 'error');
        return;
      }

      if (result.newTransactions.length > 0) {
        await importTransactions(result.newTransactions);
        showToast(
          `Imported ${result.newTransactions.length} transactions (${result.skippedCount} duplicates skipped).`,
          'success',
        );
      } else {
        showToast(
          result.skippedCount > 0
            ? `No new transactions imported (${result.skippedCount} duplicates skipped).`
            : 'No valid transaction records found.',
          'info',
        );
      }
    } catch (err: unknown) {
      showToast(toUserFriendlyError(err, 'Failed to read CSV file. Please make sure it is a valid CSV.'), 'error');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsMoreMenuOpen(false);
    }
  };

  // JSON Backup Import handler (CORE-13, SEC-13: 5MB size limit & format validation)
  const handleImportJsonChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isJsonName = file.name.toLowerCase().endsWith('.json');
    if (!isJsonName) {
      showToast('Invalid file format. Please upload a .json backup file.', 'error');
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
      setIsMoreMenuOpen(false);
      return;
    }

    if (file.size > MAX_IMPORT_FILE_SIZE) {
      showToast('File size exceeds the 5MB limit. Please choose a smaller JSON file.', 'error');
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
      setIsMoreMenuOpen(false);
      return;
    }

    try {
      const text = await file.text();
      const result = importBackupFromJson(text, transactions);

      if (result.error) {
        showToast(result.error, 'error');
        return;
      }

      if (result.newTransactions.length > 0) {
        await importTransactions(result.newTransactions);
      }

      if (result.budgetGoal) {
        await updateBudgetGoal(result.budgetGoal);
      }

      const count = result.newTransactions.length;
      const skipped = result.skippedCount;
      if (count > 0) {
        showToast(
          `Restored ${count} transactions from JSON backup (${skipped} duplicates skipped).`,
          'success',
        );
      } else {
        showToast(
          skipped > 0
            ? `Backup processed: all ${skipped} transactions already exist in your account.`
            : 'No valid transaction records found in backup.',
          'info',
        );
      }
    } catch (err: unknown) {
      showToast(toUserFriendlyError(err, 'Failed to read JSON backup file.'), 'error');
    } finally {
      if (jsonFileInputRef.current) {
        jsonFileInputRef.current.value = '';
      }
      setIsMoreMenuOpen(false);
    }
  };

  // Bank Statement CSV Import handler (DIFF-2)
  const handleBankImportTransactions = useCallback(
    async (
      importedTxs: Array<{
        amount: number;
        type: 'income' | 'expense';
        category: string;
        description: string;
        date: string;
        paymentMethod: string;
      }>,
    ) => {
      if (importedTxs.length === 0) return;
      const fullTxs: Transaction[] = importedTxs.map((t) => ({
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        amount: t.amount,
        type: t.type,
        category: t.category,
        paymentMethod: t.paymentMethod,
        description: t.description,
        date: t.date,
        createdAt: new Date().toISOString(),
        source: 'csv_import',
      }));

      const success = await importTransactions(fullTxs);
      if (success) {
        showToast(
          `Successfully imported ${fullTxs.length} transaction${fullTxs.length === 1 ? '' : 's'} from bank statement.`,
          'success',
        );
      } else {
        showToast('Failed to import transactions. Please try again.', 'error');
      }
    },
    [importTransactions, showToast],
  );

  // Check active filter chips
  const hasActiveFilters = searchQuery.trim() !== '' || typeFilter !== 'all' || monthFilter !== 'all';
  const selectedMonthOption = monthOptions.find((m) => m.value === monthFilter);

  return (
    <div id="transactions" className="tab-content active space-y-6 w-full">
      {/* Scroll anchor for pagination */}
      <div ref={listTopRef} />

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
            Transactions
          </h1>
          <span
            id="txCount"
            className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-2 text-ink-2 border border-line tabular-nums"
          >
            {totalItems}
          </span>
        </div>

        {/* Actions Group: More Menu + New Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* More Menu (Portability: Import & Export) */}
          <div className="relative" ref={moreMenuRef}>
            <Button
              id="txMoreMenuBtn"
              type="button"
              variant="secondary"
              size="md"
              icon={<MoreHorizontalIcon size={16} />}
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              aria-label="More options"
              aria-expanded={isMoreMenuOpen}
            >
              More
            </Button>

            {/* Hidden CSV file input */}
            <input
              ref={fileInputRef}
              type="file"
              id="importCsvInput"
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              onChange={handleImportFileChange}
            />

            {/* Hidden JSON backup file input (CORE-13) */}
            <input
              ref={jsonFileInputRef}
              type="file"
              id="importJsonInput"
              accept=".json,application/json"
              style={{ display: 'none' }}
              onChange={handleImportJsonChange}
            />

            {/* More Menu Dropdown Panel */}
            <AnimatePresence>
              {isMoreMenuOpen && (
                <m.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.11, ease: EASING.in } }}
                  transition={{ duration: 0.16, ease: EASING.out }}
                  className="absolute right-0 top-full mt-1.5 w-56 rounded-card bg-surface border border-line shadow-2 p-1.5 z-30"
                  role="menu"
                >
                  <button
                    type="button"
                    role="menuitem"
                    id="importCsvBtn"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink rounded-btn hover:bg-surface-2 transition-colors duration-fast text-left"
                  >
                    <UploadIcon size={16} className="text-ink-2" />
                    <span>Import CSV</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    id="importBankStatementBtn"
                    onClick={() => {
                      setIsBankImportOpen(true);
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink rounded-btn hover:bg-surface-2 transition-colors duration-fast text-left"
                  >
                    <UploadIcon size={16} className="text-accent" />
                    <span>Import Bank Statement</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    id="importJsonBtn"
                    onClick={() => jsonFileInputRef.current?.click()}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink rounded-btn hover:bg-surface-2 transition-colors duration-fast text-left"
                  >
                    <UploadIcon size={16} className="text-ink-2" />
                    <span>Import JSON Backup</span>
                  </button>

                  <div className="my-1 border-t border-line" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleExport('csv-detailed')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink rounded-btn hover:bg-surface-2 transition-colors duration-fast text-left"
                  >
                    <DownloadIcon size={16} className="text-ink-2" />
                    <span>Export CSV Detailed</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleExport('csv-basic')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink rounded-btn hover:bg-surface-2 transition-colors duration-fast text-left"
                  >
                    <DownloadIcon size={16} className="text-ink-2" />
                    <span>Export CSV Basic</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleExport('json-backup')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink rounded-btn hover:bg-surface-2 transition-colors duration-fast text-left"
                  >
                    <DownloadIcon size={16} className="text-ink-2" />
                    <span>Export JSON Backup</span>
                  </button>
                </m.div>
              )}
            </AnimatePresence>
          </div>

          {/* New Transaction Button */}
          <Button
            id="txNewBtn"
            type="button"
            variant="primary"
            size="md"
            icon={<PlusIcon size={16} />}
            onClick={handleOpenAdd}
          >
            New
          </Button>
        </div>
      </div>

      {/* Filtered Financial Summary Strip (Skiper UI / Realtime Colors Pattern) */}
      {transactions.length > 0 && (
        <Card className="p-3.5 sm:p-4 bg-surface border border-line shadow-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-ink-3 font-medium flex items-center gap-1">
              <ArrowUpIcon size={12} className="text-income" /> Filtered Inflow
            </span>
            <span className="text-base sm:text-lg font-semibold text-income tabular-nums mt-0.5">
              +{formatCurrency(filteredMetrics.income)}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-ink-3 font-medium flex items-center gap-1">
              <ArrowDownIcon size={12} className="text-ink-2" /> Filtered Outflow
            </span>
            <span className="text-base sm:text-lg font-semibold text-ink tabular-nums mt-0.5">
              -{formatCurrency(filteredMetrics.expense)}
            </span>
          </div>

          <div className="flex flex-col col-span-2 sm:col-span-1 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-line sm:pl-4">
            <span className="text-[11px] uppercase tracking-wider text-ink-3 font-medium">
              Net Filtered Flow
            </span>
            <span
              className={`text-base sm:text-lg font-semibold tabular-nums mt-0.5 ${
                filteredMetrics.net >= 0 ? 'text-income' : 'text-danger'
              }`}
            >
              {filteredMetrics.net >= 0 ? '+' : ''}
              {formatCurrency(filteredMetrics.net)}
            </span>
          </div>
        </Card>
      )}

      {/* Sticky Filter Bar */}
      <div className="sticky top-16 z-20 px-3.5 sm:px-5 py-3 rounded-card bg-surface/90 backdrop-blur-md border border-line shadow-1 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <TextInput
              id="txSearch"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              leftAddon={<SearchIcon size={16} className="text-ink-3" />}
              rightAddon={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    aria-label="Clear search"
                    className="p-1 rounded-chip text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors duration-fast"
                  >
                    <XIcon size={14} />
                  </button>
                ) : undefined
              }
            />
          </div>

          {/* Filter Group: Type SegmentedControl, Month Dropdown, Sort Dropdown */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Type Filter */}
            <div className="shrink-0 w-full sm:w-auto">
              <SegmentedControl
                id="txFilterType"
                size="sm"
                value={typeFilter}
                onChange={(val) => {
                  setTypeFilter(val);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expenses' },
                ]}
              />
            </div>

            {/* Month Dropdown */}
            <div className="w-full sm:w-44">
              <Dropdown
                id="txMonthFilter"
                value={monthFilter}
                onChange={(val) => {
                  setMonthFilter(val);
                  setCurrentPage(1);
                }}
                options={monthOptions}
                placeholder="All Months"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="w-full sm:w-44">
              <Dropdown
                id="txSortBy"
                value={sortBy}
                onChange={(val) => {
                  setSortBy(val as TransactionSortOption);
                  setCurrentPage(1);
                }}
                options={[
                  { value: 'date-desc', label: 'Date: Newest' },
                  { value: 'date-asc', label: 'Date: Oldest' },
                  { value: 'amount-desc', label: 'Amount: High to Low' },
                  { value: 'amount-asc', label: 'Amount: Low to High' },
                  { value: 'category-asc', label: 'Category: A to Z' },
                  { value: 'month-desc', label: 'Month: Newest' },
                  { value: 'month-asc', label: 'Month: Oldest' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Active Filters Chips & Live Result Count */}
        {hasActiveFilters && (
          <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-line/60">
            <span className="text-xs text-ink-3 font-medium">Filters:</span>

            {searchQuery.trim() !== '' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip text-xs bg-surface-2 border border-line text-ink">
                <span>Search: &ldquo;{searchQuery}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  aria-label="Remove search filter"
                  className="hover:text-danger focus-visible:outline-none"
                >
                  <XIcon size={12} />
                </button>
              </span>
            )}

            {typeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip text-xs bg-surface-2 border border-line text-ink">
                <span>Type: {typeFilter === 'income' ? 'Income' : 'Expenses'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setTypeFilter('all');
                    setCurrentPage(1);
                  }}
                  aria-label="Remove type filter"
                  className="hover:text-danger focus-visible:outline-none"
                >
                  <XIcon size={12} />
                </button>
              </span>
            )}

            {monthFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-chip text-xs bg-surface-2 border border-line text-ink">
                <span>Month: {selectedMonthOption?.label || monthFilter}</span>
                <button
                  type="button"
                  onClick={() => {
                    setMonthFilter('all');
                    setCurrentPage(1);
                  }}
                  aria-label="Remove month filter"
                  className="hover:text-danger focus-visible:outline-none"
                >
                  <XIcon size={12} />
                </button>
              </span>
            )}

            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleClearFilters}
              className="text-xs text-accent hover:text-accent font-semibold p-1 h-auto"
            >
              Clear all
            </Button>

            <span className="text-xs text-ink-3 ml-auto font-medium tabular-nums">
              {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
            </span>
          </div>
        )}
      </div>

      {/* Error State */}
      {loadError && (
        <div className="p-4 rounded-card bg-danger-tint border border-danger/20 flex items-center justify-between gap-3 text-ink">
          <div className="flex items-center gap-3">
            <AlertCircleIcon size={20} className="text-danger shrink-0" />
            <div className="text-sm">
              <span className="font-semibold block">Failed to load transactions</span>
              <span className="text-ink-2">{loadError}</span>
            </div>
          </div>
          {refreshData && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => refreshData()}
              className="gap-1.5 shrink-0"
            >
              <RefreshCwIcon size={14} />
              <span>Retry</span>
            </Button>
          )}
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading && transactions.length === 0 ? (
        <div className="space-y-6">
          {[1, 2].map((group) => (
            <div key={group} className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton width={160} height={20} />
                <Skeleton width={80} height={20} />
              </div>
              <div className="bg-surface rounded-card border border-line divide-y divide-line overflow-hidden">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Skeleton width={70} height={24} className="rounded-chip" />
                      <div className="space-y-1.5 flex-1 max-w-sm">
                        <Skeleton height={16} width="80%" />
                        <Skeleton height={12} width="40%" />
                      </div>
                    </div>
                    <Skeleton width={90} height={20} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        /* Empty State: No Transactions recorded */
        <EmptyState
          title="No transactions yet"
          description="Add your first transaction to start tracking your income and expenses."
          action={
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleOpenAdd}
              className="gap-1.5"
            >
              <PlusIcon size={16} />
              <span>Add your first transaction</span>
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        /* Empty State: No search/filter results */
        <EmptyState
          title="No matching transactions"
          description="No transactions found matching your current search or filter criteria."
          action={
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleClearFilters}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        /* Transactions List grouped by Date with Page Change Cross-Fade */
        <AnimatePresence mode="wait">
          <m.div
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: EASING.standard }}
            id="transactionsList"
            className="space-y-6"
          >
            {groupedTransactions.map((group) => (
              <div key={group.date} className="space-y-2">
                {/* Date Header with Day's Total */}
                <div className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wider text-ink-3">
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon size={13} className="text-ink-3" />
                    <span>{group.formattedDate}</span>
                  </span>
                  <span
                    className={`tabular-nums ${
                      group.dayTotal > 0
                        ? 'text-income'
                        : group.dayTotal < 0
                          ? 'text-ink'
                          : 'text-ink-3'
                    }`}
                  >
                    Day Total: {group.dayTotal > 0 ? '+' : ''}
                    {formatCurrency(group.dayTotal)}
                  </span>
                </div>

                {/* Group Rows Container */}
                <div className="bg-surface rounded-card border border-line shadow-1 divide-y divide-line overflow-hidden">
                  {group.items.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const amountPrefix = isIncome ? '+' : '-';
                    const isAuto =
                      tx.source === 'autopay' || Boolean(tx.autopayId) || tx.isAnomaly === false;
                    const methodDisplay = tx.paymentMethod
                      ? tx.paymentMethod.replace(/_/g, ' ')
                      : 'cash';

                    return (
                      <m.div
                        layout
                        transition={{ layout: { duration: 0.24, ease: [0.2, 0, 0, 1] } }}
                        key={tx.id}
                        className="group relative p-3 sm:px-4 hover:bg-surface-2/60 transition-colors duration-fast"
                      >
                        {/* ====================================================================
                            Desktop Layout (>= 641px): Single-Line Row
                            ==================================================================== */}
                        <div className="hidden sm:flex items-center justify-between gap-4">
                          {/* Left: Category Icon Glyph, Badge, Description, Payment Method, Auto Tag */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0 text-ink-2 border border-line/60">
                              {getCategoryIcon(tx.category)}
                            </div>
                            <Badge category={tx.category} className="shrink-0">
                              {tx.category}
                            </Badge>
                            <span className="text-sm font-medium text-ink truncate max-w-xs md:max-w-md">
                              {tx.description || tx.category}
                            </span>
                            <span className="text-xs text-ink-3 capitalize shrink-0">
                              {methodDisplay}
                            </span>
                            {isAuto && tx.source === 'autopay' && (
                              <span className="px-1.5 py-0.5 rounded-chip text-[10px] font-semibold bg-accent-tint text-accent shrink-0 uppercase tracking-wide">
                                Auto
                              </span>
                            )}
                          </div>

                          {/* Right: Tabular Amount & Row Actions (Hover on Desktop) */}
                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={`text-sm font-semibold tabular-nums ${
                                isIncome ? 'text-income' : 'text-ink'
                              }`}
                            >
                              {amountPrefix}
                              {formatCurrency(tx.amount)}
                            </span>

                            {/* Row Action Buttons: Fade in on hover via @media (hover: hover) */}
                            <div className="row-action-btn flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleOpenEdit(tx, e)}
                                title="Edit transaction"
                                aria-label={`Edit ${tx.category} transaction`}
                                className="p-1.5 rounded-chip text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                              >
                                <EditIcon size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWithUndo(tx)}
                                title="Delete transaction"
                                aria-label={`Delete ${tx.category} transaction`}
                                className="p-1.5 rounded-chip text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                              >
                                <TrashIcon size={15} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* ====================================================================
                            Mobile Layout (< 641px): Two-Line Card with Glyphs & Zero Clipping
                            ==================================================================== */}
                        <div className="flex sm:hidden flex-col gap-2">
                          {/* Line 1: Glyph + Badge + Description (left), Tabular Amount (right) */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center shrink-0 text-ink-2 border border-line/60">
                                {getCategoryIcon(tx.category, 13)}
                              </div>
                              <Badge category={tx.category} className="shrink-0 text-xs">
                                {tx.category}
                              </Badge>
                              <span className="text-sm font-medium text-ink truncate">
                                {tx.description || tx.category}
                              </span>
                            </div>
                            <span
                              className={`text-sm font-semibold tabular-nums shrink-0 ${
                                isIncome ? 'text-income' : 'text-ink'
                              }`}
                            >
                              {amountPrefix}
                              {formatCurrency(tx.amount)}
                            </span>
                          </div>

                          {/* Line 2: Payment Method + Auto tag (left), Edit & Delete buttons (right) */}
                          <div className="flex items-center justify-between gap-2 text-xs text-ink-3 pt-0.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="capitalize">{methodDisplay}</span>
                              {isAuto && tx.source === 'autopay' && (
                                <span className="px-1.5 py-0.5 rounded-chip text-[10px] font-semibold bg-accent-tint text-accent uppercase tracking-wide">
                                  Auto
                                </span>
                              )}
                            </div>

                            {/* Mobile action buttons (always visible on touch) */}
                            <div className="row-action-btn flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleOpenEdit(tx, e)}
                                title="Edit transaction"
                                aria-label={`Edit ${tx.category} transaction`}
                                className="p-1 rounded-chip text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors duration-fast"
                              >
                                <EditIcon size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWithUndo(tx)}
                                title="Delete transaction"
                                aria-label={`Delete ${tx.category} transaction`}
                                className="p-1 rounded-chip text-ink-3 hover:text-danger hover:bg-danger-tint transition-colors duration-fast"
                              >
                                <TrashIcon size={15} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </m.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </m.div>
        </AnimatePresence>
      )}

      {/* Pagination Controls */}
      {totalItems > 10 && (
        <div
          id="txPagination"
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-line text-sm"
        >
          {/* Range label per SPEC section 5: e.g. 11–20 of 87 */}
          <div id="txPageInfo" className="text-ink-3 text-xs sm:text-sm tabular-nums">
            {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, totalItems)} of {totalItems}
          </div>

          <div className="flex items-center gap-2">
            <Button
              id="txPrevPage"
              type="button"
              variant="secondary"
              size="md"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              className="gap-1"
            >
              <ChevronLeftIcon size={16} />
              <span>Previous</span>
            </Button>

            <Button
              id="txNextPage"
              type="button"
              variant="secondary"
              size="md"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              className="gap-1"
            >
              <span>Next</span>
              <ChevronRightIcon size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit Slide-Over & Bottom Sheet */}
      <TransactionSlideOver
        isOpen={isSlideOverOpen}
        onClose={() => {
          setIsSlideOverOpen(false);
          setEditingTransaction(null);
        }}
        initialData={editingTransaction}
        triggerElement={slideOverTrigger}
      />

      {/* Bank Statement CSV Import Modal (DIFF-2) */}
      <BankImportModal
        isOpen={isBankImportOpen}
        onClose={() => setIsBankImportOpen(false)}
        onImportTransactions={handleBankImportTransactions}
        existingTransactions={transactions}
        availableCategories={categories}
      />
    </div>
  );
}

export default TransactionsTab;
