import { cn } from '@/lib/utils';

/**
 * MiniBarChart — a lightweight, dependency-free horizontal bar chart
 * for dashboard analytics. Each item is { label, value }.
 */
export function MiniBarChart({ items = [], valueFormat = (v) => v }) {
  if (!items.length) {
    return (
      <p className="py-8 text-center text-sm text-paper-500">
        No data for this period.
      </p>
    );
  }
  const max = Math.max(...items.map((i) => i.value || 0), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-paper-600">{item.label}</span>
            <span className="font-semibold text-pine-900">
              {valueFormat(item.value)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-paper-200">
            <div
              className="h-full rounded-full bg-pine-600"
              style={{ width: `${((item.value || 0) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * DonutStat — a single proportion shown as a donut, e.g. no-show rate.
 */
export function DonutStat({ percent = 0, label, tone = 'pine' }) {
  const tones = {
    pine: '#2b604f',
    clay: '#c25e3a',
    amber: '#d97706',
  };
  const safe = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative h-28 w-28 rounded-full"
        style={{
          background: `conic-gradient(${tones[tone]} ${safe * 3.6}deg, #ece7dc 0deg)`,
        }}
      >
        <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-paper-50">
          <span className="font-display text-xl font-semibold text-pine-900">
            {safe.toFixed(0)}%
          </span>
        </div>
      </div>
      {label && (
        <p className="mt-2 text-sm text-paper-600">{label}</p>
      )}
    </div>
  );
}

/**
 * TrendList — a labelled list of metric rows, optionally with a tone.
 */
export function TrendList({ rows = [] }) {
  return (
    <div className="divide-y divide-paper-100">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between py-2.5"
        >
          <span className="text-sm text-paper-600">{row.label}</span>
          <span
            className={cn(
              'text-sm font-semibold',
              row.tone === 'up' && 'text-emerald-600',
              row.tone === 'down' && 'text-clay-600',
              !row.tone && 'text-pine-900'
            )}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
