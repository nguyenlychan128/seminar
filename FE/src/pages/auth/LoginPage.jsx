import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLogin } from '../../hooks/useLogin';
import { useAuth } from '../../hooks/useAuth';
import { validateLoginForm } from '../../utils/validation';

const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  MISSING_FIELDS: 'Email and password are required.',
  LOGIN_ERROR: 'Login failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const redirectPath = user.role === 'Admin' ? '/admin' : '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    const errors = validateLoginForm(email, password);
    if (Object.keys(errors).length > 0) {
      const messages = [errors.email, errors.password].filter(Boolean);
      setError(messages.join(' '));
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.user.role === 'Admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const normalizedError = ERROR_MESSAGES[err.code] || 'Login failed. Please try again.';
      setError(normalizedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-[#1a1f3a] overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 800px 600px at 20% 50%, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />
      <div className="absolute pointer-events-none rounded-full" style={{ top: '-50%', right: '-20%', width: 600, height: 600, background: 'radial-gradient(ellipse 600px 600px, rgba(16,185,129,0.1) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      {/* Decorative blobs */}
      <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] rounded-full opacity-5 pointer-events-none animate-float" style={{ background: 'linear-gradient(135deg, #10b981 0%, #f59e0b 100%)' }} />
      <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-5 pointer-events-none animate-float-reverse" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)' }} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[480px] px-6">
        {/* Brand */}
        <div className="flex items-center justify-center gap-4 mb-16 animate-fade-in-down [animation-delay:0.1s]">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shrink-0">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M8 20C8 12.27 12.27 8 20 8C27.73 8 32 12.27 32 20C32 27.73 27.73 32 20 32C12.27 32 8 27.73 8 20Z" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M20 14V26M14 20H26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-[28px] font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent m-0">
            FitGainer
          </h2>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-12 shadow-[0_20px_25px_rgba(0,0,0,0.2)] backdrop-blur-sm animate-fade-in-up [animation-delay:0.2s]">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-slate-100 mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-sm text-slate-400 leading-relaxed">Log in to continue your fitness journey</p>
          </div>

          {error && (
            <div className="flex items-center gap-4 px-6 py-4 mb-6 bg-red-500/10 border border-red-500/50 rounded-lg text-red-300 text-sm animate-shake" role="alert">
              <svg className="shrink-0 w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                className="px-4 py-3 text-base bg-slate-700 text-slate-100 border border-slate-600 rounded-lg min-h-[44px] transition-all duration-150 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                className="px-4 py-3 text-base bg-slate-700 text-slate-100 border border-slate-600 rounded-lg min-h-[44px] transition-all duration-150 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.1)] disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              aria-label={loading ? 'Logging in, please wait' : 'Log In'}
              className="flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] text-sm font-bold uppercase tracking-wide text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg border-0 cursor-pointer transition-all duration-150 shadow-md mt-4 hover:not-disabled:from-emerald-600 hover:not-disabled:to-emerald-700 hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-lg active:not-disabled:translate-y-0 disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  <span>Logging in...</span>
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          <div className="text-center border-t border-slate-700 pt-6">
            <p className="text-sm text-slate-400 leading-relaxed">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-400 font-semibold no-underline hover:text-emerald-300 hover:underline transition-colors duration-150">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
