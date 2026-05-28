import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Form field primitives — Input, Textarea, Select — each wrapped with a
 * label, optional hint, and error message. Designed to work with
 * react-hook-form via ref forwarding.
 */

const baseField =
  'w-full rounded-xl border bg-paper-50 px-3.5 text-paper-900 ' +
  'placeholder:text-paper-400 transition-colors ' +
  'focus:border-pine-500 focus:ring-2 focus:ring-pine-500/20 focus:outline-none ' +
  'disabled:bg-paper-100 disabled:text-paper-400';

function FieldShell({ label, hint, error, required, htmlFor, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-paper-700"
        >
          {label}
          {required && <span className="text-clay-500"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-clay-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-paper-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, hint, error, required, className, id, ...props },
  ref
) {
  const fieldId = id || props.name;
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={fieldId}
    >
      <input
        ref={ref}
        id={fieldId}
        className={cn(
          baseField,
          'h-11',
          error && 'border-clay-400 focus:border-clay-500 focus:ring-clay-500/20',
          !error && 'border-paper-300',
          className
        )}
        {...props}
      />
    </FieldShell>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, required, className, id, rows = 4, ...props },
  ref
) {
  const fieldId = id || props.name;
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={fieldId}
    >
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        className={cn(
          baseField,
          'py-2.5 resize-y',
          error && 'border-clay-400 focus:border-clay-500 focus:ring-clay-500/20',
          !error && 'border-paper-300',
          className
        )}
        {...props}
      />
    </FieldShell>
  );
});

export const Select = forwardRef(function Select(
  { label, hint, error, required, className, id, children, ...props },
  ref
) {
  const fieldId = id || props.name;
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={fieldId}
    >
      <select
        ref={ref}
        id={fieldId}
        className={cn(
          baseField,
          'h-11 pr-8',
          error && 'border-clay-400 focus:border-clay-500 focus:ring-clay-500/20',
          !error && 'border-paper-300',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
});
