import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/lands', label: 'Listings' },
  { to: '/admin/settings', label: 'Settings' },
];

export function AdminSidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col justify-between border-r border-border bg-surface-alt p-6">
      <div>
        <p className="font-display text-lg text-ink">YOUR OWN</p>
        <p className="mt-0.5 text-xs uppercase tracking-wide text-ink-soft">Admin Panel</p>

        <nav className="mt-8 flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-accent text-surface' : 'text-ink hover:bg-surface'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-border pt-4">
        <p className="truncate text-sm text-ink">{user?.name}</p>
        <p className="truncate text-xs text-ink-soft">{user?.email}</p>
        <button
          type="button"
          onClick={logout}
          className="mt-3 text-sm font-medium text-danger hover:underline"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
