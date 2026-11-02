export interface ProgressBarProps {
  value: number; // e.g. current spent
  max: number; // monthly limit
  thresholdPercent?: number; // e.g. 80
  className?: string;
  showLabels?: boolean;
}

export function ProgressBar({
  value,
  max,
  thresholdPercent = 80,
  className = '',
  showLabels = false,
}: ProgressBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const clampedScale = Math.min(Math.max(percentage / 100, 0), 1);

  // Status color
  const isOverLimit = percentage >= 100;
  const isAtThreshold = percentage >= thresholdPercent && !isOverLimit;

  const barColor = isOverLimit
    ? 'bg-danger'
    : isAtThreshold
    ? 'bg-warning'
    : 'bg-accent';

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {showLabels && (
        <div className="flex justify-between items-center text-caption font-medium">
          <span className="text-ink-2">
            ₹{value.toLocaleString('en-IN')} of ₹{max.toLocaleString('en-IN')}
          </span>
          <span
            className={`tabular-nums font-semibold ${
              isOverLimit ? 'text-danger' : isAtThreshold ? 'text-warning' : 'text-accent'
            }`}
          >
            {Math.round(percentage)}%
          </span>
        </div>
      )}

      {/* 8px Track */}
      <div className="relative h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-line/60">
        {/* Fill bar using transform: scaleX for fast performance */}
        <div
          className={`h-full w-full rounded-full origin-left transition-transform duration-chart ease-out ${barColor}`}
          style={{ transform: `scaleX(${clampedScale})` }}
        />

        {/* Threshold tick mark */}
        {thresholdPercent > 0 && thresholdPercent < 100 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-ink/30 z-10"
            style={{ left: `${thresholdPercent}%` }}
            title={`Threshold: ${thresholdPercent}%`}
          />
        )}
      </div>
    </div>
  );
}
