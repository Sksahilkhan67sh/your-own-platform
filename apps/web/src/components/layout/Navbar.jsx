import { Link, NavLink } from 'react-router-dom';

const navLinks = [
  { to: '/lands', label: 'Browse Lands' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar({ siteName = 'YOUR OWN', logoUrl }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-content items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 leading-tight">
          {logoUrl && <img src={logoUrl} alt="" className="h-8 w-8 object-contain" />}
          <span className="flex flex-col">
            <span className="font-display text-xl tracking-tight text-ink">{siteName}</span>
            <span className="text-xs text-ink-soft">Built by AlignCraft.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 sm:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-accent' : 'text-ink hover:text-accent'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <Link
          to="/lands"
          className="touch-target inline-flex items-center rounded border border-ink px-4 py-2 text-sm font-medium text-ink hover:bg-ink hover:text-surface sm:hidden"
        >
          Browse
        </Link>
      </div>
    </header>
  );
}
