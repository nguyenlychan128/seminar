import { useCallback } from 'react';
import authService from '../services/auth.service';

export function useRegister() {
  const register = useCallback(async (email, password, confirmPassword) => {
    const result = await authService.register(email, password, confirmPassword);
    return result;
  }, []);

  return register;
}
