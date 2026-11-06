export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '₹0';
  return `₹${amount.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  })}`;
}

export function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatCalendarDate(
  dateStr: string,
  options?: {
    includeWeekday?: boolean;
    includeYear?: boolean;
    monthFormat?: 'short' | 'long';
  },
): string {
  if (!dateStr) return '';
  const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const parts = dateOnly.split('-');
  if (parts.length !== 3) return dateStr;

  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  // Use noon UTC to avoid any daylight saving or timezone boundary jump
  const date = new Date(Date.UTC(y, m, d, 12, 0, 0));
  if (isNaN(date.getTime())) return dateStr;

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const longMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const weekday = weekdays[date.getUTCDay()];
  const month = options?.monthFormat === 'long' ? longMonths[m] : shortMonths[m];
  const includeYear = options?.includeYear ?? true;
  const includeWeekday = options?.includeWeekday ?? true;

  if (includeWeekday && includeYear) {
    return `${weekday}, ${d} ${month} ${y}`;
  }
  if (includeWeekday && !includeYear) {
    return `${weekday}, ${d} ${month}`;
  }
  if (!includeWeekday && includeYear) {
    return `${d} ${month} ${y}`;
  }
  return `${d} ${month}`;
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return 'Select Date';
  return formatCalendarDate(dateStr, { includeWeekday: true, includeYear: true });
}
