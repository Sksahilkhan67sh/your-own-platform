import { useOutletContext } from 'react-router-dom';

export function AboutPage() {
  const { settings } = useOutletContext() || {};
  const siteName = settings?.siteName || 'YOUR OWN';

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-display-md text-ink">About {siteName}</h1>
      <div className="mt-6 space-y-5 leading-relaxed text-ink-soft">
        <p>
          {siteName} lists land directly, without layers of brokers or inflated commissions.
          Every plot is checked for clear title and accurate boundaries before it goes live, and
          every price you see is the price the seller is asking — nothing is marked up along the way.
        </p>
        <p>
          When you're ready to move forward on a listing, the "Want to Buy" button connects you
          straight to a real conversation on WhatsApp — no forms, no waiting on a callback, no
          gatekeeping.
        </p>
        <p>
          We're a small team that believes land transactions should be as transparent as the land
          itself: visible, verifiable, and yours to walk.
        </p>
      </div>
    </div>
  );
}
