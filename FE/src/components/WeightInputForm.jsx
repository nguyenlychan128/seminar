import { useState, useEffect } from 'react';
import { useProgress } from '../hooks/useProgress';

const inputClass =
  'w-full rounded-lg bg-slate-700/60 border border-slate-600 px-4 py-3 text-base text-slate-100 placeholder-slate-500 ' +
  'focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors duration-150 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const errorInputClass =
  'w-full rounded-lg bg-slate-700/60 border border-red-500/70 px-4 py-3 text-base text-slate-100 placeholder-slate-500 ' +
  'focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-500/50 transition-colors duration-150 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1.5 text-sm text-red-400">
      <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </p>
  );
}

function SuccessToast({ message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/50 p-4 text-emerald-300">
      <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export default function WeightInputForm({ onSuccess }) {
  const { logWeight, loading: hookLoading } = useProgress();
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Initialize date with today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
  }, []);

  const validateForm = () => {
    const newErrors = {};

    // Validate weight
    if (!weight || weight.trim() === '') {
      newErrors.weight = 'Weight is required';
    } else {
      const weightNum = parseFloat(weight);
      if (isNaN(weightNum)) {
        newErrors.weight = 'Weight must be a number';
      } else if (weightNum < 30 || weightNum > 200) {
        newErrors.weight = 'Weight must be between 30-200 kg';
      }
    }

    // Validate date
    if (!date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        newErrors.date = 'Date cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await logWeight(parseFloat(weight), date);
      setWeight('');
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setErrors({});
      setShowSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      if (error.code === 'DUPLICATE_ENTRY') {
        setSubmitError('Weight entry already exists for this date');
      } else {
        setSubmitError(error.message || 'Failed to log weight');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
      <h3 className="mb-6 text-lg font-semibold text-slate-200">Log Weight</h3>

      {showSuccess && <SuccessToast message="Weight logged successfully!" onDismiss={() => setShowSuccess(false)} />}

      {submitError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-500/20 border border-red-500/50 p-4 text-red-300">
          <svg className="h-5 w-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-medium">{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Weight input */}
        <div>
          <label htmlFor="weight" className="block mb-2 text-sm font-medium text-slate-300">
            Weight (kg) *
          </label>
          <input
            id="weight"
            type="text"
            inputMode="decimal"
            placeholder="e.g., 65.5"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              if (errors.weight) setErrors((prev) => ({ ...prev, weight: '' }));
            }}
            onBlur={() => validateForm()}
            disabled={loading}
            className={errors.weight ? errorInputClass : inputClass}
            aria-describedby={errors.weight ? 'weight-error' : undefined}
          />
          <FieldError id="weight-error" message={errors.weight} />
        </div>

        {/* Date input */}
        <div>
          <label htmlFor="date" className="block mb-2 text-sm font-medium text-slate-300">
            Date *
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
            }}
            onBlur={() => validateForm()}
            disabled={loading}
            className={errors.date ? errorInputClass : inputClass}
            aria-describedby={errors.date ? 'date-error' : undefined}
          />
          <FieldError id="date-error" message={errors.date} />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || hookLoading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition-all duration-200 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading || hookLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Logging...
            </>
          ) : (
            'Log Weight'
          )}
        </button>
      </form>
    </div>
  );
}
