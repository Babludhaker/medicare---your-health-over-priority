import { Spinner, EmptyState } from './Card';
import { cn } from '@/lib/utils';

/**
 * DataTable — a presentational table for dashboard list screens.
 *
 * Columns are described declaratively:
 *   const columns = [
 *     { key: 'name', header: 'Name', render: (row) => row.firstName },
 *     { key: 'role', header: 'Role', render: (row) => <Badge>…</Badge> },
 *     { key: 'actions', header: '', align: 'right', render: (row) => … },
 *   ];
 *
 * Handles its own loading / empty / error states so callers stay thin.
 */
export default function DataTable({
  columns,
  rows,
  loading = false,
  error = '',
  emptyTitle = 'Nothing here yet',
  emptyMessage = 'Records will appear here once added.',
  emptyAction,
  onRowClick,
  rowKey = (row) => row.id,
}) {
  // Loading — first load, no data yet.
  if (loading && (!rows || rows.length === 0)) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  // Error.
  if (error && (!rows || rows.length === 0)) {
    return (
      <EmptyState
        title="Couldn't load this"
        message={error}
      />
    );
  }

  // Empty.
  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        message={emptyMessage}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="relative overflow-x-auto">
      {/* Subtle overlay while refetching with existing data shown. */}
      {loading && (
        <div className="absolute inset-0 z-10 flex items-start justify-center bg-paper-50/50 pt-8">
          <Spinner size={24} />
        </div>
      )}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-paper-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-paper-500',
                  col.align === 'right' ? 'text-right' : 'text-left'
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-b border-paper-100 transition-colors',
                onRowClick && 'cursor-pointer hover:bg-paper-100'
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    'px-4 py-3.5 text-paper-700',
                    col.align === 'right' && 'text-right'
                  )}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
