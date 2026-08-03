import { useState, useEffect } from 'react';
import { BRANDING_ASSET_TYPE, BRANDING_COLOR_KEYS } from '@your-own/shared';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { BrandingAssetUploader } from '../../components/admin/BrandingAssetUploader.jsx';
import { ColorField } from '../../components/admin/ColorField.jsx';
import { fetchAdminBranding, updateAdminBranding } from '../../lib/brandingApi.js';

const COLOR_LABELS = {
  primaryColor: 'Primary',
  secondaryColor: 'Secondary',
  accentColor: 'Accent',
  buttonColor: 'Button',
  navbarColor: 'Navbar',
  footerColor: 'Footer',
  sidebarColor: 'Sidebar',
  backgroundColor: 'Background',
  textColor: 'Text',
};

const LOGO_SLOTS = [
  { assetType: BRANDING_ASSET_TYPE.LOGO, field: 'logoUrl', label: 'Website Logo' },
  { assetType: BRANDING_ASSET_TYPE.NAVBAR_LOGO, field: 'navbarLogoUrl', label: 'Navbar Logo' },
  { assetType: BRANDING_ASSET_TYPE.SIDEBAR_LOGO, field: 'sidebarLogoUrl', label: 'Sidebar Logo' },
  { assetType: BRANDING_ASSET_TYPE.LOGIN_LOGO, field: 'loginLogoUrl', label: 'Login Page Logo' },
  { assetType: BRANDING_ASSET_TYPE.FOOTER_LOGO, field: 'footerLogoUrl', label: 'Footer Logo' },
];

