import { useState } from 'react';

export default function DeactivateUserModal({
  open,
  userEmail,
  action = 'deactivate',
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const isReactivate = action === 'reactivate';
  const title = isReactivate ? 'Reactivate User' : 'Deactivate User';
  const actionText = isReactivate ? 'reactivate' : 'deactivate';
  const description = isReactivate
    ? 'This user will be able to log in and access their account again.'
    : 'This user will no longer be able to log in or access their account.';
  const buttonText = isReactivate ? 'Reactivate' : 'Deactivate';
  const loadingText = isReactivate ? 'Reactivating...' : 'Deactivating...';
  const buttonClass = isReactivate ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-96 border border-slate-700">
        <h2 className="text-xl font-bold text-emerald-400 mb-4">{title}</h2>

        <p className="text-slate-300 mb-2">
          Are you sure you want to {actionText} <strong>{userEmail}</strong>?
        </p>
        <p className="text-slate-400 text-sm mb-6">
          {description}
        </p>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 ${buttonClass} text-white rounded transition-colors disabled:opacity-50`}
          >
            {loading ? loadingText : buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
