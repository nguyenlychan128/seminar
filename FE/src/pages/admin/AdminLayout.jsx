import { Outlet } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-slate-900">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 p-6">
          <h1 className="text-2xl font-bold text-emerald-400">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage users and exercises</p>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
