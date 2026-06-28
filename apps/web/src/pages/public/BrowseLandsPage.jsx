import { useState } from 'react';
import { FilterBar } from '../../components/listing/FilterBar.jsx';
import { ListingCard } from '../../components/listing/ListingCard.jsx';
import { ListingGridSkeleton } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyAndErrorStates.jsx';
import { ErrorState } from '../../components/ui/EmptyAndErrorStates.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useLands } from '../../hooks/useLands.js';

export function BrowseLandsPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 12 });
  const { items, meta, isLoading, isError, error, refetch } = useLands(filters);

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-display-md text-ink">Browse Lands</h1>
      <p className="mt-2 text-ink-soft">
        {meta ? `${meta.total} listing${meta.total === 1 ? '' : 's'} found` : 'Find your next plot.'}
      </p>

      <div className="mt-6">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <div className="mt-8">
        {isLoading && <ListingGridSkeleton count={6} />}

        {isError && <ErrorState message={error} onRetry={refetch} />}

        {!isLoading && !isError && items.length === 0 && (
          <EmptyState
            title="No listings match your filters"
            description="Try widening your price range or clearing a filter."
            action={
              <Button variant="outline" size="sm" onClick={() => setFilters({ page: 1, limit: 12 })}>
                Clear all filters
              </Button>
            }
          />
        )}

        {!isLoading && !isError && items.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((land) => (
                <ListingCard key={land._id} land={land} />
              ))}
            </div>

            {meta && meta.pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                >
                  Previous
                </Button>
                <span className="text-sm text-ink-soft">
                  Page {meta.page} of {meta.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.pages}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
