import { Link } from 'react-router-dom';

export function Footer({ settings }) {
  const siteName = settings?.siteName || 'YOUR OWN';
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface-alt">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-lg text-ink">{siteName}</p>
            <p className="mt-2 max-w-xs text-sm text-ink-soft">
              {settings?.heroSubheadline || 'Carefully verified plots, presented honestly, sold directly.'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-ink-soft">Explore</p>
            <nav className="mt-3 flex flex-col gap-2">
              <Link to="/lands" className="text-sm text-ink hover:text-accent">Browse Lands</Link>
              <Link to="/about" className="text-sm text-ink hover:text-accent">About</Link>
              <Link to="/contact" className="text-sm text-ink hover:text-accent">Contact</Link>
            </nav>
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-ink-soft">Get in touch</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-ink">
              {settings?.contactEmail && <a href={`mailto:${settings.contactEmail}`} className="hover:text-accent">{settings.contactEmail}</a>}
              {settings?.socialLinks?.instagram && (
                <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-accent">Instagram</a>
              )}
              {settings?.socialLinks?.facebook && (
                <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-accent">Facebook</a>
              )}
            </div>
          </div>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-xs text-ink-soft">
          © {year} {siteName}. All listings are subject to verification before final sale.
        </p>
      </div>
    </footer>
  );
}
