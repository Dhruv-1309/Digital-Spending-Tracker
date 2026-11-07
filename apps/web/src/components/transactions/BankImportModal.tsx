import React, { useState, useEffect, useMemo, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { EASING } from '../../ui/motion';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../lib/formatters';
import { toUserFriendlyError } from '../../lib/errorMessages';
import {
  generateBankImportPreview,
  detectBankTemplate,
  loadSavedBankTemplates,
  saveBankTemplate,
  loadLearnedMerchantRules,
  saveLearnedMerchantRule,
  type BankColumnMapping,
  type BankTemplate,
  type MerchantRule,
  type BankImportRowPreview,
} from '../../lib/merchantRules';
import { Card, Button, Badge } from '../ui';
import {
  XIcon,
  UploadIcon,
  CheckIcon,
  SparklesIcon,
  SaveIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '../icons';

export interface BankImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTransactions: (
    transactions: Array<{
      amount: number;
      type: 'income' | 'expense';
      category: string;
      description: string;
      date: string;
      paymentMethod: string;
    }>,
  ) => Promise<void> | void;
  existingTransactions: Array<{
    date: string;
    amount?: number;
    amountPaise?: number | bigint;
    type: string;
    category: string;
    description?: string;
  }>;
  availableCategories: {
    income: string[];
    expense: string[];
  };
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit (SEC-13)

export function BankImportModal({
  isOpen,
  onClose,
  onImportTransactions,
  existingTransactions,
  availableCategories,
}: BankImportModalProps) {
  const { showToast } = useToast();

  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [templates, setTemplates] = useState<BankTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tmpl_generic');
  const [customRules, setCustomRules] = useState<MerchantRule[]>([]);
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'ready' | 'duplicates' | 'uncategorized'>('all');

  // Active column mapping
  const [mapping, setMapping] = useState<BankColumnMapping>({
    dateColumn: 'Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    debitColumn: '',
    creditColumn: '',
    typeColumn: 'Type',
    dateFormat: 'AUTO',
  });

  // Local overrides for row selection and category edits in preview
  const [rowOverrides, setRowOverrides] = useState<
    Record<number, { selected?: boolean; category?: string; type?: 'expense' | 'income' }>
  >({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Initialize templates and rules on mount
  useEffect(() => {
    if (isOpen) {
      const loadedTemplates = loadSavedBankTemplates();
      setTemplates(loadedTemplates);
      setCustomRules(loadLearnedMerchantRules());
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
      // Reset state on close
      setCsvContent('');
      setFileName('');
      setRowOverrides({});
      setIsMappingOpen(false);
      setIsSavingTemplate(false);
      setFilterMode('all');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('Please upload a valid .csv bank statement.', 'error');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      showToast('File size exceeds the 5MB limit. Please upload a smaller file.', 'error');
      return;
    }

    try {
      const text = await file.text();
      if (!text) {
        showToast('The uploaded file is empty.', 'error');
        return;
      }

      setCsvContent(text);
      setFileName(file.name);
      setRowOverrides({});

      // Auto-detect template from first line headers
      const lines = text.split(/\r?\n/);
      const headers = lines[0] ? lines[0].split(',').map((h) => h.replace(/^["'\s]+|["'\s]+$/g, '')) : [];
      const detected = detectBankTemplate(headers, templates);
      if (detected) {
        if (!templates.some((t) => t.id === detected.id)) {
          setTemplates((prev) => [...prev, detected]);
        }
        setSelectedTemplateId(detected.id);
        setMapping(detected.mapping);
        showToast(`Detected format: ${detected.name}`, 'info');
      }
    } catch {
      showToast('Failed to read the bank statement file.', 'error');
    }
  };

  // Change selected template
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      setMapping(tmpl.mapping);
    }
  };

  // Compute preview using merchant rules and column mapping
  const preview = useMemo(() => {
    if (!csvContent) {
      return {
        headers: [],
        rows: [],
        totalRows: 0,
        duplicateCount: 0,
        uncategorizedCount: 0,
        readyToImportCount: 0,
        totalIncome: 0,
        totalExpense: 0,
      };
    }

    const rawPreview = generateBankImportPreview({
      csvContent,
      mapping,
      existingTransactions,
      customRules,
    });

    // Apply user overrides in modal state
    const processedRows = rawPreview.rows.map((row) => {
      const override = rowOverrides[row.rowIndex];
      const selected = override?.selected !== undefined ? override.selected : row.selected;
      const category = override?.category !== undefined ? override.category : row.parsed.category;
      const type = override?.type !== undefined ? override.type : row.parsed.type;
      const isUncategorized = !category || category.toLowerCase() === 'uncategorized';

      return {
        ...row,
        selected,
        isUncategorized,
        parsed: {
          ...row.parsed,
          category,
          type,
        },
      };
    });

    let readyCount = 0;
    let incomePaise = 0;
    let expensePaise = 0;
    let uncatCount = 0;

    processedRows.forEach((r) => {
      if (r.selected) {
        readyCount += 1;
        if (r.parsed.type === 'income') incomePaise += r.parsed.amountPaise;
        else expensePaise += r.parsed.amountPaise;
      }
      if (r.isUncategorized && !r.isDuplicate) {
        uncatCount += 1;
      }
    });

    return {
      ...rawPreview,
      rows: processedRows,
      readyToImportCount: readyCount,
      uncategorizedCount: uncatCount,
      totalIncome: incomePaise / 100,
      totalExpense: expensePaise / 100,
    };
  }, [csvContent, mapping, existingTransactions, customRules, rowOverrides]);

  // Available headers from CSV for mapping dropdowns
  const availableHeaders = preview.headers;

  // Toggle selection for a single row
  const toggleRowSelected = (rowIndex: number) => {
    const current = preview.rows.find((r) => r.rowIndex === rowIndex);
    const newSelected = current ? !current.selected : true;
    setRowOverrides((prev) => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        selected: newSelected,
      },
    }));
  };

  // Select all / Deselect all
  const selectAll = (onlyValid = true) => {
    const newOverrides = { ...rowOverrides };
    preview.rows.forEach((r) => {
      if (onlyValid) {
        newOverrides[r.rowIndex] = { ...newOverrides[r.rowIndex], selected: !r.isDuplicate };
      } else {
        newOverrides[r.rowIndex] = { ...newOverrides[r.rowIndex], selected: true };
      }
    });
    setRowOverrides(newOverrides);
  };

  const deselectAll = () => {
    const newOverrides = { ...rowOverrides };
    preview.rows.forEach((r) => {
      newOverrides[r.rowIndex] = { ...newOverrides[r.rowIndex], selected: false };
    });
    setRowOverrides(newOverrides);
  };

  // Change category for a row and optionally learn a merchant rule
  const handleCategoryChange = (row: BankImportRowPreview, newCategory: string) => {
    setRowOverrides((prev) => ({
      ...prev,
      [row.rowIndex]: {
        ...prev[row.rowIndex],
        category: newCategory,
      },
    }));

    // Learn merchant rule automatically from description if merchant keyword can be extracted
    const words = row.parsed.description
      .replace(/[^A-Za-z0-9 ]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length >= 4);

    const keyword = words[0];
    if (keyword && !row.matchedRule) {
      const newRule: MerchantRule = {
        id: `learned_${Date.now()}_${keyword.toLowerCase()}`,
        pattern: keyword.toUpperCase(),
        category: newCategory,
        type: row.parsed.type,
      };
      const updatedRules = saveLearnedMerchantRule(newRule);
      setCustomRules(updatedRules);
      showToast(`Rule saved: Transactions containing "${keyword.toUpperCase()}" will auto-categorize as ${newCategory}.`, 'info');
    }
  };

  // Save current mapping as a reusable template
  const handleSaveCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      showToast('Please enter a template name.', 'error');
      return;
    }

    const template: BankTemplate = {
      id: `tmpl_${Date.now()}`,
      name: newTemplateName.trim(),
      mapping,
    };

    const updated = saveBankTemplate(template);
    setTemplates(updated);
    setSelectedTemplateId(template.id);
    setIsSavingTemplate(false);
    setNewTemplateName('');
    showToast(`Saved template "${template.name}".`, 'info');
  };

  // Final submit / import
  const handleCommitImport = async () => {
    const selectedRows = preview.rows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      showToast('No transactions selected for import.', 'error');
      return;
    }

    setIsImporting(true);
    try {
      const itemsToImport = selectedRows.map((r) => ({
        amount: r.parsed.amount,
        type: r.parsed.type,
        category: r.parsed.category,
        description: r.parsed.description,
        date: r.parsed.date,
        paymentMethod: r.parsed.paymentMethod,
      }));

      await onImportTransactions(itemsToImport);
      showToast(`Successfully imported ${itemsToImport.length} transactions from bank statement.`, 'info');
      onClose();
    } catch (err) {
      showToast(toUserFriendlyError(err, 'Failed to import bank statement transactions.'), 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Filtered rows for the preview table
  const displayedRows = useMemo(() => {
    return preview.rows.filter((r) => {
      if (filterMode === 'ready') return r.selected;
      if (filterMode === 'duplicates') return r.isDuplicate;
      if (filterMode === 'uncategorized') return r.isUncategorized;
      return true;
    });
  }, [preview.rows, filterMode]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bankImportTitle"
    >
      <m.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: EASING.standard }}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-surface border border-line-strong shadow-2 rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-surface">
          <div>
            <h2 id="bankImportTitle" className="font-display font-semibold text-lg text-ink flex items-center gap-2">
              <UploadIcon size={20} className="text-accent" />
              <span>Import Bank Statement</span>
              <Badge variant="accent" className="text-xs">DIFF-2</Badge>
            </h2>
            <p className="text-xs text-ink-3 mt-0.5">
              100% private and offline. Map columns once, preview duplicates, and auto-categorize with merchant rules.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors duration-fast focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close dialog"
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!csvContent ? (
            /* Upload State */
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-line-strong rounded-2xl p-8 sm:p-12 text-center bg-canvas hover:border-accent transition-colors duration-base">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="sr-only"
                id="bankCsvFileInput"
                aria-label="Select CSV file to import"
              />
              <div className="p-4 rounded-2xl bg-accent-tint text-accent mb-4">
                <UploadIcon size={32} />
              </div>
              <h3 className="font-display font-semibold text-base text-ink mb-1">
                Upload your bank statement CSV
              </h3>
              <p className="text-xs text-ink-3 max-w-md mb-5 leading-relaxed">
                Compatible with HDFC, SBI, ICICI, Axis, Kotak, and generic statement formats.
                Files never leave your device.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<UploadIcon size={16} />}
                >
                  Choose CSV File
                </Button>
              </div>
            </div>
          ) : (
            /* Loaded Statement Workspace */
            <div className="space-y-4">
              {/* Template & Mapping Toolbar */}
              <Card className="p-4 bg-canvas border border-line">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-ink-2">Bank Format:</span>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-surface border border-line rounded-btn text-ink focus:outline-none focus:ring-1 focus:ring-accent font-medium"
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>

                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      onClick={() => setIsMappingOpen((prev) => !prev)}
                      icon={isMappingOpen ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
                    >
                      {isMappingOpen ? 'Hide Column Mapping' : 'Customize Columns'}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-ink-3">
                    <span className="truncate max-w-[200px]" title={fileName}>
                      File: <strong>{fileName}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-accent hover:underline font-medium ml-1"
                    >
                      Replace
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </div>
                </div>

                {/* Collapsible Column Mapping Config */}
                <AnimatePresence>
                  {isMappingOpen && (
                    <m.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-line space-y-4 overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        {/* Date Column */}
                        <div>
                          <label className="block text-ink-2 font-medium mb-1">Date Column *</label>
                          <select
                            value={mapping.dateColumn}
                            onChange={(e) => setMapping((m) => ({ ...m, dateColumn: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-btn text-ink"
                          >
                            {availableHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        {/* Description Column */}
                        <div>
                          <label className="block text-ink-2 font-medium mb-1">Narration / Description *</label>
                          <select
                            value={mapping.descriptionColumn}
                            onChange={(e) => setMapping((m) => ({ ...m, descriptionColumn: e.target.value }))}
                            className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-btn text-ink"
                          >
                            {availableHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        {/* Date Format */}
                        <div>
                          <label className="block text-ink-2 font-medium mb-1">Date Format</label>
                          <select
                            value={mapping.dateFormat || 'AUTO'}
                            onChange={(e) =>
                              setMapping((m) => ({
                                ...m,
                                dateFormat: e.target.value as BankColumnMapping['dateFormat'],
                              }))
                            }
                            className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-btn text-ink"
                          >
                            <option value="AUTO">Auto Detect</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY (Indian Bank Standard)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY (US Standard)</option>
                          </select>
                        </div>

                        {/* Debit Column (Withdrawal) */}
                        <div>
                          <label className="block text-ink-2 font-medium mb-1">Debit Column (Withdrawal)</label>
                          <select
                            value={mapping.debitColumn || ''}
                            onChange={(e) => setMapping((m) => ({ ...m, debitColumn: e.target.value, amountColumn: '' }))}
                            className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-btn text-ink"
                          >
                            <option value="">-- None / Use Single Amount --</option>
                            {availableHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        {/* Credit Column (Deposit) */}
                        <div>
                          <label className="block text-ink-2 font-medium mb-1">Credit Column (Deposit)</label>
                          <select
                            value={mapping.creditColumn || ''}
                            onChange={(e) => setMapping((m) => ({ ...m, creditColumn: e.target.value, amountColumn: '' }))}
                            className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-btn text-ink"
                          >
                            <option value="">-- None / Use Single Amount --</option>
                            {availableHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>

                        {/* Or Single Amount Column */}
                        <div>
                          <label className="block text-ink-2 font-medium mb-1">Or Single Amount Column</label>
                          <select
                            value={mapping.amountColumn || ''}
                            onChange={(e) => setMapping((m) => ({ ...m, amountColumn: e.target.value, debitColumn: '', creditColumn: '' }))}
                            className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-btn text-ink"
                          >
                            <option value="">-- Use Debit & Credit Columns --</option>
                            {availableHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Save Template Prompt */}
                      <div className="flex items-center justify-between pt-2">
                        {!isSavingTemplate ? (
                          <button
                            type="button"
                            onClick={() => setIsSavingTemplate(true)}
                            className="text-xs text-accent hover:underline flex items-center gap-1 font-medium"
                          >
                            <SaveIcon size={13} />
                            <span>Save this column mapping as a reusable template</span>
                          </button>
                        ) : (
                          <form onSubmit={handleSaveCustomTemplate} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="e.g. My Bank Name"
                              value={newTemplateName}
                              onChange={(e) => setNewTemplateName(e.target.value)}
                              className="px-2.5 py-1 text-xs bg-surface border border-line rounded text-ink"
                              autoFocus
                            />
                            <Button type="submit" variant="secondary" size="md">Save</Button>
                            <Button type="button" variant="ghost" size="md" onClick={() => setIsSavingTemplate(false)}>Cancel</Button>
                          </form>
                        )}
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Statistics & Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface border border-line rounded-xl text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                      filterMode === 'all' ? 'bg-ink text-surface' : 'bg-surface-2 text-ink hover:bg-line'
                    }`}
                  >
                    All ({preview.totalRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode('ready')}
                    className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                      filterMode === 'ready' ? 'bg-income text-white' : 'bg-income-tint text-income hover:bg-income/20'
                    }`}
                  >
                    Selected ({preview.readyToImportCount})
                  </button>
                  {preview.duplicateCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterMode('duplicates')}
                      className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                        filterMode === 'duplicates' ? 'bg-ink-3 text-white' : 'bg-surface-2 text-ink-3 hover:bg-line'
                      }`}
                    >
                      Duplicates ({preview.duplicateCount})
                    </button>
                  )}
                  {preview.uncategorizedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterMode('uncategorized')}
                      className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                        filterMode === 'uncategorized' ? 'bg-warning text-white' : 'bg-warning-tint text-warning hover:bg-warning/20'
                      }`}
                    >
                      Uncategorized ({preview.uncategorizedCount})
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-ink-2 font-medium">
                    Total: <span className="text-income">+{formatCurrency(preview.totalIncome)}</span> /{' '}
                    <span className="text-danger">-{formatCurrency(preview.totalExpense)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => selectAll(true)}
                      className="text-xs text-accent hover:underline font-medium"
                    >
                      Select Valid
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-xs text-ink-3 hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Table Grid */}
              <div className="border border-line rounded-xl overflow-hidden bg-surface max-h-[360px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-canvas border-b border-line text-ink-3 font-medium sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={preview.readyToImportCount === preview.totalRows && preview.totalRows > 0}
                          onChange={(e) => {
                            if (e.target.checked) selectAll(false);
                            else deselectAll();
                          }}
                          className="rounded border-line"
                          aria-label="Select all rows"
                        />
                      </th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Description / Narration</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {displayedRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-ink-3">
                          No transactions found for the selected filter.
                        </td>
                      </tr>
                    ) : (
                      displayedRows.map((row) => (
                        <tr
                          key={row.rowIndex}
                          className={`hover:bg-surface-2 transition-colors ${
                            row.isDuplicate ? 'bg-surface-2/60 opacity-60' : ''
                          }`}
                        >
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={() => toggleRowSelected(row.rowIndex)}
                              className="rounded border-line"
                              aria-label={`Select transaction ${row.parsed.description}`}
                            />
                          </td>
                          <td className="py-2 px-3 font-mono text-ink-2 whitespace-nowrap">
                            {row.parsed.date || <span className="text-danger font-sans">Invalid date</span>}
                          </td>
                          <td className="py-2 px-3 text-ink max-w-[240px]">
                            <div className="truncate font-medium">{row.parsed.description}</div>
                            {row.matchedRule && (
                              <div className="text-[10px] text-accent flex items-center gap-1 mt-0.5">
                                <SparklesIcon size={10} />
                                <span>Rule: {row.matchedRule.pattern}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={row.parsed.category}
                              onChange={(e) => handleCategoryChange(row, e.target.value)}
                              className="px-2 py-1 bg-surface border border-line rounded text-xs text-ink focus:outline-none focus:ring-1 focus:ring-accent max-w-[150px]"
                            >
                              {row.parsed.type === 'income'
                                ? availableCategories.income.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))
                                : availableCategories.expense.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                              <option value="Uncategorized">Uncategorized</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap">
                            <span
                              className={`font-medium ${
                                row.parsed.type === 'income' ? 'text-income' : 'text-ink'
                              }`}
                            >
                              {row.parsed.type === 'income' ? '+' : '-'}
                              {formatCurrency(row.parsed.amount)}
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            {row.isDuplicate ? (
                              <Badge variant="neutral" className="text-[10px] bg-line text-ink-3">
                                Duplicate
                              </Badge>
                            ) : row.isUncategorized ? (
                              <Badge variant="warning" className="text-[10px]">
                                Uncategorized
                              </Badge>
                            ) : (
                              <Badge variant="income" className="text-[10px]">
                                Ready
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-line bg-surface">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          {csvContent && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-3">
                {preview.readyToImportCount} of {preview.totalRows} selected
              </span>
              <Button
                type="button"
                variant="primary"
                id="commitBankImportBtn"
                disabled={preview.readyToImportCount === 0 || isImporting}
                onClick={handleCommitImport}
                icon={<CheckIcon size={16} />}
              >
                {isImporting
                  ? 'Importing...'
                  : `Import ${preview.readyToImportCount} Transaction${preview.readyToImportCount === 1 ? '' : 's'}`}
              </Button>
            </div>
          )}
        </div>
      </m.div>
    </div>
  );
}
