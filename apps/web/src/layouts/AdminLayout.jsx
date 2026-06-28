import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/layout/AdminSidebar.jsx';

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-surface">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
