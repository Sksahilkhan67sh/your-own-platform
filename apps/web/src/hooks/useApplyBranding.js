import { useEffect } from 'react';

function setMeta(nameOrProperty, content, attr = 'name') {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${nameOrProperty}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, nameOrProperty);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setFavicon(url) {
  if (!url) return;
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
}

/**
 * Maps the admin-configured color fields onto the CSS custom properties
 * tailwind.config.js's color theme reads from (see that file's comment).
 * Only fields that have an obvious, unambiguous mapping onto an existing
 * design token are applied globally; navbar/footer/sidebar/button colors
 * are intentionally more targeted (see Navbar.jsx, Footer.jsx,
 * AdminSidebar.jsx, Button.jsx) rather than overloading the whole theme.
 */
function applyColorVariables(colors = {}) {
  const root = document.documentElement.style;
  const accent = colors.accentColor || colors.primaryColor;
  const surfaceAlt = colors.secondaryColor;

  if (accent) root.setProperty('--color-accent', accent);
  if (colors.backgroundColor) root.setProperty('--color-surface', colors.backgroundColor);
  if (colors.textColor) root.setProperty('--color-ink', colors.textColor);
  if (surfaceAlt) root.setProperty('--color-surface-alt', surfaceAlt);
}

/** Call once with the public settings object (or null while loading). */
export function useApplyBranding(settings) {
  useEffect(() => {
    if (!settings) return;

    const title = settings.metaTitle || settings.websiteTitle || settings.seoDefaultTitle || settings.siteName;
    if (title) document.title = title;

    setFavicon(settings.faviconUrl);
    setMeta('description', settings.metaDescription || settings.seoDefaultDescription);
    setMeta('keywords', settings.metaKeywords);
    setMeta('og:title', settings.metaTitle || title, 'property');
    setMeta('og:description', settings.metaDescription || settings.seoDefaultDescription, 'property');
    setMeta('og:image', settings.ogImageUrl, 'property');
    setMeta('twitter:card', settings.twitterImageUrl ? 'summary_large_image' : undefined);
    setMeta('twitter:image', settings.twitterImageUrl);

    applyColorVariables(settings.colors);
  }, [settings]);
}
