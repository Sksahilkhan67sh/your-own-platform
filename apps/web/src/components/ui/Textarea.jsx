import { forwardRef } from 'react';

export const Textarea = forwardRef(function Textarea(
  { label, error, className = '', id, ...props },
  ref
) {
  const fieldId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        className={`w-full rounded border bg-surface px-3.5 py-2.5 text-ink placeholder:text-ink-soft/60
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
          ${error ? 'border-danger' : 'border-border'} ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
});
