export default function UsersTable({ users = [], onDeactivate }) {
  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-slate-800">
          <tr>
            <th className="text-left px-6 py-3 text-sm font-semibold text-emerald-400">Email</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-emerald-400">Role</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-emerald-400">Status</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-emerald-400">Created</th>
            <th className="text-left px-6 py-3 text-sm font-semibold text-emerald-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="border-b border-slate-700 hover:bg-slate-800 transition-colors">
              <td className="px-6 py-4 text-slate-200">{user.email}</td>
              <td className="px-6 py-4 text-slate-300 capitalize">{user.role}</td>
              <td className="px-6 py-4">
                <span className={user.isDeleted ? 'text-red-400' : 'text-emerald-400'}>
                  {user.isDeleted ? 'Inactive' : 'Active'}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-300 text-sm">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4">
                {user.role !== 'Admin' && (
                  <button
                    onClick={() => onDeactivate(user._id, user.email, user.isDeleted ? 'reactivate' : 'deactivate')}
                    className={`px-3 py-1 text-sm text-white rounded transition-colors ${
                      user.isDeleted
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                  {user.isDeleted ? 'Reactivate' : 'Deactivate'}
                </button>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
