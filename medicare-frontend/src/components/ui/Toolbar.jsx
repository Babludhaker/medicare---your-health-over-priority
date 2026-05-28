import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Toolbar — a row above a data table holding a search box and optional
 * filter controls. `children` render to the right of the search box.
 */
export function Toolbar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  children,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      {onSearchChange ? (
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-paper-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-xl border border-paper-300 bg-paper-50 pl-9 pr-3 text-sm text-paper-900 placeholder:text-paper-400 focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/20"
          />
        </div>
      ) : (
        <div />
      )}
      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  );
}

/**
 * FilterSelect — a compact dropdown for table filters.
 */
export function FilterSelect({ value, onChange, options, className }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-10 rounded-xl border border-paper-300 bg-paper-50 px-3 text-sm text-paper-700 focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/20',
        className
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
