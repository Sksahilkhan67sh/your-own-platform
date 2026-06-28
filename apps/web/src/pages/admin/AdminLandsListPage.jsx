import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { EmptyState } from '../../components/ui/EmptyAndErrorStates.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { fetchAdminLands, deleteLand } from '../../lib/landApi.js';
import { formatPrice, formatArea } from '../../lib/format.js';

export function AdminLandsListPage() {
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const debouncedSearch = useDebouncedValue(searchInput, 400);

  const load = async () => {
    setIsLoading(true);
    const res = await fetchAdminLands({
      q: debouncedSearch || undefined,
      status: statusFilter || undefined,
      page,
      limit: 10,
    });
    setItems(res.data);
    setMeta(res.meta);
    setIsLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, page]);

  const handleDelete = async (id) => {
    await deleteLand(id);
    setPendingDeleteId(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-display-md text-ink">Listings</h1>
        <Button as={Link} to="/admin/lands/new" variant="primary">
          + New listing
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Search by title or city"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="pending">Under negotiation</option>
            <option value="sold">Sold</option>
          </Select>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-card border border-border bg-surface">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No listings found"
              description="Try a different search, or create your first listing."
              action={
                <Button as={Link} to="/admin/lands/new" variant="outline" size="sm">
                  + New listing
                </Button>
              }
            />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-alt text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Area</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((land) => (
                <tr key={land._id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4 font-medium text-ink">
                    {land.title}
                    {land.featured && <span className="ml-2 text-xs text-accent">★ Featured</span>}
                  </td>
                  <td className="px-5 py-4 text-ink-soft">{land.city}, {land.state}</td>
                  <td className="px-5 py-4 text-ink-soft">{formatPrice(land.price, land.currency)}</td>
                  <td className="px-5 py-4 text-ink-soft">{formatArea(land.areaValue, land.areaUnit)}</td>
                  <td className="px-5 py-4"><StatusBadge status={land.status} /></td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/lands/${land.slug}`}
                        target="_blank"
                        className="text-sm text-ink-soft hover:text-accent"
                      >
                        Preview
                      </Link>
                      <Link to={`/admin/lands/${land._id}/edit`} className="text-sm text-accent hover:underline">
                        Edit
                      </Link>
                      {pendingDeleteId === land._id ? (
                        <span className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(land._id)}
                            className="text-sm font-medium text-danger hover:underline"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(null)}
                            className="text-sm text-ink-soft hover:underline"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(land._id)}
                          className="text-sm text-danger hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta && meta.pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-ink-soft">Page {meta.page} of {meta.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
