import { useCallback } from 'react';
import useAuthStore from '../stores/auth.store';
import authService from '../services/auth.service';

export function useLogin() {
  const { setTokens, setUser, setLoading, setError } = useAuthStore();

  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      setError(null);

      try {
        const result = await authService.login(email, password);

        setTokens(result.accessToken, result.refreshToken);
        setUser(result.user);
        setLoading(false);

        return result;
      } catch (err) {
        setError(err.message || 'Login failed');
        setLoading(false);
        throw err;
      }
    },
    [setTokens, setUser, setLoading, setError]
  );

  return login;
}
