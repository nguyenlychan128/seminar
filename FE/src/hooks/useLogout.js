import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/auth.store';
import authService from '../services/auth.service';

export function useLogout() {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

  return async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API failed, clearing local state anyway', err);
    } finally {
      clearAuth();
      localStorage.removeItem('fitgainer_access_token');
      localStorage.removeItem('fitgainer_refresh_token');
      navigate('/', { replace: true });
    }
  };
}
