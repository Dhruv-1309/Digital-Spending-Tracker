import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomSelect } from '../components/common/CustomSelect';
import { CustomDatePicker } from '../components/common/CustomDatePicker';
import { AutopayDayPicker } from '../components/common/AutopayDayPicker';

describe('UI Primitives', () => {
  describe('CustomSelect', () => {
    const options = [
      { value: 'income', label: 'Income' },
      { value: 'expense', label: 'Expense' },
    ];

    it('renders with placeholder or initial value', () => {
      const onChange = vi.fn();
      render(
        <CustomSelect
          value=""
          onChange={onChange}
          options={options}
          placeholder="Select Type"
        />,
      );

      expect(screen.getByText('Select Type')).toBeInTheDocument();
    });

    it('opens on click and calls onChange when option selected', () => {
      const onChange = vi.fn();
      const { container } = render(
        <CustomSelect
          value="income"
          onChange={onChange}
          options={options}
        />,
      );

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeInTheDocument();
      fireEvent.click(trigger);

      const expenseOption = container.querySelector('.custom-option[data-value="expense"]');
      expect(expenseOption).not.toBeNull();
      fireEvent.click(expenseOption!);

      expect(onChange).toHaveBeenCalledWith('expense');
    });
  });

  describe('CustomDatePicker', () => {
    it('displays selected date or placeholder', () => {
      const onChange = vi.fn();
      render(<CustomDatePicker value="" onChange={onChange} />);
      expect(screen.getByText('Select Date')).toBeInTheDocument();
    });

    it('toggles dropdown and selects a date', () => {
      const onChange = vi.fn();
      render(<CustomDatePicker value="2026-10-15" onChange={onChange} />);

      const trigger = screen.getByRole('button', { name: /open date picker/i });
      fireEvent.click(trigger);

      // Should show weekday header
      expect(screen.getByText('Mo')).toBeInTheDocument();
    });
  });

  describe('AutopayDayPicker', () => {
    it('renders input with day or placeholder', () => {
      const onChange = vi.fn();
      render(<AutopayDayPicker value="" onChange={onChange} />);

      const input = screen.getByPlaceholderText('Select day (1-31)');
      expect(input).toBeInTheDocument();
    });

    it('updates value on change', () => {
      const onChange = vi.fn();
      render(<AutopayDayPicker value={15} onChange={onChange} />);

      const input = screen.getByPlaceholderText('Select day (1-31)') as HTMLInputElement;
      expect(input.value).toBe('15');

      fireEvent.change(input, { target: { value: '20' } });
      expect(onChange).toHaveBeenCalledWith(20);
    });
  });
});