function Section({ title, description, children }) {
  return (
    <section className="rounded-card border border-border bg-surface p-6 shadow-card">
      <h2 className="font-display text-lg text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function AdminBrandingPage() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    fetchAdminBranding()
      .then((data) => setSettings(normalize(data)))
      .catch(() => setServerError('Could not load branding settings. Try refreshing the page.'))
      .finally(() => setIsLoading(false));
  }, []);

  const setField = (field, value) => setSettings((prev) => ({ ...prev, [field]: value }));
  const setColor = (key, value) =>
    setSettings((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));

  const handleAssetUploaded = (updatedBranding) => setSettings(normalize(updatedBranding));

  const handleSave = async () => {
    setServerError(null);
    setIsSaving(true);
    try {
      const saved = await updateAdminBranding(toPayload(settings));
      setSettings(normalize(saved));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      setServerError(err?.response?.data?.error?.message || 'Could not save branding settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!settings) {
    return <p className="text-danger">{serverError}</p>;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-md text-ink">Branding Settings</h1>
          <p className="mt-2 text-ink-soft">
            Change how the site looks — logos, favicon, colors, and page text — without touching code.
          </p>
        </div>
        <Button type="button" variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      {serverError && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {serverError}
        </p>
      )}
      {savedNotice && (
        <p role="status" className="mt-4 rounded bg-accent-soft px-4 py-2.5 text-sm text-accent-hover">
          Branding saved.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Section title="Website title" description="Shown in the browser tab and used as a fallback page title.">
            <Input
              label="Website title"
              value={settings.websiteTitle || ''}
              onChange={(e) => setField('websiteTitle', e.target.value)}
              maxLength={80}
            />
          </Section>

          <Section title="Logos" description="PNG, SVG, JPG, or WEBP. Max 5MB each.">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {LOGO_SLOTS.map((slot) => (
                <BrandingAssetUploader
                  key={slot.assetType}
                  assetType={slot.assetType}
                  label={slot.label}
                  currentUrl={settings[slot.field]}
                  onUploaded={handleAssetUploaded}
                />
              ))}
            </div>
          </Section>

          <Section title="Favicon" description="Shown in the browser tab. PNG or ICO recommended.">
            <BrandingAssetUploader
              assetType={BRANDING_ASSET_TYPE.FAVICON}
              label="Favicon"
              currentUrl={settings.faviconUrl}
              onUploaded={handleAssetUploaded}
              roundPreview
            />
          </Section>

          <Section title="Meta tags" description="Controls search-engine and social-share previews.">
            <Input
              label="Meta title"
              value={settings.metaTitle || ''}
              onChange={(e) => setField('metaTitle', e.target.value)}
              maxLength={140}
            />
            <Textarea
              label="Meta description"
              rows={3}
              value={settings.metaDescription || ''}
              onChange={(e) => setField('metaDescription', e.target.value)}
              maxLength={300}
            />
            <Input
              label="Keywords"
              hint="Comma-separated."
              value={settings.metaKeywords || ''}
              onChange={(e) => setField('metaKeywords', e.target.value)}
              maxLength={300}
            />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <BrandingAssetUploader
                assetType={BRANDING_ASSET_TYPE.OG_IMAGE}
                label="OG Image"
                currentUrl={settings.ogImageUrl}
                onUploaded={handleAssetUploaded}
              />
              <BrandingAssetUploader
                assetType={BRANDING_ASSET_TYPE.TWITTER_IMAGE}
                label="Twitter Card Image"
                currentUrl={settings.twitterImageUrl}
                onUploaded={handleAssetUploaded}
              />
            </div>
          </Section>

          <Section title="Login page">
            <BrandingAssetUploader
              assetType={BRANDING_ASSET_TYPE.LOGIN_BACKGROUND}
              label="Background image"
              currentUrl={settings.loginBackgroundUrl}
              onUploaded={handleAssetUploaded}
            />
            <Input
              label="Welcome heading"
              value={settings.loginWelcomeHeading || ''}
              onChange={(e) => setField('loginWelcomeHeading', e.target.value)}
              maxLength={140}
            />
            <Textarea
              label="Welcome description"
              rows={3}
              value={settings.loginWelcomeDescription || ''}
              onChange={(e) => setField('loginWelcomeDescription', e.target.value)}
              maxLength={300}
            />
          </Section>

          <Section title="Colors" description="Applied site-wide. Leave blank to use the theme default.">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {BRANDING_COLOR_KEYS.map((key) => (
                <ColorField
                  key={key}
                  label={COLOR_LABELS[key]}
                  value={settings.colors?.[key]}
                  onChange={(value) => setColor(key, value)}
                />
              ))}
            </div>
          </Section>
        </div>

        <LivePreview settings={settings} />
      </div>
    </div>
  );
}

/** A small mocked-up storefront preview, live-styled from the in-progress
 * (not yet saved) form state — so an admin can see the effect of a color
 * or logo change before committing to Save. */
function LivePreview({ settings }) {
  const c = settings.colors || {};
  const style = {
    '--preview-bg': c.backgroundColor || '#F7F4EE',
    '--preview-navbar': c.navbarColor || '#FFFFFF',
    '--preview-sidebar': c.sidebarColor || '#F1ECE1',
    '--preview-footer': c.footerColor || '#2B2620',
    '--preview-text': c.textColor || '#2B2620',
    '--preview-button': c.buttonColor || c.accentColor || '#44574A',
    '--preview-accent': c.accentColor || '#44574A',
  };

  return (
    <aside className="sticky top-6 h-fit rounded-card border border-border bg-surface p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Live preview</p>
      <div
        style={style}
        className="mt-3 overflow-hidden rounded border border-border"
        // Values above are user-authored hex colors, only ever consumed
        // as CSS custom properties (never HTML/JS), so there is no XSS
        // vector — same treatment as the color inputs' own value display.
      >
        <div
          className="flex items-center gap-2 border-b border-border px-3 py-2"
          style={{ background: 'var(--preview-navbar)' }}
        >
          {settings.navbarLogoUrl ? (
            <img src={settings.navbarLogoUrl} alt="" className="h-5 w-5 object-contain" />
          ) : (
            <div className="h-5 w-5 rounded-full" style={{ background: 'var(--preview-accent)' }} />
          )}
          <span className="text-xs font-medium" style={{ color: 'var(--preview-text)' }}>
            {settings.websiteTitle || 'Site name'}
          </span>
        </div>
        <div className="flex" style={{ background: 'var(--preview-bg)' }}>
          <div className="w-10 flex-shrink-0" style={{ background: 'var(--preview-sidebar)' }} />
          <div className="flex-1 space-y-2 p-3">
            <div className="h-2 w-3/4 rounded" style={{ background: 'var(--preview-text)', opacity: 0.15 }} />
            <div className="h-2 w-1/2 rounded" style={{ background: 'var(--preview-text)', opacity: 0.15 }} />
            <button
              type="button"
              className="mt-2 rounded px-3 py-1.5 text-[11px] font-medium text-white"
              style={{ background: 'var(--preview-button)' }}
            >
              Want to buy
            </button>
          </div>
        </div>
        <div className="px-3 py-2 text-[10px]" style={{ background: 'var(--preview-footer)', color: '#fff' }}>
          {settings.websiteTitle || 'Site name'} · Footer
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-soft">Favicon</p>
      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded border border-border bg-surface-alt">
        {settings.faviconUrl ? (
          <img src={settings.faviconUrl} alt="" className="h-5 w-5 object-contain" />
        ) : (
          <span className="text-[9px] text-ink-soft">—</span>
        )}
      </div>
    </aside>
  );
}

function normalize(data) {
  return { ...data, colors: data.colors || {} };
}

function toPayload(settings) {
  // The PUT schema doesn't accept _id/createdAt/updatedAt/__v — strip
  // anything the API didn't ask for rather than trusting the whole object.
  const payload = { ...settings };
  delete payload._id;
  delete payload.id;
  delete payload.createdAt;
  delete payload.updatedAt;
  delete payload.__v;
  return payload;
}
