import { forwardRef } from 'react';

export const Select = forwardRef(function Select(
  { label, error, className = '', id, children, ...props },
  ref
) {
  const selectId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full rounded border bg-surface px-3.5 py-2.5 text-ink
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
          ${error ? 'border-danger' : 'border-border'} ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
});
