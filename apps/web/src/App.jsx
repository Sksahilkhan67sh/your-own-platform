import { Routes, Route } from 'react-router-dom';
import { useAuthBootstrap } from './hooks/useAuth.js';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { RequireRole } from './routes/RequireRole.jsx';

import { PublicLayout } from './layouts/PublicLayout.jsx';
import { AdminLayout } from './layouts/AdminLayout.jsx';

import { HomePage } from './pages/public/HomePage.jsx';
import { BrowseLandsPage } from './pages/public/BrowseLandsPage.jsx';
import { LandDetailsPage } from './pages/public/LandDetailsPage.jsx';
import { AboutPage } from './pages/public/AboutPage.jsx';
import { ContactPage } from './pages/public/ContactPage.jsx';
import { TermsPage } from './pages/public/TermsPage.jsx';
import { NotFoundPage } from './pages/public/NotFoundPage.jsx';

import { AdminLoginPage } from './pages/admin/AdminLoginPage.jsx';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.jsx';
import { AdminLandsListPage } from './pages/admin/AdminLandsListPage.jsx';
import { AdminLandCreatePage } from './pages/admin/AdminLandCreatePage.jsx';
import { AdminLandEditPage } from './pages/admin/AdminLandEditPage.jsx';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage.jsx';
import { AdminBrandingPage } from './pages/admin/AdminBrandingPage.jsx';
import { AdminAnalyticsSettingsPage } from './pages/admin/AdminAnalyticsSettingsPage.jsx';

export default function App() {
  // Attempts a silent token refresh on first load so an admin who already
  // has a valid httpOnly refresh cookie doesn't have to log in again.
  useAuthBootstrap();

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/lands" element={<BrowseLandsPage />} />
        <Route path="/lands/:slug" element={<LandDetailsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="lands" element={<AdminLandsListPage />} />
        <Route path="lands/new" element={<AdminLandCreatePage />} />
        <Route path="lands/:id/edit" element={<AdminLandEditPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route
          path="branding"
          element={
            <RequireRole roles={['admin', 'super_admin']}>
              <AdminBrandingPage />
            </RequireRole>
          }
        />
        <Route
          path="analytics-settings"
          element={
            <RequireRole roles={['admin', 'super_admin']}>
              <AdminAnalyticsSettingsPage />
            </RequireRole>
          }
        />
      </Route>
    </Routes>
  );
}
