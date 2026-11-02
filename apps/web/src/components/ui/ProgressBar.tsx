import { formatIndianGrouping } from './formatIndianGrouping';

export interface ProgressBarProps {
  value: number; // e.g. current spent amount or percentage
  max?: number;   // e.g. budget limit (defaults to 100)
  threshold?: number; // e.g. 0.80 for 80% (defaults to 0.8)
  showLabel?: boolean;
  label?: string;
  className?: string;
}

/**
 * ProgressBar Primitive (SPEC Section 4 & 5)
 * 8px track, scaleX fill animation over 600ms, threshold tick mark,
 * and three-colour behavior (--accent below threshold, --warning at threshold, --danger over limit).
 */
export function ProgressBar({
  value,
  max = 100,
  threshold = 0.8,
  showLabel = false,
  label,
  className = '',
}: ProgressBarProps) {
  const safeMax = max <= 0 ? 1 : max;
  const percentage = Math.max(0, (value / safeMax) * 100);
  const clampedScale = Math.min(percentage / 100, 1);
  const thresholdPercent = threshold > 1 ? threshold : threshold * 100;

  // Three-color logic from SPEC Section 5:
  // - below threshold: --accent
  // - at or above threshold, up to 100%: --warning
  // - over limit (> 100%): --danger
  let barColor = 'bg-accent';
  let textColor = 'text-ink';

  if (percentage > 100) {
    barColor = 'bg-danger';
    textColor = 'text-danger font-semibold';
  } else if (percentage >= thresholdPercent) {
    barColor = 'bg-warning';
    textColor = 'text-warning font-semibold';
  }

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-sans">
          <span className="text-ink-2 font-medium">{label || 'Budget Progress'}</span>
          <span className={textColor}>
            <span className="tabular-nums">₹{formatIndianGrouping(value)}</span> of{' '}
            <span className="tabular-nums">₹{formatIndianGrouping(max)}</span> ({Math.round(percentage)}%)
          </span>
        </div>
      )}

      {/* 8px Track */}
      <div
        role="progressbar"
        aria-label={label || 'Budget progress'}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={max}
        className="relative h-2 w-full rounded-full bg-surface-2 overflow-visible border border-line/60"
      >
        {/* ScaleX fill bar with transform-origin: left */}
        <div
          className={`h-full w-full rounded-full ${barColor} transition-transform duration-chart ease-standard`}
          style={{
            transform: `scaleX(${clampedScale})`,
            transformOrigin: 'left center',
          }}
        />

        {/* Threshold tick indicator */}
        {thresholdPercent > 0 && thresholdPercent < 100 && (
          <div
            title={`Threshold: ${Math.round(thresholdPercent)}%`}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-0.5 h-3.5 bg-ink-2/80 rounded-full z-10 pointer-events-none"
            style={{ left: `${thresholdPercent}%` }}
          />
        )}
      </div>
    </div>
  );
}

export default ProgressBar;
