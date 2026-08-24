// client/src/features/admin/components/UserTable.jsx
import { useState } from 'react';

/* ─── SVG Icons ─── */
const IconBan = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);

const IconCheck = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconTrash = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconAdmin = ({ size = 12, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export default function UserTable({ users, onSuspend, onActivate, onDelete, tokens = {} }) {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const border = tokens['--border'] || '#E1D9C8';
  const textPrimary = tokens['--text-primary'] || '#173B32';
  const textSecondary = tokens['--text-secondary'] || '#5B6B5F';
  const textMuted = tokens['--text-muted'] || '#9C8F73';
  const accentEta = tokens['--accent-eta'] || '#D59A3A';
  const critical = tokens['--accent-critical'] || '#B94A3A';
  const badgeSuccessBg = tokens['--badge-success-bg'] || '#EAF3DE';
  const badgeSuccessText = tokens['--badge-success-text'] || '#3B6D26';
  const accentPrimary = tokens['--accent-primary'] || '#5E8C61';
  const page = tokens['--bg-page'] || '#F4EFE6';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: `1px solid ${border}` }}>
            <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: textMuted }}>User</th>
            <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: textMuted }}>Role</th>
            <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: textMuted }}>Status</th>
            <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: textMuted }}>Joined</th>
            <th className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: textMuted }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} style={{ borderBottom: `1px solid ${border}` }}>
              {/* User: avatar + name + email subtitle */}
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      backgroundColor: u.role === 'admin' ? accentPrimary + '20' : page,
                      color: u.role === 'admin' ? accentPrimary : textPrimary,
                      border: `1px solid ${u.role === 'admin' ? accentPrimary + '30' : border}`,
                    }}
                  >
                    {u.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: textPrimary }}>{u.name}</p>
                    <p className="text-[11px] truncate" style={{ color: textMuted }}>{u.email}</p>
                  </div>
                </div>
              </td>

              {/* Role */}
              <td className="py-3 pr-4">
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{
                    backgroundColor: u.role === 'admin' ? accentPrimary + '15' : page,
                    color: u.role === 'admin' ? accentPrimary : textSecondary,
                    border: `1px solid ${u.role === 'admin' ? accentPrimary + '25' : border}`,
                  }}
                >
                  {u.role === 'admin' && <IconAdmin size={11} />}
                  <span className="capitalize">{u.role}</span>
                </span>
              </td>

              {/* Status */}
              <td className="py-3 pr-4">
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={
                    u.isSuspended
                      ? { backgroundColor: critical + '15', color: critical }
                      : { backgroundColor: badgeSuccessBg, color: badgeSuccessText }
                  }
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: u.isSuspended ? critical : badgeSuccessText }}
                  />
                  {u.isSuspended ? 'Suspended' : 'Active'}
                </span>
              </td>

              {/* Joined */}
              <td className="py-3 pr-4 text-xs font-medium" style={{ color: textSecondary }}>
                {new Date(u.createdAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' })}
              </td>

              {/* Actions */}
              <td className="py-3">
                {deleteConfirmId === u._id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium" style={{ color: critical }}>Delete?</span>
                    <button
                      onClick={() => { onDelete(u._id); setDeleteConfirmId(null); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: critical }}
                    >
                      <IconTrash size={12} />
                      Yes
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-black/[0.03] transition-colors"
                      style={{ color: textSecondary, border: `1px solid ${border}` }}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {u.isSuspended ? (
                      <button
                        onClick={() => onActivate(u._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
                        style={{ color: accentEta, border: `1px solid ${accentEta}40`, backgroundColor: accentEta + '10' }}
                      >
                        <IconCheck size={12} />
                        Activate
                      </button>
                    ) : (
                      <button
                        onClick={() => onSuspend(u._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
                        style={{ color: accentEta, border: `1px solid ${accentEta}40`, backgroundColor: accentEta + '10' }}
                      >
                        <IconBan size={12} />
                        Suspend
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteConfirmId(u._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:opacity-80"
                      style={{ color: critical, border: `1px solid ${critical}40`, backgroundColor: critical + '10' }}
                    >
                      <IconTrash size={12} />
                      Delete
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}