type ProgressProps = Readonly<{
  ariaLabel?: string;
  label: string;
  max?: number;
  value: number;
  valueLabel?: string;
}>;

export function Progress({
  ariaLabel,
  label,
  max = 100,
  value,
  valueLabel,
}: ProgressProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Math.min(
    Math.max(Number.isFinite(value) ? value : 0, 0),
    safeMax,
  );
  const percentage = Math.round((safeValue / safeMax) * 100);

  return (
    <div className="ui-progress">
      <div className="ui-progress__heading">
        <strong>{label}</strong>
        <span>{valueLabel ?? `${percentage}%`}</span>
      </div>
      <progress
        aria-label={ariaLabel ?? label}
        max={safeMax}
        value={safeValue}
      />
    </div>
  );
}
