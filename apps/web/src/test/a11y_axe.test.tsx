import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import axe from 'axe-core';
import {
  Button,
  TextInput,
  AmountInput,
  SegmentedControl,
  Dropdown,
  DatePicker,
  DayOfMonthPicker,
  Card,
  Badge,
  ProgressBar,
  Banner,
  EmptyState,
  Toast,
  ConfirmDialog,
} from '../components/ui';
import { WeeklyActivityChart } from '../components/dashboard/WeeklyActivityChart';

vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart" />,
  Doughnut: () => <div data-testid="mock-doughnut-chart" />,
  Line: () => <div data-testid="mock-line-chart" />,
}));

describe('A11y automated audit with axe-core (SPEC Section 3 & 7)', () => {
  it('Button passes axe accessibility checks', async () => {
    const { container } = render(
      <div>
        <Button variant="primary">Save Changes</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="danger">Delete Item</Button>
        <Button variant="ghost">Learn More</Button>
      </div>
    );
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('Form controls (TextInput, AmountInput) pass axe accessibility checks', async () => {
    const { container } = render(
      <form>
        <TextInput
          id="email-field"
          label="Email Address"
          value="user@example.com"
          onChange={() => {}}
        />
        <AmountInput
          id="amount-field"
          label="Transaction Amount"
          value="125000"
          onChange={() => {}}
        />
      </form>
    );
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('SegmentedControl passes axe accessibility checks', async () => {
    const { container } = render(
      <SegmentedControl
        name="test-segment"
        value="expense"
        onChange={() => {}}
        options={[
          { value: 'income', label: 'Income' },
          { value: 'expense', label: 'Expense' },
        ]}
      />
    );
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('Dropdown and Pickers pass axe accessibility checks', async () => {
    const { container } = render(
      <div>
        <Dropdown
          id="category-dropdown"
          label="Category"
          value="food"
          onChange={() => {}}
          options={[
            { value: 'food', label: 'Food & Dining' },
            { value: 'groceries', label: 'Groceries' },
          ]}
        />
        <DatePicker
          id="date-picker"
          label="Date"
          value="2026-11-02"
          onChange={() => {}}
        />
        <DayOfMonthPicker
          label="Autopay Day"
          value={15}
          onChange={() => {}}
        />
      </div>
    );
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('Card, Badge, ProgressBar, and Banner pass axe accessibility checks', async () => {
    const { container } = render(
      <div>
        <Card className="p-4">
          <Badge category="Food & Dining">Food & Dining</Badge>
          <ProgressBar value={75} max={100} label="Monthly Limit" />
        </Card>
        <Banner
          variant="warning"
          title="Spending Anomaly Detected"
          message="Higher than usual spending in Food & Dining"
        />
      </div>
    );
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('EmptyState passes axe accessibility checks', async () => {
    const { container } = render(
      <EmptyState
        title="No transactions yet"
        description="Add your first transaction to start tracking your finances."
        action={<Button variant="primary">Add Transaction</Button>}
      />
    );
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('Toast passes axe accessibility checks with role="status" and role="alert"', async () => {
    const { container } = render(
      <div>
        <Toast
          toast={{
            id: 't-1',
            type: 'success',
            message: 'Transaction saved successfully',
          }}
          onDismiss={() => {}}
        />
        <Toast
          toast={{
            id: 't-2',
            type: 'error',
            message: 'Network synchronization error',
          }}
          onDismiss={() => {}}
        />
      </div>
    );
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('ConfirmDialog passes axe accessibility checks with proper dialog roles', async () => {
    const { container } = render(
      <ConfirmDialog
        isOpen={true}
        title="Confirm Plan Deletion"
        message="Are you sure you want to permanently remove this autopay plan?"
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });

  it('WeeklyActivityChart accessible data table passes axe accessibility checks', async () => {
    const { container } = render(
      <WeeklyActivityChart
        transactions={[
          {
            id: '1',
            type: 'expense',
            amount: 500,
            category: 'Food',
            description: 'Lunch',
            paymentMethod: 'card',
            date: '2026-11-02',
          },
          {
            id: '2',
            type: 'income',
            amount: 25000,
            category: 'Salary',
            description: 'Monthly Salary',
            paymentMethod: 'bank_transfer',
            date: '2026-11-01',
          },
        ]}
      />
    );
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
