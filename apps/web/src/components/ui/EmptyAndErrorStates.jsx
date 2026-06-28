import { Button } from './Button.jsx';

/**
 * "An empty screen is an invitation to act" — copy here always tells the
 * person what to try next, never just states the absence of data.
 */
export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border px-6 py-16 text-center">
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {description && <p className="max-w-md text-ink-soft">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface-alt/50 px-6 py-16 text-center">
      <h3 className="font-display text-xl text-ink">Something didn't load</h3>
      <p className="max-w-md text-ink-soft">{message || 'Please try again in a moment.'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          Try again
        </Button>
      )}
    </div>
  );
}
