import { cn } from '@/lib/utils';
import { Loader2, Inbox } from 'lucide-react';

/**
 * Surface and presentational primitives.
 */

// --- Card -----------------------------------------------------------
export function Card({ className, children, as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-paper-200 bg-paper-50 shadow-soft',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('p-5 sm:p-6', className)}>{children}</div>;
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-paper-200 p-5 sm:p-6',
        className
      )}
    >
      <div>
        <h3 className="text-lg font-semibold text-pine-900">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-paper-500">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// --- Badge ----------------------------------------------------------
const BADGE_TONES = {
  neutral: 'bg-paper-200 text-paper-700',
  pine: 'bg-pine-100 text-pine-700',
  clay: 'bg-clay-100 text-clay-700',
  green: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-sky-100 text-sky-700',
};

export function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        BADGE_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// Map an appointment status to a badge tone.
export function statusTone(status) {
  return (
    {
      HOLD: 'amber',
      CONFIRMED: 'green',
      COMPLETED: 'pine',
      CANCELLED: 'red',
      NO_SHOW: 'clay',
      PAID: 'green',
      PENDING: 'amber',
      FAILED: 'red',
      REFUNDED: 'blue',
      ACTIVE: 'green',
      TRIALING: 'blue',
      PAST_DUE: 'amber',
    }[status] || 'neutral'
  );
}

// --- Spinner --------------------------------------------------------
export function Spinner({ className, size = 24 }) {
  return (
    <Loader2
      className={cn('animate-spin text-pine-500', className)}
      style={{ width: size, height: size }}
    />
  );
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24">
      <Spinner size={32} />
      <p className="text-sm text-paper-500">{label}</p>
    </div>
  );
}

// --- EmptyState -----------------------------------------------------
export function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="rounded-2xl bg-paper-100 p-4">
        <Icon className="h-7 w-7 text-paper-400" />
      </div>
      <div>
        <h4 className="font-semibold text-pine-900">{title}</h4>
        {message && (
          <p className="mt-1 max-w-sm text-sm text-paper-500">{message}</p>
        )}
      </div>
      {action}
    </div>
  );
}
