import { useEffect } from 'react';
import useUserStore from '../stores/user.store';
import useAuthStore from '../stores/auth.store';

const useUserProfile = () => {
  const { profile, isLoading, error, fetchProfile, createProfile, updateProfile, clearProfile } =
    useUserStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && profile === null) {
      fetchProfile();
    }
  }, [isAuthenticated, profile, fetchProfile]);

  const hasProfile = Boolean(profile);
  const isUnderweight = profile?.bodyClassification === 'underweight';

  return {
    profile,
    isLoading,
    error,
    hasProfile,
    isUnderweight,
    fetchProfile,
    createProfile,
    updateProfile,
    clearProfile,
  };
};

export default useUserProfile;
