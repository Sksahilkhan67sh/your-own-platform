import { useOutletContext } from 'react-router-dom';

export function TermsPage() {
  const { settings } = useOutletContext() || {};
  const siteName = settings?.siteName || 'YOUR OWN';
  const lastUpdated = 'June 28, 2026';

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-display-md text-ink">Terms & Conditions</h1>
      <p className="mt-2 text-sm text-ink-soft">Last updated: {lastUpdated}</p>

      <div className="mt-8 space-y-8 leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-display text-lg text-ink">1. About {siteName}</h2>
          <p className="mt-2">
            {siteName} ("the Platform," "we," "us") is operated by AlignCraft and provides a
            listing service that connects land sellers with prospective buyers. By accessing or
            using this website, you agree to the terms set out below. If you do not agree, please
            do not use the Platform.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-ink">2. What the Platform Does — and Does Not Do</h2>
          <p className="mt-2">
            {siteName} is a listing and discovery service. We display land listings, including
            photographs, descriptions, pricing, and location details, and we connect interested
            buyers with sellers directly via WhatsApp or other contact methods shown on a listing.
          </p>
          <p className="mt-2">
            <strong className="text-ink">{siteName} is not a party to any sale.</strong> All
            negotiation, payment, contracts, and transfer of land are conducted directly between
            the buyer and the seller, entirely off-platform. We do not process, hold, or
            facilitate any payment for a land transaction, and we do not act as a broker, agent,
            or legal representative for either party.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-ink">3. Listing Accuracy and Title Verification</h2>
          <p className="mt-2">
            We take reasonable steps to review listings submitted to the Platform, including
            checking that the information provided is internally consistent and that supporting
            documentation has been requested from the seller. However, sellers are responsible
            for the accuracy of the information they submit, including land area, boundaries,
            pricing, and the legal status of the title.
          </p>
          <p className="mt-2">
            <strong className="text-ink">
              We do not guarantee clear or marketable title for any listed property.
            </strong>{' '}
            Buyers are strongly advised to independently verify land records, encumbrance
            certificates, survey numbers, and ownership documents — ideally through a qualified
            lawyer or registered surveyor — before making any payment or entering into any
            agreement.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-ink">4. No Warranty on Listings</h2>
          <p className="mt-2">
            Listings are provided "as is." We make no warranty, express or implied, regarding the
            condition, legal status, valuation, or fitness for any particular purpose of any land
            listed on the Platform. Photographs and descriptions are provided by or on behalf of
            the seller and may not reflect the current condition of the property at the time of
            viewing.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-ink">5. User Conduct</h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Submit false, misleading, or fraudulent listing information</li>
            <li>Use the Platform to harass, deceive, or defraud another user</li>
            <li>Attempt to access, scrape, or interfere with the Platform's systems without authorization</li>
            <li>Use listing contact details for unsolicited marketing or spam</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg text-ink">6. Limitation of Liability</h2>
          <p className="mt-2">
            To the fullest extent permitted by law, {siteName} and AlignCraft shall not be liable
            for any direct, indirect, incidental, or consequential loss arising from a transaction
            entered into between a buyer and seller, including but not limited to disputes over
            title, boundaries, payment, or possession. Any dispute regarding a specific land
            transaction is solely between the buyer and the seller involved.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-ink">7. Changes to These Terms</h2>
          <p className="mt-2">
            We may update these Terms from time to time. Continued use of the Platform after a
            change is posted constitutes acceptance of the revised Terms. We encourage you to
            review this page periodically.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-ink">8. Governing Law</h2>
          <p className="mt-2">
            These Terms are governed by the laws of India, without regard to conflict-of-law
            principles. Any dispute arising in connection with the use of the Platform itself
            (as distinct from disputes between buyers and sellers, which are governed by the
            agreement between those parties) shall be subject to the jurisdiction of the courts
            of India.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg text-ink">9. Contact</h2>
          <p className="mt-2">
            Questions about these Terms can be sent to{' '}
            {settings?.contactEmail ? (
              <a href={`mailto:${settings.contactEmail}`} className="text-accent hover:underline">
                {settings.contactEmail}
              </a>
            ) : (
              'the contact details listed on our Contact page'
            )}
            .
          </p>
        </section>
      </div>
    </div>
  );
}
