// client/src/features/admin/components/UserTable.jsx
export default function UserTable({ users, onSuspend, onActivate, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
            <th className="pb-2 pr-4">Name</th>
            <th className="pb-2 pr-4">Email</th>
            <th className="pb-2 pr-4">Role</th>
            <th className="pb-2 pr-4">Status</th>
            <th className="pb-2 pr-4">Joined</th>
            <th className="pb-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-b border-gray-100 dark:border-gray-900 last:border-0">
              <td className="py-2.5 pr-4">{u.name}</td>
              <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">{u.email}</td>
              <td className="py-2.5 pr-4 capitalize">{u.role}</td>
              <td className="py-2.5 pr-4">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    u.isSuspended
                      ? 'bg-danger/10 text-danger'
                      : 'bg-success/10 text-success'
                  }`}
                >
                  {u.isSuspended ? 'Suspended' : 'Active'}
                </span>
              </td>
              <td className="py-2.5 pr-4 text-gray-500 dark:text-gray-400">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="py-2.5 flex gap-2">
                {u.isSuspended ? (
                  <button
                    onClick={() => onActivate(u._id)}
                    className="text-xs text-success hover:underline"
                  >
                    Activate
                  </button>
                ) : (
                  <button
                    onClick={() => onSuspend(u._id)}
                    className="text-xs text-warning hover:underline"
                  >
                    Suspend
                  </button>
                )}
                <button
                  onClick={() => onDelete(u._id)}
                  className="text-xs text-danger hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}