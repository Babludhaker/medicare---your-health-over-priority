import { cn } from '@/lib/utils';

/**
 * Logo — the MediCare Connect wordmark with a geometric mark.
 * The mark is a stylised cross built from overlapping rounded forms,
 * suggesting care and connection.
 */
export default function Logo({ className, mono = false, showText = true }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8 shrink-0"
        aria-hidden="true"
      >
        <rect
          width="32"
          height="32"
          rx="9"
          className={mono ? 'fill-paper-50' : 'fill-pine-700'}
        />
        {/* Vertical bar of the cross */}
        <rect
          x="13"
          y="7"
          width="6"
          height="18"
          rx="3"
          className={mono ? 'fill-pine-700' : 'fill-paper-50'}
        />
        {/* Horizontal bar */}
        <rect
          x="7"
          y="13"
          width="18"
          height="6"
          rx="3"
          className={mono ? 'fill-pine-700' : 'fill-clay-400'}
        />
      </svg>
      {showText && (
        <span
          className={cn(
            'font-display text-lg font-600 leading-none tracking-tight',
            mono ? 'text-paper-50' : 'text-pine-900'
          )}
        >
          MediCare
          <span className={mono ? 'text-clay-300' : 'text-clay-500'}>
            {' '}
            Connect
          </span>
        </span>
      )}
    </span>
  );
}
