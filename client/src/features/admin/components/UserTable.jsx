// client/src/features/admin/components/UserTable.jsx
export default function UserTable({ users, onSuspend, onActivate, onDelete, tokens = {} }) {
  const border = tokens['--border'] || '#E1D9C8';
  const textPrimary = tokens['--text-primary'] || '#173B32';
  const textSecondary = tokens['--text-secondary'] || '#5B6B5F';
  const textMuted = tokens['--text-muted'] || '#9C8F73';
  const accentEta = tokens['--accent-eta'] || '#D59A3A';
  const critical = tokens['--accent-critical'] || '#B94A3A';
  const badgeSuccessBg = tokens['--badge-success-bg'] || '#EAF3DE';
  const badgeSuccessText = tokens['--badge-success-text'] || '#3B6D26';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: `1px solid ${border}` }}>
            <th className="pb-2 pr-4 text-left text-xs font-medium" style={{ color: textMuted }}>Name</th>
            <th className="pb-2 pr-4 text-left text-xs font-medium" style={{ color: textMuted }}>Email</th>
            <th className="pb-2 pr-4 text-left text-xs font-medium" style={{ color: textMuted }}>Role</th>
            <th className="pb-2 pr-4 text-left text-xs font-medium" style={{ color: textMuted }}>Status</th>
            <th className="pb-2 pr-4 text-left text-xs font-medium" style={{ color: textMuted }}>Joined</th>
            <th className="pb-2 text-left text-xs font-medium" style={{ color: textMuted }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} style={{ borderBottom: `1px solid ${border}` }}>
              <td className="py-2.5 pr-4" style={{ color: textPrimary }}>{u.name}</td>
              <td className="py-2.5 pr-4" style={{ color: textSecondary }}>{u.email}</td>
              <td className="py-2.5 pr-4 capitalize" style={{ color: textSecondary }}>{u.role}</td>
              <td className="py-2.5 pr-4">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={
                    u.isSuspended
                      ? { backgroundColor: critical + '1A', color: critical }
                      : { backgroundColor: badgeSuccessBg, color: badgeSuccessText }
                  }
                >
                  {u.isSuspended ? 'Suspended' : 'Active'}
                </span>
              </td>
              <td className="py-2.5 pr-4" style={{ color: textSecondary }}>
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="py-2.5 flex gap-3">
                {u.isSuspended ? (
                  <button onClick={() => onActivate(u._id)} className="text-xs font-medium hover:underline" style={{ color: accentEta }}>
                    Activate
                  </button>
                ) : (
                  <button onClick={() => onSuspend(u._id)} className="text-xs font-medium hover:underline" style={{ color: accentEta }}>
                    Suspend
                  </button>
                )}
                <button onClick={() => onDelete(u._id)} className="text-xs font-medium hover:underline" style={{ color: critical }}>
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