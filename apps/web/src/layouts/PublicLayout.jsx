import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar.jsx';
import { Footer } from '../components/layout/Footer.jsx';
import { fetchPublicSettings } from '../lib/landApi.js';
import { useApplyBranding } from '../hooks/useApplyBranding.js';

export function PublicLayout() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchPublicSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  useApplyBranding(settings);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar siteName={settings?.siteName} logoUrl={settings?.navbarLogoUrl || settings?.logoUrl} />
      <main className="flex-1">
        <Outlet context={{ settings }} />
      </main>
      <Footer settings={settings} />
    </div>
  );
}
