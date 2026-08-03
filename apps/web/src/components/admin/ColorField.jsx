export function ColorField({ label, value, onChange, error }) {
  const swatchValue = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value || '') ? value : '#ffffff';

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={swatchValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 flex-shrink-0 cursor-pointer rounded border border-border bg-surface p-1"
          aria-label={`${label} swatch`}
        />
        <input
          type="text"
          value={value || ''}
          placeholder="#000000"
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded border bg-surface px-3.5 py-2.5 text-sm text-ink
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
            ${error ? 'border-danger' : 'border-border'}`}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}
