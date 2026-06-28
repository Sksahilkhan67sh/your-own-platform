import { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { Gallery } from '../../components/listing/Gallery.jsx';
import { WantToBuyButton } from '../../components/listing/WantToBuyButton.jsx';
import { StickyBuyBar } from '../../components/listing/StickyBuyBar.jsx';
import { StatusBadge } from '../../components/ui/StatusBadge.jsx';
import { ErrorState } from '../../components/ui/EmptyAndErrorStates.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { fetchPublicLandBySlug } from '../../lib/landApi.js';
import { formatPrice, formatArea } from '../../lib/format.js';

export function LandDetailsPage() {
  const { slug } = useParams();
  const { settings } = useOutletContext() || {};
  const [land, setLand] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    setStatus('loading');
    fetchPublicLandBySlug(slug)
      .then((data) => {
        setLand(data);
        setStatus('success');
      })
      .catch((err) => {
        setStatus(err?.response?.status === 404 ? 'not-found' : 'error');
      });
  }, [slug]);

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="aspect-[4/3] w-full" />
        <Skeleton className="mt-6 h-8 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/3" />
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="mx-auto max-w-content px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-display-md text-ink">Listing not found</h1>
        <p className="mt-3 text-ink-soft">This listing may have been sold or removed.</p>
        <Link to="/lands" className="mt-6 inline-block text-accent hover:underline">
          ← Back to all listings
        </Link>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mx-auto max-w-content px-4 py-20 sm:px-6 lg:px-8">
        <ErrorState message="Could not load this listing." onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const mapEmbedUrl =
    land.latitude && land.longitude
      ? `https://www.google.com/maps?q=${land.latitude},${land.longitude}&z=15&output=embed`
      : null;

  return (
    <div className="mx-auto max-w-content px-4 py-10 pb-28 sm:px-6 lg:px-8 lg:pb-10">
      <Link to="/lands" className="text-sm text-ink-soft hover:text-accent">
        ← Back to all listings
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr,1fr]">
        <div>
          <Gallery images={land.images} title={land.title} />

          <div className="mt-8">
            <h2 className="font-display text-xl text-ink">About this listing</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{land.description}</p>
          </div>

          {land.highlights?.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-xl text-ink">Highlights</h2>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {land.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-ink-soft">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mapEmbedUrl && (
            <div className="mt-8">
              <h2 className="font-display text-xl text-ink">Location</h2>
              <div className="mt-3 overflow-hidden rounded-card border border-border">
                <iframe
                  title={`Map location of ${land.title}`}
                  src={mapEmbedUrl}
                  className="h-72 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-6 rounded-card border border-border bg-surface p-6 shadow-card">
            <StatusBadge status={land.status} />
            <h1 className="mt-2 font-display text-2xl leading-snug text-ink">{land.title}</h1>
            <p className="mt-1 text-ink-soft">{land.city}, {land.state}</p>

            <div className="mt-5 space-y-2 border-t border-border pt-5">
              <div className="flex justify-between">
                <span className="text-ink-soft">Price</span>
                <span className="font-display text-lg text-ink">{formatPrice(land.price, land.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Area</span>
                <span className="text-ink">{formatArea(land.areaValue, land.areaUnit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Reference</span>
                <span className="text-ink">{land.slug}</span>
              </div>
            </div>

            <WantToBuyButton land={land} settings={settings} className="mt-6 w-full" />
          </div>
        </div>
      </div>

      {/* Mobile-only title block, since the sticky sidebar is hidden below lg */}
      <div className="mt-6 lg:hidden">
        <StatusBadge status={land.status} />
        <h1 className="mt-2 font-display text-2xl leading-snug text-ink">{land.title}</h1>
        <p className="mt-1 text-ink-soft">{land.city}, {land.state}</p>
      </div>

      <StickyBuyBar land={land} settings={settings} />
    </div>
  );
}
