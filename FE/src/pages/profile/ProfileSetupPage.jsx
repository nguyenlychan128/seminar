import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserProfile from '../../hooks/useUserProfile';
import ProfileForm from '../../components/profile/ProfileForm';
import BmiResultCard from '../../components/profile/BmiResultCard';

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const { profile, isLoading, hasProfile, createProfile } = useUserProfile();

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [bmiResult, setBmiResult] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isLoading && hasProfile) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, hasProfile, navigate]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubmit = async (formData) => {
    if (submitLoading) return;
    setSubmitLoading(true);
    setSubmitError('');
    setBmiResult(null);

    try {
      const result = await createProfile(formData);
      setBmiResult(result);
      setSuccessMessage('Profile saved successfully! Redirecting...');
      timerRef.current = setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (isLoading && !submitLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <span role="status" aria-label="Loading" className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500" />
          <p className="text-sm text-slate-400">Checking profile...</p>
        </div>
      </div>
    );
  }

  if (hasProfile) return null;

  return (
    <div className="min-h-screen bg-slate-900 px-4 py-12 sm:px-6">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-slate-100">
            Set Up Your Profile
          </h1>
          <p className="mt-2 text-base text-slate-400">
            Enter your body measurements so FitGainer can build your personalized plan
          </p>
        </div>

        <div className="mb-6">
          <BmiResultCard
            bmi={bmiResult?.bmi ?? null}
            bodyClassification={bmiResult?.bodyClassification ?? null}
          />
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          {successMessage && (
            <div role="status" aria-live="polite" className="mb-5 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

          {submitError && (
            <div role="alert" className="mb-5 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{submitError}</span>
            </div>
          )}

          <ProfileForm
            onSubmit={handleSubmit}
            isLoading={submitLoading}
            submitLabel="Save Profile"
          />
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Your data is used only to calculate BMI and generate a personalized workout plan.
        </p>
      </div>
    </div>
  );
}
