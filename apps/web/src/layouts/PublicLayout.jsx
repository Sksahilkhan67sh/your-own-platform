import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar.jsx';
import { Footer } from '../components/layout/Footer.jsx';
import { fetchPublicSettings } from '../lib/landApi.js';

export function PublicLayout() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchPublicSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar siteName={settings?.siteName} />
      <main className="flex-1">
        <Outlet context={{ settings }} />
      </main>
      <Footer settings={settings} />
    </div>
  );
}
