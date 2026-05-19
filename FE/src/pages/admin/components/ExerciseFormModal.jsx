import { useState, useEffect } from 'react';

const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
const EQUIPMENT_OPTIONS = ['barbell', 'dumbbell', 'bodyweight', 'cable', 'machine'];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'all'];

const EMPTY_FORM = {
  name: '',
  description: '',
  muscleGroup: '',
  equipment: '',
  difficulty: 'beginner',
  videoUrl: '',
};

const validateField = (field, value) => {
  switch (field) {
    case 'name':
      if (!value.trim()) return 'Name is required';
      if (value.length > 100) return 'Name must not exceed 100 characters';
      return '';
    case 'muscleGroup':
      if (!value) return 'Muscle group is required';
      return '';
    case 'equipment':
      if (!value) return 'Equipment is required';
      return '';
    default:
      return '';
  }
};

export default function ExerciseFormModal({
  open,
  mode = 'add',
  formData: initialData,
  loading = false,
  error = null,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        setFormData({
          name: initialData.name || '',
          description: initialData.description || '',
          muscleGroup: initialData.muscleGroup || '',
          equipment: initialData.equipment || '',
          difficulty: initialData.difficulty || 'beginner',
          videoUrl: initialData.videoUrl || '',
        });
      } else {
        setFormData(EMPTY_FORM);
      }
      setErrors({});
      setTouched({});
    }
  }, [open, mode, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const isFormValid = () => {
    const newErrors = {};
    ['name', 'muscleGroup', 'equipment'].forEach((field) => {
      newErrors[field] = validateField(field, formData[field]);
    });
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => !e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      muscleGroup: formData.muscleGroup,
      equipment: formData.equipment,
      difficulty: formData.difficulty,
      videoUrl: formData.videoUrl.trim() || null,
    };

    onSubmit(submitData);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl border border-slate-700">
        <h2 className="text-2xl font-bold text-emerald-400 mb-6">
          {mode === 'add' ? 'Add Exercise' : 'Edit Exercise'}
        </h2>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="e.g., Bench Press"
              className={`w-full px-4 py-2 bg-slate-700 border rounded text-slate-200 placeholder-slate-500 focus:outline-none ${
                touched.name && errors.name ? 'border-red-500' : 'border-slate-600 focus:border-emerald-400'
              }`}
            />
            {touched.name && errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional description"
              rows="3"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400 resize-none"
            />
          </div>

          {/* Muscle Group */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Muscle Group *
            </label>
            <select
              name="muscleGroup"
              value={formData.muscleGroup}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 bg-slate-700 border rounded text-slate-200 focus:outline-none ${
                touched.muscleGroup && errors.muscleGroup ? 'border-red-500' : 'border-slate-600 focus:border-emerald-400'
              }`}
            >
              <option value="">Select muscle group</option>
              {MUSCLE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group.charAt(0).toUpperCase() + group.slice(1)}
                </option>
              ))}
            </select>
            {touched.muscleGroup && errors.muscleGroup && <p className="text-red-400 text-xs mt-1">{errors.muscleGroup}</p>}
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Equipment *
            </label>
            <select
              name="equipment"
              value={formData.equipment}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 bg-slate-700 border rounded text-slate-200 focus:outline-none ${
                touched.equipment && errors.equipment ? 'border-red-500' : 'border-slate-600 focus:border-emerald-400'
              }`}
            >
              <option value="">Select equipment</option>
              {EQUIPMENT_OPTIONS.map((eq) => (
                <option key={eq} value={eq}>
                  {eq.charAt(0).toUpperCase() + eq.slice(1)}
                </option>
              ))}
            </select>
            {touched.equipment && errors.equipment && <p className="text-red-400 text-xs mt-1">{errors.equipment}</p>}
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Difficulty
            </label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 focus:outline-none focus:border-emerald-400"
            >
              {DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Video URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Video URL (YouTube/Vimeo)
            </label>
            <input
              type="text"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleChange}
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : mode === 'add' ? 'Create' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
