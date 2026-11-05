import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LazyMotion, domAnimation } from 'motion/react';

import {
  Button,
  TextInput,
  AmountInput,
  formatIndianGrouping,
  parseIndianGrouping,
  getCategoryBadgeColor,
  CATEGORY_PALETTE,
  SegmentedControl,
  Dropdown,
  DatePicker,
  DayOfMonthPicker,
  Card,
  Badge,
  ProgressBar,
  Skeleton,
  Banner,
  EmptyState,
  Toast,
  ConfirmDialog,
} from '../components/ui';

function renderWithMotion(ui: React.ReactElement) {
  return render(
    <LazyMotion features={domAnimation} strict>
      {ui}
    </LazyMotion>
  );
}

describe('Redesigned UI Primitives (Phase 2)', () => {
  /* ==========================================================================
     1. Pure Function: formatIndianGrouping & parseIndianGrouping
     ========================================================================== */
  describe('formatIndianGrouping & parseIndianGrouping', () => {
    it('formats small integers without grouping', () => {
      expect(formatIndianGrouping('')).toBe('');
      expect(formatIndianGrouping('0')).toBe('0');
      expect(formatIndianGrouping('5')).toBe('5');
      expect(formatIndianGrouping('99')).toBe('99');
      expect(formatIndianGrouping('999')).toBe('999');
    });

    it('formats numbers with Indian comma groupings (last 3, then groups of 2)', () => {
      expect(formatIndianGrouping('1000')).toBe('1,000');
      expect(formatIndianGrouping('12345')).toBe('12,345');
      expect(formatIndianGrouping('125000')).toBe('1,25,000');
      expect(formatIndianGrouping('1234567')).toBe('12,34,567');
      expect(formatIndianGrouping('12345678')).toBe('1,23,45,678');
      expect(formatIndianGrouping(10000000)).toBe('1,00,00,000');
    });

    it('preserves decimals and allows typing trailing dots', () => {
      expect(formatIndianGrouping('125000.')).toBe('1,25,000.');
      expect(formatIndianGrouping('125000.5')).toBe('1,25,000.5');
      expect(formatIndianGrouping('125000.50')).toBe('1,25,000.50');
      expect(formatIndianGrouping('.5')).toBe('0.5');
    });

    it('accepts pasted values with or without commas and cleans extra characters', () => {
      expect(formatIndianGrouping('1,25,000')).toBe('1,25,000');
      expect(formatIndianGrouping('1,2,5,0,0,0')).toBe('1,25,000');
      expect(formatIndianGrouping('₹1,25,000')).toBe('1,25,000');
    });

    it('handles negative amounts', () => {
      expect(formatIndianGrouping('-125000')).toBe('-1,25,000');
    });

    it('parses Indian grouped string into float correctly', () => {
      expect(parseIndianGrouping('1,25,000')).toBe(125000);
      expect(parseIndianGrouping('1,25,000.75')).toBe(125000.75);
      expect(parseIndianGrouping('')).toBe(0);
      expect(parseIndianGrouping('invalid')).toBe(0);
    });
  });

  /* ==========================================================================
     2. Pure Function: getCategoryBadgeColor
     ========================================================================== */
  describe('getCategoryBadgeColor (SPEC Section 3)', () => {
    it('returns a stable deterministic color palette for a category', () => {
      const color1 = getCategoryBadgeColor('Groceries');
      const color2 = getCategoryBadgeColor('Groceries');
      expect(color1).toEqual(color2);
      expect(color1.tint).toBeDefined();
      expect(color1.ink).toBeDefined();
    });

    it('is case-insensitive and trims whitespace', () => {
      const colorLower = getCategoryBadgeColor('food & dining');
      const colorUpper = getCategoryBadgeColor('  FOOD & DINING  ');
      expect(colorLower).toEqual(colorUpper);
    });

    it('maps across the 8 SPEC color palettes', () => {
      expect(CATEGORY_PALETTE).toHaveLength(8);
      const paletteNames = CATEGORY_PALETTE.map((p) => p.name);
      expect(paletteNames).toContain('terracotta');
      expect(paletteNames).toContain('olive');
      expect(paletteNames).toContain('teal');
      expect(paletteNames).toContain('rose');
      expect(paletteNames).toContain('sand');
      expect(paletteNames).toContain('sky');
      expect(paletteNames).toContain('moss');
      expect(paletteNames).toContain('slate');
    });

    it('defaults to slate on empty input', () => {
      const emptyColor = getCategoryBadgeColor('');
      expect(emptyColor.name).toBe('slate');
    });
  });

  /* ==========================================================================
     3. Button Component
     ========================================================================== */
  describe('Button', () => {
    it('renders different variants and sizes', () => {
      const { rerender } = renderWithMotion(<Button variant="primary">Submit</Button>);
      expect(screen.getByRole('button', { name: 'Submit' })).toHaveClass('bg-accent');

      rerender(
        <LazyMotion features={domAnimation} strict>
          <Button variant="danger" size="lg">
            Delete
          </Button>
        </LazyMotion>
      );
      const dangerBtn = screen.getByRole('button', { name: 'Delete' });
      expect(dangerBtn).toHaveClass('bg-danger');
      expect(dangerBtn).toHaveClass('h-11');
    });

    it('handles loading state by disabling button, locking width, and showing spinner', () => {
      const handleClick = vi.fn();
      renderWithMotion(
        <Button loading onClick={handleClick}>
          Save Transaction
        </Button>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();

      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('handles disabled state preventing clicks', () => {
      const handleClick = vi.fn();
      renderWithMotion(
        <Button disabled onClick={handleClick}>
          Disabled Button
        </Button>
      );

      const button = screen.getByRole('button', { name: 'Disabled Button' });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-45');

      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  /* ==========================================================================
     4. TextInput and AmountInput
     ========================================================================== */
  describe('TextInput & AmountInput', () => {
    it('TextInput renders label above and displays error message with role="alert"', () => {
      renderWithMotion(
        <TextInput
          label="Account Holder"
          id="holder"
          error="Name is required"
          defaultValue="John"
        />
      );

      expect(screen.getByLabelText('Account Holder')).toBeInTheDocument();
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Name is required');
      expect(alert).toHaveClass('text-danger');
    });

    it('AmountInput renders ₹ prefix, live grouping, and handles input changes', () => {
      const handleChange = vi.fn();
      renderWithMotion(
        <AmountInput
          label="Transaction Amount"
          value="125000"
          onChange={handleChange}
        />
      );

      expect(screen.getByText('₹')).toBeInTheDocument();
      const input = screen.getByLabelText('Transaction Amount') as HTMLInputElement;
      expect(input.value).toBe('1,25,000');

      fireEvent.change(input, { target: { value: '250000' } });
      expect(handleChange).toHaveBeenCalledWith('2,50,000', 250000);
    });

    it('AmountInput handles pasted values with commas', () => {
      const handleChange = vi.fn();
      renderWithMotion(
        <AmountInput
          label="Pasted Amount"
          value=""
          onChange={handleChange}
        />
      );

      const input = screen.getByLabelText('Pasted Amount');
      fireEvent.paste(input, {
        clipboardData: { getData: () => '1,25,000' },
      });

      expect(handleChange).toHaveBeenCalledWith('1,25,000', 125000);
    });

    it('AmountInput supports in-line math expressions (+, -, *, /, x) with live preview badge', () => {
      const handleChange = vi.fn();
      const { rerender } = renderWithMotion(
        <AmountInput
          label="Math Amount"
          value="100 + 200 + 300"
          onChange={handleChange}
        />
      );

      // Verify live preview badge is shown
      const badge = screen.getByTestId('math-preview-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('=₹600');

      // Test input change event with expression
      const input = screen.getByLabelText('Math Amount') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '50 * 3 + 25' } });
      expect(handleChange).toHaveBeenCalledWith('50 * 3 + 25', 175);

      // Re-render with new value to verify badge updates
      rerender(
        <AmountInput
          label="Math Amount"
          value="50 * 3 + 25"
          onChange={handleChange}
        />
      );
      expect(screen.getByTestId('math-preview-badge')).toHaveTextContent('=₹175');
    });

    it('AmountInput resolves math expression to calculated total on blur and on Enter/=', () => {
      const handleChange = vi.fn();
      renderWithMotion(
        <AmountInput
          label="Resolve Amount"
          value="1000 - 250"
          onChange={handleChange}
        />
      );

      const input = screen.getByLabelText('Resolve Amount');

      // Blur should resolve to 750
      fireEvent.blur(input);
      expect(handleChange).toHaveBeenCalledWith('750', 750);

      // KeyDown '=' should resolve
      fireEvent.keyDown(input, { key: '=' });
      expect(handleChange).toHaveBeenCalledWith('750', 750);

      // KeyDown 'Enter' should resolve
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(handleChange).toHaveBeenCalledWith('750', 750);
    });
  });

  /* ==========================================================================
     5. SegmentedControl
     ========================================================================== */
  describe('SegmentedControl', () => {
    const options = [
      { value: 'expense', label: 'Expense' },
      { value: 'income', label: 'Income' },
    ];

    it('renders role radiogroup with accessible radio items', () => {
      const handleChange = vi.fn();
      renderWithMotion(
        <SegmentedControl
          options={options}
          value="expense"
          onChange={handleChange}
        />
      );

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toBeInTheDocument();

      const expenseRadio = screen.getByRole('radio', { name: 'Expense' });
      const incomeRadio = screen.getByRole('radio', { name: 'Income' });

      expect(expenseRadio).toHaveAttribute('aria-checked', 'true');
      expect(incomeRadio).toHaveAttribute('aria-checked', 'false');
    });

    it('supports arrow key navigation (Right/Left) and triggers onChange', () => {
      const handleChange = vi.fn();
      renderWithMotion(
        <SegmentedControl
          options={options}
          value="expense"
          onChange={handleChange}
        />
      );

      const radiogroup = screen.getByRole('radiogroup');
      fireEvent.keyDown(radiogroup, { key: 'ArrowRight' });
      expect(handleChange).toHaveBeenCalledWith('income');

      fireEvent.keyDown(radiogroup, { key: 'ArrowLeft' });
      expect(handleChange).toHaveBeenCalledWith('income');
    });
  });

  /* ==========================================================================
     6. Dropdown (Keyboard, Home, End, Type-ahead, Escape & Focus Return)
     ========================================================================== */
  describe('Dropdown', () => {
    const options = [
      { value: 'groceries', label: 'Groceries' },
      { value: 'entertainment', label: 'Entertainment' },
      { value: 'utilities', label: 'Utilities' },
    ];

    it('opens on click and selects an option, returning focus to trigger', () => {
      const handleChange = vi.fn();
      renderWithMotion(
        <Dropdown
          label="Category"
          value=""
          onChange={handleChange}
          options={options}
          placeholder="Select category"
        />
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      const option = screen.getByRole('option', { name: /entertainment/i });
      fireEvent.click(option);

      expect(handleChange).toHaveBeenCalledWith('entertainment');
      expect(document.activeElement).toBe(trigger);
    });

    it('closes on Escape and returns focus to trigger', () => {
      renderWithMotion(
        <Dropdown
          label="Category"
          value="groceries"
          onChange={vi.fn()}
          options={options}
        />
      );

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      // Press Escape on option
      const option = screen.getByRole('option', { name: /groceries/i });
      fireEvent.keyDown(option, { key: 'Escape' });

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(document.activeElement).toBe(trigger);
    });

    it('supports ArrowDown, ArrowUp, Home, End, and type-ahead keyboard navigation', () => {
      const handleChange = vi.fn();
      renderWithMotion(
        <Dropdown
          label="Category"
          value="groceries"
          onChange={handleChange}
          options={options}
        />
      );

      const trigger = screen.getByRole('combobox');
      // Open with ArrowDown
      fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      const optGroceries = screen.getByRole('option', { name: /groceries/i });
      const optEntertainment = screen.getByRole('option', { name: /entertainment/i });
      const optUtilities = screen.getByRole('option', { name: /utilities/i });

      // Navigate down
      fireEvent.keyDown(optGroceries, { key: 'ArrowDown' });
      expect(document.activeElement).toBe(optEntertainment);

      // Navigate to End
      fireEvent.keyDown(optEntertainment, { key: 'End' });
      expect(document.activeElement).toBe(optUtilities);

      // Navigate to Home
      fireEvent.keyDown(optUtilities, { key: 'Home' });
      expect(document.activeElement).toBe(optGroceries);

      // Type-ahead jump: 'u' for Utilities
      fireEvent.keyDown(optGroceries, { key: 'u' });
      expect(document.activeElement).toBe(optUtilities);

      // Select with Enter
      fireEvent.keyDown(optUtilities, { key: 'Enter' });
      expect(handleChange).toHaveBeenCalledWith('utilities');
    });
  });

  /* ==========================================================================
     7. DatePicker (Quick Chips, Escape & Focus Return)
     ========================================================================== */
  describe('DatePicker', () => {
    it('toggles calendar dialog on click and selects Today chip', () => {
      const handleChange = vi.fn();
      renderWithMotion(
        <DatePicker
          label="Date"
          value=""
          onChange={handleChange}
        />
      );

      const trigger = screen.getByRole('button', { name: /select date/i });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('dialog', { name: 'Calendar' })).toBeInTheDocument();

      // Click "Today" quick chip
      const todayChip = screen.getByRole('button', { name: 'Today' });
      fireEvent.click(todayChip);

      expect(handleChange).toHaveBeenCalled();
      const calledDate = handleChange.mock.calls[0][0];
      const now = new Date();
      const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      expect(calledDate).toBe(todayIso);
      expect(document.activeElement).toBe(trigger);
    });

    it('selects Yesterday chip', () => {
      const handleChange = vi.fn();
      renderWithMotion(
        <DatePicker
          value="2026-11-02"
          onChange={handleChange}
        />
      );

      const trigger = screen.getByRole('button', { name: /Nov 2, 2026|Select Date/i });
      fireEvent.click(trigger);

      const yesterdayChip = screen.getByRole('button', { name: 'Yesterday' });
      fireEvent.click(yesterdayChip);

      expect(handleChange).toHaveBeenCalled();
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yesterdayIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      expect(handleChange.mock.calls[0][0]).toBe(yesterdayIso);
    });

    it('closes on Escape and returns focus to trigger', () => {
      renderWithMotion(
        <DatePicker
          value="2026-11-02"
          onChange={vi.fn()}
        />
      );

      const trigger = screen.getByRole('button', { name: /Nov 2, 2026|Select Date/i });
      fireEvent.click(trigger);
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      fireEvent.keyDown(trigger, { key: 'Escape' });
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(document.activeElement).toBe(trigger);
    });
  });

  /* ==========================================================================
     8. DayOfMonthPicker
     ========================================================================== */
  describe('DayOfMonthPicker', () => {
    it('renders 1-31 grid and selects day', () => {
      const handleChange = vi.fn();
      renderWithMotion(
        <DayOfMonthPicker
          label="Billing Day"
          value={15}
          onChange={handleChange}
        />
      );

      const trigger = screen.getByRole('button', { name: /billing day/i });
      expect(trigger).toHaveTextContent('15th of the month');

      fireEvent.click(trigger);

      const day5 = screen.getByRole('button', { name: '5' });
      fireEvent.click(day5);

      expect(handleChange).toHaveBeenCalledWith(5);
    });

    it('handles Last Day toggle', () => {
      const handleChange = vi.fn();
      renderWithMotion(
        <DayOfMonthPicker
          value=""
          onChange={handleChange}
        />
      );

      const trigger = screen.getByRole('button', { name: /select day of month/i });
      fireEvent.click(trigger);

      const lastDayBtn = screen.getByRole('button', { name: /last day of month/i });
      fireEvent.click(lastDayBtn);

      expect(handleChange).toHaveBeenCalledWith('last');
    });
  });

  /* ==========================================================================
     9. ConfirmDialog (Backdrop, Escape, Focus Trap & Safe Button Focus)
     ========================================================================== */
  describe('ConfirmDialog', () => {
    it('opens dialog, focuses safe Cancel button first, and closes on Escape', () => {
      const handleConfirm = vi.fn();
      const handleCancel = vi.fn();

      renderWithMotion(
        <ConfirmDialog
          isOpen
          title="Delete Transaction?"
          message="This action cannot be undone."
          variant="danger"
          confirmText="Delete"
          cancelText="Keep"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete Transaction?')).toBeInTheDocument();

      // Escape triggers onCancel
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when confirming', () => {
      const handleConfirm = vi.fn();
      const handleCancel = vi.fn();

      renderWithMotion(
        <ConfirmDialog
          isOpen
          title="Confirm Save"
          message="Save these updates?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );

      const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('traps focus within modal dialog on Tab', () => {
      renderWithMotion(
        <ConfirmDialog
          isOpen
          title="Test Trap"
          message="Focus Trap Test"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      expect(focusable.length).toBeGreaterThan(1);

      const firstBtn = focusable[0];
      const lastBtn = focusable[focusable.length - 1];

      // Tab on last element should wrap to first
      lastBtn.focus();
      expect(document.activeElement).toBe(lastBtn);

      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement).toBe(firstBtn);

      // Shift+Tab on first element should wrap to last
      firstBtn.focus();
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(lastBtn);
    });
  });

  /* ==========================================================================
     10. Toast (Timer, Pause on Hover & Focus, Close button)
     ========================================================================== */
  describe('Toast', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('renders toast with role="status", dismisses after duration', () => {
      const handleDismiss = vi.fn();
      renderWithMotion(
        <Toast
          toast={{
            id: 't-1',
            type: 'success',
            message: 'Transaction added successfully',
            duration: 3000,
          }}
          onDismiss={handleDismiss}
        />
      );

      expect(screen.getByRole('status')).toHaveTextContent('Transaction added successfully');

      // Advance time by 3050ms
      act(() => {
        vi.advanceTimersByTime(3050);
      });

      expect(handleDismiss).toHaveBeenCalledWith('t-1');
    });

    it('pauses timer on hover and resumes on mouse leave', () => {
      const handleDismiss = vi.fn();
      renderWithMotion(
        <Toast
          toast={{
            id: 't-2',
            type: 'info',
            message: 'Syncing with server...',
            duration: 2000,
          }}
          onDismiss={handleDismiss}
        />
      );

      const toastEl = screen.getByRole('status');

      // Advance 1000ms
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(handleDismiss).not.toHaveBeenCalled();

      // Mouse enter -> pause
      fireEvent.mouseEnter(toastEl);

      // Advance 2500ms while hovered
      act(() => {
        vi.advanceTimersByTime(2500);
      });
      expect(handleDismiss).not.toHaveBeenCalled();

      // Mouse leave -> resume
      fireEvent.mouseLeave(toastEl);

      // Advance remaining ~1050ms
      act(() => {
        vi.advanceTimersByTime(1100);
      });
      expect(handleDismiss).toHaveBeenCalledWith('t-2');
    });

    it('pauses timer on focus and resumes on blur', () => {
      const handleDismiss = vi.fn();
      renderWithMotion(
        <Toast
          toast={{
            id: 't-3',
            type: 'error',
            message: 'Failed to delete transaction',
            duration: 2000,
          }}
          onDismiss={handleDismiss}
        />
      );

      const toastEl = screen.getByRole('alert'); // error has role="alert"

      // Focus -> pause
      fireEvent.focus(toastEl);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(handleDismiss).not.toHaveBeenCalled();

      // Blur -> resume
      fireEvent.blur(toastEl);
      act(() => {
        vi.advanceTimersByTime(2100);
      });
      expect(handleDismiss).toHaveBeenCalledWith('t-3');
    });

    it('dismisses immediately when close button is clicked', () => {
      const handleDismiss = vi.fn();
      renderWithMotion(
        <Toast
          toast={{
            id: 't-4',
            type: 'warning',
            message: 'Approaching limit',
            duration: 5000,
          }}
          onDismiss={handleDismiss}
        />
      );

      const closeBtn = screen.getByRole('button', { name: /close notification/i });
      fireEvent.click(closeBtn);
      expect(handleDismiss).toHaveBeenCalledWith('t-4');
    });
  });

  /* ==========================================================================
     11. Other Primitives (Card, Badge, ProgressBar, Skeleton, Banner, EmptyState)
     ========================================================================== */
  describe('Card, Badge, ProgressBar, Skeleton, Banner, EmptyState', () => {
    it('Card renders children and supports interactive hover styling', () => {
      const { rerender } = renderWithMotion(<Card>Static Content</Card>);
      expect(screen.getByText('Static Content')).toBeInTheDocument();

      const handleClick = vi.fn();
      rerender(
        <LazyMotion features={domAnimation} strict>
          <Card interactive onClick={handleClick}>
            Clickable Card
          </Card>
        </LazyMotion>
      );
      const interactiveCard = screen.getByRole('button', { name: 'Clickable Card' });
      fireEvent.click(interactiveCard);
      expect(handleClick).toHaveBeenCalled();
    });

    it('Badge renders category and variants', () => {
      renderWithMotion(
        <>
          <Badge category="Food">Food</Badge>
          <Badge variant="income">+₹5,000</Badge>
          <Badge variant="danger">Over budget</Badge>
        </>
      );
      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('+₹5,000')).toBeInTheDocument();
      expect(screen.getByText('Over budget')).toBeInTheDocument();
    });

    it('ProgressBar renders 3-colour logic and threshold tick', () => {
      const { rerender, container } = renderWithMotion(
        <ProgressBar value={50} max={100} threshold={0.8} showLabel />
      );
      expect(container.querySelector('.bg-accent')).not.toBeNull();

      // Above threshold (warning)
      rerender(
        <LazyMotion features={domAnimation} strict>
          <ProgressBar value={85} max={100} threshold={0.8} showLabel />
        </LazyMotion>
      );
      expect(container.querySelector('.bg-warning')).not.toBeNull();

      // Over limit (danger)
      rerender(
        <LazyMotion features={domAnimation} strict>
          <ProgressBar value={120} max={100} threshold={0.8} showLabel />
        </LazyMotion>
      );
      expect(container.querySelector('.bg-danger')).not.toBeNull();
    });

    it('Skeleton renders with aria-label="Loading content"', () => {
      renderWithMotion(<Skeleton variant="rectangular" width={200} height={40} />);
      expect(screen.getByRole('status', { name: 'Loading content' })).toBeInTheDocument();
    });

    it('Banner renders message, variant, and action buttons', () => {
      const handleApprove = vi.fn();
      renderWithMotion(
        <Banner
          variant="warning"
          title="Unusual Transaction Detected"
          message="₹12,500 spent in Electronics"
          actions={<button onClick={handleApprove}>Approve</button>}
        />
      );
      expect(screen.getByRole('alert')).toHaveTextContent('Unusual Transaction Detected');
      fireEvent.click(screen.getByText('Approve'));
      expect(handleApprove).toHaveBeenCalled();
    });

    it('EmptyState renders title, description, and action button', () => {
      renderWithMotion(
        <EmptyState
          title="No transactions yet"
          description="Add your first expense or income to begin tracking."
          action={<Button>Add Transaction</Button>}
        />
      );
      expect(screen.getByText('No transactions yet')).toBeInTheDocument();
      expect(screen.getByText('Add your first expense or income to begin tracking.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Transaction' })).toBeInTheDocument();
    });
  });
});
