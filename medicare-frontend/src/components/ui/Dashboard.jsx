import { cn } from '@/lib/utils';

/**
 * Dashboard chrome — StatCard for metric tiles and PageHeader for the
 * title block at the top of a dashboard screen.
 */

// --- StatCard -------------------------------------------------------
export function StatCard({ icon: Icon, label, value, hint, tone = 'pine' }) {
  const tones = {
    pine: 'bg-pine-100 text-pine-700',
    clay: 'bg-clay-100 text-clay-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-sky-100 text-sky-700',
  };
  return (
    <div className="rounded-2xl border border-paper-200 bg-paper-50 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-paper-500">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-semibold text-pine-900">
            {value}
          </p>
        </div>
        {Icon && (
          <div className={cn('rounded-xl p-2.5', tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {hint && <p className="mt-2 text-xs text-paper-500">{hint}</p>}
    </div>
  );
}

// --- StatGrid -------------------------------------------------------
export function StatGrid({ children, className }) {
  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}

// --- PageHeader -----------------------------------------------------
export function PageHeader({ title, subtitle, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-semibold text-pine-900">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-paper-600">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
