import React, { useState, useEffect } from 'react';

export function validateProfileForm(values) {
  const errors = {};
  const height = Number(values.height);
  const weight = Number(values.weight);
  const age = Number(values.age);

  if (values.height === '' || values.height === null || values.height === undefined) {
    errors.height = 'Please enter your height';
  } else if (isNaN(height) || !isFinite(height)) {
    errors.height = 'Invalid height value';
  } else if (height < 100 || height > 250) {
    errors.height = 'Height must be between 100 and 250 cm';
  }

  if (values.weight === '' || values.weight === null || values.weight === undefined) {
    errors.weight = 'Please enter your weight';
  } else if (isNaN(weight) || !isFinite(weight)) {
    errors.weight = 'Invalid weight value';
  } else if (weight < 20 || weight > 300) {
    errors.weight = 'Weight must be between 20 and 300 kg';
  }

  if (values.age === '' || values.age === null || values.age === undefined) {
    errors.age = 'Please enter your age';
  } else if (isNaN(age) || !isFinite(age)) {
    errors.age = 'Invalid age value';
  } else if (!Number.isInteger(age) || String(values.age).includes('.')) {
    errors.age = 'Age must be a whole number';
  } else if (age < 10 || age > 100) {
    errors.age = 'Age must be between 10 and 100';
  }

  if (!values.gender || (values.gender !== 'male' && values.gender !== 'female')) {
    errors.gender = 'Please select your gender';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

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

export default function ProfileForm({ initialValues = {}, onSubmit, isLoading = false, submitLabel = 'Save' }) {
  const [values, setValues] = useState({
    height: initialValues.height ?? '',
    weight: initialValues.weight ?? '',
    age: initialValues.age ?? '',
    gender: initialValues.gender ?? '',
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  // Sync when initialValues change (edit flow: data loads async)
  const ivHeight = initialValues.height;
  const ivWeight = initialValues.weight;
  const ivAge = initialValues.age;
  const ivGender = initialValues.gender;
  useEffect(() => {
    setValues({
      height: ivHeight ?? '',
      weight: ivWeight ?? '',
      age: ivAge ?? '',
      gender: ivGender ?? '',
    });
    setTouched({});
    setErrors({});
  }, [ivHeight, ivWeight, ivAge, ivGender]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const { errors: newErrors } = validateProfileForm(values);
    setErrors(newErrors);
  };

  const handleChange = (field, value) => {
    const updated = { ...values, [field]: value };
    setValues(updated);
    if (touched[field]) {
      const { errors: newErrors } = validateProfileForm(updated);
      setErrors(newErrors);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;

    const allTouched = { height: true, weight: true, age: true, gender: true };
    setTouched(allTouched);

    const { isValid, errors: newErrors } = validateProfileForm(values);
    setErrors(newErrors);
    if (!isValid) return;

    onSubmit({
      height: Number(values.height),
      weight: Number(values.weight),
      age: Number(values.age),
      gender: values.gender,
    });
  };

  const showError = (field) => touched[field] && errors[field];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Height */}
      <div>
        <label htmlFor="height" className="mb-1.5 block text-sm font-medium text-slate-300 tracking-wide">
          Height (cm)
        </label>
        <input
          id="height"
          type="number"
          inputMode="decimal"
          placeholder="e.g. 165"
          value={values.height}
          onChange={(e) => handleChange('height', e.target.value)}
          onBlur={() => handleBlur('height')}
          disabled={isLoading}
          aria-required="true"
          aria-describedby={showError('height') ? 'height-error' : undefined}
          className={showError('height') ? errorInputClass : inputClass}
        />
        {showError('height') && <FieldError id="height-error" message={errors.height} />}
      </div>

      {/* Weight */}
      <div>
        <label htmlFor="weight" className="mb-1.5 block text-sm font-medium text-slate-300 tracking-wide">
          Weight (kg)
        </label>
        <input
          id="weight"
          type="number"
          inputMode="decimal"
          placeholder="e.g. 55"
          value={values.weight}
          onChange={(e) => handleChange('weight', e.target.value)}
          onBlur={() => handleBlur('weight')}
          disabled={isLoading}
          aria-required="true"
          aria-describedby={showError('weight') ? 'weight-error' : undefined}
          className={showError('weight') ? errorInputClass : inputClass}
        />
        {showError('weight') && <FieldError id="weight-error" message={errors.weight} />}
      </div>

      {/* Age */}
      <div>
        <label htmlFor="age" className="mb-1.5 block text-sm font-medium text-slate-300 tracking-wide">
          Age
        </label>
        <input
          id="age"
          type="number"
          inputMode="numeric"
          placeholder="e.g. 22"
          value={values.age}
          onChange={(e) => handleChange('age', e.target.value)}
          onBlur={() => handleBlur('age')}
          disabled={isLoading}
          aria-required="true"
          aria-describedby={showError('age') ? 'age-error' : undefined}
          className={showError('age') ? errorInputClass : inputClass}
        />
        {showError('age') && <FieldError id="age-error" message={errors.age} />}
      </div>

      {/* Gender */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-300 tracking-wide">Gender</p>
        <div className="flex gap-3">
          {[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ].map(({ value, label }) => (
            <label
              key={value}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-150 ${
                values.gender === value
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                  : 'border-slate-600 bg-slate-700/40 text-slate-400 hover:border-slate-500 hover:text-slate-300'
              } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <input
                type="radio"
                name="gender"
                value={value}
                checked={values.gender === value}
                onChange={() => handleChange('gender', value)}
                onBlur={() => handleBlur('gender')}
                disabled={isLoading}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
        {showError('gender') && <FieldError id="gender-error" message={errors.gender} />}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold uppercase tracking-wide text-white transition-all duration-150 hover:bg-emerald-500 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <span role="status" aria-label="Processing" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span>Saving...</span>
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
