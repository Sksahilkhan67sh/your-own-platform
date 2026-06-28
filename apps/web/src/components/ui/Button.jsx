import { forwardRef } from 'react';

const VARIANTS = {
  primary: 'bg-accent text-surface hover:bg-accent-hover',
  outline: 'border border-ink text-ink hover:bg-ink hover:text-surface bg-transparent',
  ghost: 'text-ink hover:bg-surface-alt bg-transparent',
  danger: 'bg-danger text-surface hover:opacity-90',
};

const SIZES = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-5 py-3 text-base',
  lg: 'px-7 py-4 text-base',
};

/**
 * The accent-filled "primary" variant is reserved for the single primary
 * action per viewport (e.g. the "Want to Buy" button) — per Phase 1's
 * design rule, every other action on a page should use outline/ghost.
 */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', className = '', children, as: Component = 'button', ...props },
  ref
) {
  return (
    <Component
      ref={ref}
      className={`touch-target inline-flex items-center justify-center gap-2 rounded font-body font-medium
        transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
});
