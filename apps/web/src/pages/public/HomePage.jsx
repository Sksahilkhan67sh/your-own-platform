import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { ListingCard } from '../../components/listing/ListingCard.jsx';
import { ListingGridSkeleton } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyAndErrorStates.jsx';
import { fetchPublicLands } from '../../lib/landApi.js';

export function HomePage() {
  const { settings } = useOutletContext() || {};
  const [featured, setFeatured] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetchPublicLands({ featured: true, limit: 6, sort: 'newest' })
      .then((res) => {
        setFeatured(res.data);
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div>
      <section className="mx-auto max-w-content px-4 pt-12 pb-16 sm:px-6 sm:pt-20 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr,1.2fr]">
          <div>
            <h1 className="font-display text-display-xl text-ink">
              {settings?.heroHeadline || 'Land worth owning.'}
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink-soft">
              {settings?.heroSubheadline ||
                'Carefully verified plots, presented honestly, sold directly. No agents, no middlemen — just a direct line to the seller.'}
            </p>
            <div className="mt-8 flex gap-4">
              <Button as={Link} to="/lands" variant="primary" size="lg">
                Browse Listings
              </Button>
              <Button as={Link} to="/about" variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>

          <div className="relative aspect-[5/4] overflow-hidden rounded-card lg:aspect-[4/3]">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1400&q=80"
              alt="Open farmland under a wide sky"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-display text-display-md text-ink">Featured listings</h2>
          <Link to="/lands" className="text-sm font-medium text-accent hover:underline">
            View all →
          </Link>
        </div>

        {status === 'loading' && <ListingGridSkeleton count={3} />}

        {status === 'success' && featured.length === 0 && (
          <EmptyState
            title="No featured listings yet"
            description="Check back soon, or browse the full catalogue."
            action={
              <Button as={Link} to="/lands" variant="outline" size="sm">
                Browse all listings
              </Button>
            }
          />
        )}

        {status === 'success' && featured.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((land) => (
              <ListingCard key={land._id} land={land} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
