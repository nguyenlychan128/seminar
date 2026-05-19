import { useEffect, useState } from 'react';
import useAdminStore from '../../stores/adminStore';
import UsersTable from './components/UsersTable';
import DeactivateUserModal from './components/DeactivateUserModal';

export default function UsersPage() {
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const {
    users,
    usersLoading,
    usersError,
    usersPagination,
    usersFilters,
    fetchUsers,
    setUsersFilters,
    clearUsersError,
    deactivateUserModal,
    openDeactivateUserModal,
    closeDeactivateUserModal,
    performDeactivateUser,
    performReactivateUser,
  } = useAdminStore();

  useEffect(() => {
    fetchUsers(1, usersFilters);
  }, []);

  const handleEmailFilterChange = (e) => {
    const email = e.target.value;
    setUsersFilters({ email });
    fetchUsers(1, { ...usersFilters, email });
  };

  const handleStatusFilterChange = (e) => {
    const status = e.target.value;
    setUsersFilters({ status });
    fetchUsers(1, { ...usersFilters, status });
  };

  const handleDeactivateClick = (userId, userEmail, action) => {
    openDeactivateUserModal(userId, userEmail, action);
  };

  const handleConfirmDeactivate = async () => {
    setDeactivateLoading(true);
    try {
      if (deactivateUserModal.action === 'reactivate') {
        await performReactivateUser(deactivateUserModal.userId);
      } else {
        await performDeactivateUser(deactivateUserModal.userId);
      }
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (usersPagination.page > 1) {
      fetchUsers(usersPagination.page - 1, usersFilters);
    }
  };

  const handleNextPage = () => {
    if (usersPagination.page < usersPagination.pages) {
      fetchUsers(usersPagination.page + 1, usersFilters);
    }
  };

  const handlePageClick = (page) => {
    fetchUsers(page, usersFilters);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-emerald-400 mb-2">Users Management</h1>
        <p className="text-slate-400">View and manage all users in the system</p>
      </div>

      {/* Error Toast */}
      {usersError && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded flex justify-between items-center">
          <span>{usersError}</span>
          <button
            onClick={clearUsersError}
            className="text-red-400 hover:text-red-300 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Search by Email
            </label>
            <input
              type="text"
              value={usersFilters.email}
              onChange={handleEmailFilterChange}
              placeholder="e.g., user@example.com"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Status
            </label>
            <select
              value={usersFilters.status}
              onChange={handleStatusFilterChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 focus:outline-none focus:border-emerald-400"
            >
              <option value="active">Active</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {usersLoading && !users.length ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
            <UsersTable
              users={users}
              onDeactivate={handleDeactivateClick}
            />
          </div>

          {/* Pagination */}
          {usersPagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={usersPagination.page === 1}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded disabled:opacity-50"
              >
                Previous
              </button>

              {Array.from({ length: usersPagination.pages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageClick(page)}
                    className={`px-3 py-2 rounded ${
                      usersPagination.page === page
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={handleNextPage}
                disabled={usersPagination.page === usersPagination.pages}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Deactivate/Reactivate Modal */}
      <DeactivateUserModal
        open={deactivateUserModal.open}
        userEmail={deactivateUserModal.userEmail}
        action={deactivateUserModal.action}
        loading={deactivateLoading}
        error={usersError}
        onConfirm={handleConfirmDeactivate}
        onCancel={closeDeactivateUserModal}
      />
    </div>
  );
}
