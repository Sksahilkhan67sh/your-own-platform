import { useOutletContext } from 'react-router-dom';
import { normalizePhoneForWhatsApp } from '@your-own/shared';

export function ContactPage() {
  const { settings } = useOutletContext() || {};

  const phone = settings?.defaultWhatsappNumber
    ? normalizePhoneForWhatsApp(settings.defaultWhatsappNumber)
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-display-md text-ink">Get in touch</h1>
      <p className="mt-4 text-ink-soft">
        Have a question about a listing, or land of your own you'd like to sell through{' '}
        {settings?.siteName || 'YOUR OWN'}? Reach out directly — a real person reads every message.
      </p>

      <div className="mt-8 space-y-4">
        {phone && (
          <a
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-card border border-border bg-surface p-5 hover:border-accent"
          >
            <p className="font-medium text-ink">WhatsApp</p>
            <p className="mt-1 text-sm text-ink-soft">Message us directly — usually the fastest way to reach us.</p>
          </a>
        )}
        {settings?.contactEmail && (
          <a
            href={`mailto:${settings.contactEmail}`}
            className="block rounded-card border border-border bg-surface p-5 hover:border-accent"
          >
            <p className="font-medium text-ink">Email</p>
            <p className="mt-1 text-sm text-ink-soft">{settings.contactEmail}</p>
          </a>
        )}
      </div>
    </div>
  );
}
