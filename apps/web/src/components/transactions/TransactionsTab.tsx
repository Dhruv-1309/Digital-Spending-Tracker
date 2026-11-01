import React, { useState, useMemo, useRef } from 'react';
import { useTracker } from '../../hooks/useTracker';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';
import { CustomSelect } from '../common/CustomSelect';
import {
  filterTransactions,
  paginateTransactions,
  extractUniqueMonths,
  exportTransactionsCsv,
  exportTransactionsJson,
  importTransactionsFromCsv,
} from '../../lib/transactions';
import { formatCurrency } from '../../lib/formatters';
import type { TransactionSortOption } from '../../types';

export function TransactionsTab() {
  const {
    transactions,
    autopays,
    budgetGoal,
    deleteTransaction,
    importTransactions,
    setCurrentTab,
  } = useTracker();
  const { showConfirm } = useConfirm();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [sortBy, setSortBy] = useState<TransactionSortOption>('date-desc');
  const [exportFormat, setExportFormat] = useState('csv-detailed');
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique months from transactions
  const monthOptions = useMemo(() => {
    const list = extractUniqueMonths(transactions);
    return [{ value: 'all', label: 'All Months' }, ...list];
  }, [transactions]);

  // Filter transactions
  const filtered = useMemo(() => {
    return filterTransactions(
      transactions,
      searchQuery,
      typeFilter,
      monthFilter,
      sortBy,
    );
  }, [transactions, searchQuery, typeFilter, monthFilter, sortBy]);

  // Paginate filtered transactions
  const { paginatedItems, totalPages, totalItems } = useMemo(() => {
    return paginateTransactions(filtered, currentPage, 20);
  }, [filtered, currentPage]);

  const handleDelete = async (id: string, category: string, date: string) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete this ${category} transaction from ${date}?`,
      {
        title: 'Delete Transaction',
        confirmText: 'Delete',
        variant: 'danger',
      },
    );

    if (confirmed) {
      await deleteTransaction(id);
      showToast('Transaction deleted successfully.', 'success');
    }
  };

  const handleExport = () => {
    if (transactions.length === 0) {
      showToast('No transactions to export.', 'info');
      return;
    }

    const datePart = new Date().toISOString().split('T')[0];
    let content = '';
    let filename = '';
    let mimeType = '';

    if (exportFormat === 'csv-basic') {
      content = exportTransactionsCsv(transactions, 'csv-basic');
      filename = `transactions_basic_${datePart}.csv`;
      mimeType = 'text/csv;charset=utf-8';
    } else if (exportFormat === 'json-backup') {
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

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
          `Imported ${result.newTransactions.length} transactions${
            result.skippedCount > 0 ? ` (${result.skippedCount} duplicates skipped)` : ''
          }.`,
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
      const error = err as { message?: string };
      showToast(error.message || 'Failed to read CSV file.', 'error');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div id="transactions" className="tab-content active">
      <div className="transactions-header-area">
        <div className="header-title">
          <h3>All Transactions</h3>
          <span className="badge-count" id="txCount">
            {totalItems}
          </span>
        </div>
        <div className="actions-group">
          <div className="custom-select export-format-select">
            <CustomSelect
              id="exportFormat"
              value={exportFormat}
              onChange={setExportFormat}
              options={[
                { value: 'csv-detailed', label: 'CSV Detailed' },
                { value: 'csv-basic', label: 'CSV Basic' },
                { value: 'json-backup', label: 'JSON Backup' },
              ]}
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            id="importCsvInput"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={handleImportFileChange}
          />
          <button
            className="btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="fas fa-file-import" /> Import CSV
          </button>
          <button className="btn btn-export" type="button" onClick={handleExport}>
            <i className="fas fa-download" /> Export
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setCurrentTab('add-transaction')}
          >
            <i className="fas fa-plus" /> New
          </button>
        </div>
      </div>

      <div className="filters-toolbar">
        <div className="search-box">
          <i className="fas fa-search" />
          <input
            type="text"
            id="txSearch"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="filter-group">
          <div className="custom-select">
            <CustomSelect
              id="txFilterType"
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'income', label: 'Income', icon: 'fa-arrow-up' },
                { value: 'expense', label: 'Expense', icon: 'fa-arrow-down' },
              ]}
            />
          </div>
          <div className="custom-select">
            <CustomSelect
              id="txMonthFilter"
              value={monthFilter}
              onChange={(val) => {
                setMonthFilter(val);
                setCurrentPage(1);
              }}
              options={monthOptions}
            />
          </div>
          <div className="custom-select">
            <CustomSelect
              id="txSortBy"
              value={sortBy}
              onChange={(val) => {
                setSortBy(val as TransactionSortOption);
                setCurrentPage(1);
              }}
              options={[
                { value: 'date-desc', label: 'Date: Newest' },
                { value: 'date-asc', label: 'Date: Oldest' },
                { value: 'month-desc', label: 'Month: Newest' },
                { value: 'month-asc', label: 'Month: Oldest' },
              ]}
            />
          </div>
        </div>
      </div>

      <div id="transactionsList" className="transaction-feed">
        {paginatedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <i
              className="fas fa-search"
              style={{ fontSize: '2rem', marginBottom: '16px', opacity: 0.5 }}
            />
            <p>No transactions found matching your criteria.</p>
          </div>
        ) : (
          paginatedItems.map((tx) => {
            const isIncome = tx.type === 'income';
            const amountPrefix = isIncome ? '+' : '-';
            const icon = isIncome ? 'fa-arrow-down' : 'fa-arrow-up';
            const iconBg = isIncome ? '#dcfce7' : '#fee2e2';
            const iconColor = isIncome ? '#16a34a' : '#dc2626';
            const amountColor = isIncome ? '#16a34a' : '#1e293b';

            const dateStr = new Date(tx.date).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            const methodDisplay = tx.paymentMethod
              ? tx.paymentMethod.replace('_', ' ')
              : '-';
            const isAuto =
              tx.source === 'autopay' || Boolean(tx.autopayId) || tx.isAnomaly === false;

            return (
              <div key={tx.id} className="tx-card">
                <div
                  className="tx-icon-wrapper"
                  style={{ background: iconBg, color: iconColor }}
                >
                  <i className={`fas ${icon}`} />
                </div>

                <div className="tx-details">
                  <div className="tx-category">{tx.category}</div>
                  <div className="tx-meta">
                    <span>
                      <i className="far fa-calendar" /> {dateStr}
                    </span>
                    <span>•</span>
                    <span style={{ textTransform: 'capitalize' }}>{methodDisplay}</span>
                    {tx.description && <span>• {tx.description}</span>}
                    {isAuto && tx.source === 'autopay' && (
                      <span
                        style={{
                          color: '#3b82f6',
                          background: '#eff6ff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                        }}
                      >
                        AUTO
                      </span>
                    )}
                  </div>
                </div>

                <div className="tx-amount" style={{ color: amountColor }}>
                  {amountPrefix}
                  {formatCurrency(tx.amount)}
                </div>

                <div className="tx-actions">
                  <button
                    className="btn-icon-only"
                    type="button"
                    title="Delete"
                    aria-label={`Delete transaction ${tx.category} on ${dateStr}`}
                    onClick={() => handleDelete(tx.id, tx.category, dateStr)}
                  >
                    <i className="fas fa-trash-alt" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalItems > 20 && (
        <div id="txPagination" className="tx-pagination" style={{ display: 'flex' }}>
          <button
            id="txPrevPage"
            className="btn btn-pagination"
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <i className="fas fa-chevron-left" /> Prev
          </button>
          <div id="txPageInfo" className="tx-page-info">
            Page {currentPage} of {totalPages}
          </div>
          <button
            id="txNextPage"
            className="btn btn-pagination"
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next <i className="fas fa-chevron-right" />
          </button>
        </div>
      )}
    </div>
  );
}
