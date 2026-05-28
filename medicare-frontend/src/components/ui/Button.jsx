import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * Button — the primary interactive primitive.
 *
 * Variants: primary | accent | outline | ghost | danger
 * Sizes:    sm | md | lg
 */
const VARIANTS = {
  primary:
    'bg-pine-700 text-paper-50 hover:bg-pine-800 active:bg-pine-900 shadow-soft',
  accent:
    'bg-clay-500 text-paper-50 hover:bg-clay-600 active:bg-clay-700 shadow-soft',
  outline:
    'border border-pine-300 text-pine-800 hover:bg-pine-50 active:bg-pine-100',
  ghost: 'text-pine-700 hover:bg-pine-50 active:bg-pine-100',
  danger:
    'bg-clay-600 text-paper-50 hover:bg-clay-700 active:bg-clay-800 shadow-soft',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
};

export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <Tag
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-semibold',
        'transition-all duration-150 select-none',
        'disabled:opacity-55 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={Tag === 'button' ? isDisabled : undefined}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </Tag>
  );
}
