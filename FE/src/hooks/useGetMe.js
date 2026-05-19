import { useEffect, useState } from 'react';
import useAuthStore from '../stores/auth.store';
import authService from '../services/auth.service';

export function useGetMe() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated, user } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
  }));
  const { setUser } = useAuthStore();

  useEffect(() => {
    // Only fetch if authenticated but user data is missing (e.g., after page reload)
    if (isAuthenticated && !user.userId) {
      setLoading(true);
      setError(null);

      authService
        .getMe()
        .then((result) => {
          setUser(result.user);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to fetch user');
          setLoading(false);
          // Don't clear auth state; API interceptor will handle 401
        });
    }
  }, [isAuthenticated, user.userId, setUser]);

  return { loading, error };
}
