import { useState, useEffect } from 'react';
import { Input } from '../ui/Input.jsx';
import { Select } from '../ui/Select.jsx';
import { Button } from '../ui/Button.jsx';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { SORT_OPTIONS } from '@your-own/shared';

const SORT_LABELS = {
  [SORT_OPTIONS.NEWEST]: 'Newest first',
  [SORT_OPTIONS.PRICE_LOW_HIGH]: 'Price: Low to High',
  [SORT_OPTIONS.PRICE_HIGH_LOW]: 'Price: High to Low',
  [SORT_OPTIONS.AREA]: 'Area: Largest first',
};

export function FilterBar({ filters, onChange }) {
  const [searchInput, setSearchInput] = useState(filters.q || '');
  const debouncedSearch = useDebouncedValue(searchInput, 400);

  useEffect(() => {
    if (debouncedSearch !== (filters.q || '')) {
      onChange({ ...filters, q: debouncedSearch || undefined, page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const update = (patch) => onChange({ ...filters, ...patch, page: 1 });

  const handleReset = () => {
    setSearchInput('');
    onChange({ page: 1, limit: filters.limit });
  };

  return (
    <div className="space-y-4 rounded-card border border-border bg-surface p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Search"
          placeholder="Title or city"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select
          label="Status"
          value={filters.status || ''}
          onChange={(e) => update({ status: e.target.value || undefined })}
        >
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="pending">Under negotiation</option>
          <option value="sold">Sold</option>
        </Select>
        <Select
          label="Sort by"
          value={filters.sort || SORT_OPTIONS.NEWEST}
          onChange={(e) => update({ sort: e.target.value })}
        >
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={Boolean(filters.featured)}
              onChange={(e) => update({ featured: e.target.checked || undefined })}
              className="h-4 w-4 rounded border-border text-accent focus-visible:ring-accent"
            />
            Featured only
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Input
          label="Min price"
          type="number"
          min="0"
          placeholder="₹0"
          value={filters.minPrice ?? ''}
          onChange={(e) => update({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
        />
        <Input
          label="Max price"
          type="number"
          min="0"
          placeholder="Any"
          value={filters.maxPrice ?? ''}
          onChange={(e) => update({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
        />
        <Input
          label="Min area"
          type="number"
          min="0"
          placeholder="Any"
          value={filters.minArea ?? ''}
          onChange={(e) => update({ minArea: e.target.value ? Number(e.target.value) : undefined })}
        />
        <Input
          label="Max area"
          type="number"
          min="0"
          placeholder="Any"
          value={filters.maxArea ?? ''}
          onChange={(e) => update({ maxArea: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Reset filters
        </Button>
      </div>
    </div>
  );
}
