import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLogout } from '../hooks/useLogout';

export default function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout();
  };

  const BrandLogo = () => (
    <Link to="/" className="flex items-center gap-2 no-underline text-slate-100 hover:opacity-80 transition-opacity duration-150">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shrink-0">
        <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M8 20C8 12.27 12.27 8 20 8C27.73 8 32 12.27 32 20C32 27.73 27.73 32 20 32C12.27 32 8 27.73 8 20Z" stroke="currentColor" strokeWidth="2" fill="none"/>
          <path d="M20 14V26M14 20H26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>
      <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
        FitGainer
      </span>
    </Link>
  );

  if (!isAuthenticated) {
    return (
      <nav className="relative z-50 bg-slate-800 border-b border-slate-700 shadow-md backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-[70px]">
          <BrandLogo />
          <div className="flex items-center gap-4">
            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-emerald-400 rounded hover:bg-emerald-500/10 transition-colors duration-150 no-underline">
              Login
            </Link>
            <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white rounded bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-150 no-underline">
              Register
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="relative z-50 bg-slate-800 border-b border-slate-700 shadow-md backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-[70px]">
        <BrandLogo />
        <div className="flex items-center gap-6">
          <span className="text-xs text-slate-400 font-medium px-3 py-1.5 bg-emerald-500/5 rounded">
            {user?.email}
          </span>
          <div className="flex items-center gap-3">
            {user?.role === 'User' && (
              <>
                <Link to="/profile" className="px-4 py-2 text-sm font-medium text-slate-300 rounded hover:text-emerald-400 hover:bg-emerald-500/8 transition-colors duration-150 no-underline uppercase tracking-wide">
                  Profile
                </Link>
                <Link to="/workout" className="px-4 py-2 text-sm font-medium text-slate-300 rounded hover:text-emerald-400 hover:bg-emerald-500/8 transition-colors duration-150 no-underline uppercase tracking-wide">
                  Workout
                </Link>
                <Link to="/progress" className="px-4 py-2 text-sm font-medium text-slate-300 rounded hover:text-emerald-400 hover:bg-emerald-500/8 transition-colors duration-150 no-underline uppercase tracking-wide">
                  Progress
                </Link>
              </>
            )}
            {user?.role === 'Admin' && (
              <Link to="/admin" className="px-4 py-2 text-sm font-medium text-slate-300 rounded hover:text-emerald-400 hover:bg-emerald-500/8 transition-colors duration-150 no-underline uppercase tracking-wide">
                Admin
              </Link>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-white bg-red-500 rounded hover:bg-red-600 hover:-translate-y-px active:translate-y-0 transition-all duration-150 cursor-pointer border-0"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
