import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Pagination — page controls driven by the backend's `meta` object
 * ({ page, limit, total, totalPages } or similar). Renders nothing
 * when there's a single page or less.
 */
export default function Pagination({ meta, page, onPageChange }) {
  if (!meta) return null;

  const totalPages =
    meta.totalPages ||
    (meta.total && meta.limit
      ? Math.ceil(meta.total / meta.limit)
      : 1);

  if (totalPages <= 1) return null;

  const current = page || meta.page || 1;
  const canPrev = current > 1;
  const canNext = current < totalPages;

  // A compact window of page numbers around the current page.
  const windowed = [];
  const from = Math.max(1, current - 2);
  const to = Math.min(totalPages, current + 2);
  for (let i = from; i <= to; i += 1) windowed.push(i);

  return (
    <div className="flex items-center justify-between gap-4 border-t border-paper-200 px-4 py-3">
      <p className="text-xs text-paper-500">
        {meta.total != null ? (
          <>
            Showing page{' '}
            <span className="font-semibold text-paper-700">
              {current}
            </span>{' '}
            of {totalPages} · {meta.total} total
          </>
        ) : (
          <>
            Page {current} of {totalPages}
          </>
        )}
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => canPrev && onPageChange(current - 1)}
          disabled={!canPrev}
          className="rounded-lg p-1.5 text-paper-600 transition-colors hover:bg-paper-100 disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {from > 1 && (
          <>
            <PageButton n={1} current={current} onClick={onPageChange} />
            {from > 2 && (
              <span className="px-1 text-paper-400">…</span>
            )}
          </>
        )}

        {windowed.map((n) => (
          <PageButton
            key={n}
            n={n}
            current={current}
            onClick={onPageChange}
          />
        ))}

        {to < totalPages && (
          <>
            {to < totalPages - 1 && (
              <span className="px-1 text-paper-400">…</span>
            )}
            <PageButton
              n={totalPages}
              current={current}
              onClick={onPageChange}
            />
          </>
        )}

        <button
          onClick={() => canNext && onPageChange(current + 1)}
          disabled={!canNext}
          className="rounded-lg p-1.5 text-paper-600 transition-colors hover:bg-paper-100 disabled:opacity-40 disabled:hover:bg-transparent"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PageButton({ n, current, onClick }) {
  const active = n === current;
  return (
    <button
      onClick={() => onClick(n)}
      className={cn(
        'h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-colors',
        active
          ? 'bg-pine-700 text-paper-50'
          : 'text-paper-600 hover:bg-paper-100'
      )}
    >
      {n}
    </button>
  );
}
