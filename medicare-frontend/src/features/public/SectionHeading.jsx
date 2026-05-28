import { cn } from '@/lib/utils';

/**
 * SectionHeading — consistent eyebrow + title + intro block used
 * across the public pages.
 */
export default function SectionHeading({
  eyebrow,
  title,
  intro,
  align = 'center',
  className,
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className
      )}
    >
      {eyebrow && (
        <span className="eyebrow">
          <span className="h-px w-6 bg-pine-400" />
          {eyebrow}
        </span>
      )}
      <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-pine-900 sm:text-4xl">
        {title}
      </h2>
      {intro && (
        <p className="mt-4 text-base leading-relaxed text-paper-600">
          {intro}
        </p>
      )}
    </div>
  );
}
