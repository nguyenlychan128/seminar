import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/auth.store';

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const isUsersActive = location.pathname === '/admin/users';
  const isExercisesActive = location.pathname === '/admin/exercises';

  const handleLogout = () => {
    clearAuth();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-screen">
      {/* Logo/Branding */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-emerald-400">FitGainer</h1>
        <p className="text-sm text-slate-400 mt-2">Admin Panel</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-6">
        <ul className="space-y-2">
          <li>
            <Link
              to="/admin/users"
              className={`block px-4 py-2 rounded-lg transition-all ${
                isUsersActive
                  ? 'bg-emerald-900 text-emerald-400 border-l-2 border-emerald-400'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              👥 Users
            </Link>
          </li>
          <li>
            <Link
              to="/admin/exercises"
              className={`block px-4 py-2 rounded-lg transition-all ${
                isExercisesActive
                  ? 'bg-emerald-900 text-emerald-400 border-l-2 border-emerald-400'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              🏋️ Exercises
            </Link>
          </li>
        </ul>
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-slate-700" />

      {/* Logout Button */}
      <div className="p-6">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
