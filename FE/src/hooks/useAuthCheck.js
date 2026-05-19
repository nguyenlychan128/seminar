import { useEffect } from 'react';
import useAuthStore from '../stores/auth.store';

export function useAuthCheck() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
}
