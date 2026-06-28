import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { fetchAdminLands } from '../../lib/landApi.js';

export function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    Promise.all([
      fetchAdminLands({ limit: 1 }),
      fetchAdminLands({ status: 'available', limit: 1 }),
      fetchAdminLands({ status: 'pending', limit: 1 }),
      fetchAdminLands({ status: 'sold', limit: 1 }),
    ]).then(([all, available, pending, sold]) => {
      setSummary({
        total: all.meta.total,
        available: available.meta.total,
        pending: pending.meta.total,
        sold: sold.meta.total,
      });
    });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-display-md text-ink">Dashboard</h1>
        <Button as={Link} to="/admin/lands/new" variant="primary">
          + New listing
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total listings" value={summary?.total} />
        <SummaryCard label="Available" value={summary?.available} accentClass="text-status-available" />
        <SummaryCard label="Under negotiation" value={summary?.pending} accentClass="text-status-pending" />
        <SummaryCard label="Sold" value={summary?.sold} accentClass="text-status-sold" />
      </div>

      <div className="mt-10 rounded-card border border-border bg-surface p-6">
        <h2 className="font-display text-lg text-ink">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button as={Link} to="/admin/lands" variant="outline" size="sm">
            Manage all listings
          </Button>
          <Button as={Link} to="/admin/settings" variant="outline" size="sm">
            Edit site settings
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accentClass = 'text-ink' }) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className={`mt-2 font-display text-3xl ${accentClass}`}>{value ?? '—'}</p>
    </div>
  );
}
