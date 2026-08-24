// client/src/pages/NotificationsPage.jsx
import { useEffect, useState } from 'react';
import apiClient from '../lib/apiClient';
import { useSocket } from '../app/SocketProvider';
import { useTheme } from '../app/ThemeContext';

/* ─── SVG Icons ─── */
const IconBell = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconSignal = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" /><path d="M17 20V8" /><path d="M22 4v16" />
  </svg>
);

const IconCircle = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const IconShieldAlert = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconClock = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconMapPin = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconEnter = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

const IconExit = ({ size = 18, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconEmpty = ({ size = 40, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconCheckDouble = ({ size = 14, className = '', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <polyline points="18 6 11 13 7 9" /><polyline points="12 13 15 16 21 10" />
  </svg>
);

/* ─── Tokens ─── */
const lightTokens = {
  '--bg-page': '#F4EFE6',
  '--bg-surface': '#FFFFFF',
  '--border': '#E1D9C8',
  '--text-primary': '#173B32',
  '--text-secondary': '#5B6B5F',
  '--text-muted': '#9C8F73',
  '--accent-primary': '#5E8C61',
  '--accent-eta': '#D59A3A',
  '--accent-critical': '#B94A3A',
  '--badge-success-bg': '#EAF3DE',
  '--badge-success-text': '#3B6D26',
};

const darkTokens = {
  '--bg-page': '#12181A',
  '--bg-surface': '#182220',
  '--border': '#263531',
  '--text-primary': '#F1EEE4',
  '--text-secondary': '#8A9690',
  '--text-muted': '#6E7C73',
  '--accent-primary': '#79B37C',
  '--accent-eta': '#E3B15E',
  '--accent-critical': '#C15D4C',
  '--badge-success-bg': 'rgba(94,140,97,0.15)',
  '--badge-success-text': '#79B37C',
};

const cardShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';

function getNotificationMeta(type) {
  switch (type) {
    case 'device-online':
      return { Icon: IconSignal, tint: 'var(--accent-primary)', label: 'Online' };
    case 'device-offline':
      return { Icon: IconCircle, tint: 'var(--text-muted)', label: 'Offline' };
    case 'security-alert':
      return { Icon: IconShieldAlert, tint: 'var(--accent-critical)', label: 'Security' };
    case 'system-message':
      return { Icon: IconClock, tint: 'var(--accent-eta)', label: 'System' };
    case 'location-update':
      return { Icon: IconMapPin, tint: 'var(--accent-primary)', label: 'Location' };
    case 'geofence-enter':
      return { Icon: IconEnter, tint: 'var(--accent-primary)', label: 'Arrived' };
    case 'geofence-exit':
      return { Icon: IconExit, tint: 'var(--accent-eta)', label: 'Departed' };
    default:
      return { Icon: IconBell, tint: 'var(--text-muted)', label: 'Notification' };
  }
}

export default function NotificationsPage() {
  const { theme } = useTheme();
  const { socket } = useSocket();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  function fetchNotifications() {
    setIsLoading(true);
    apiClient
      .get('/notifications')
      .then(({ data }) => setNotifications(data.notifications))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    function handleNewNotification(notif) {
      setNotifications((prev) => [notif, ...prev]);
    }
    socket.on('notification', handleNewNotification);
    return () => socket.off('notification', handleNewNotification);
  }, [socket]);

  async function handleMarkRead(id) {
    await apiClient.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
  }

  async function handleMarkAllRead() {
    await apiClient.patch('/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ ...tokens, backgroundColor: 'var(--bg-page)' }} className="flex-1 w-full p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Notifications
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up'}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 transition-opacity flex-shrink-0"
              style={{ color: 'var(--accent-primary)' }}
            >
              <IconCheckDouble size={14} />
              Mark all as read
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl animate-pulse"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center flex flex-col items-center"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: cardShadow }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--bg-page)' }}
            >
              <IconEmpty size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              No notifications yet
            </p>
            <p className="text-[11px] mt-1 max-w-xs" style={{ color: 'var(--text-muted)' }}>
              You'll see security alerts, device status changes, and stop arrivals here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {notifications.map((n) => {
              const { Icon, tint } = getNotificationMeta(n.type);
              const isUnread = !n.isRead;

              return (
                <li
                  key={n._id}
                  onClick={() => isUnread && handleMarkRead(n._id)}
                  className="rounded-2xl p-4 sm:p-5 flex items-start gap-4 transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: `1px solid ${isUnread ? tint + '40' : 'var(--border)'}`,
                    borderLeftWidth: '3px',
                    borderLeftColor: isUnread ? tint : 'transparent',
                    boxShadow: cardShadow,
                    opacity: n.isRead ? 0.72 : 1,
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: tint + '18', color: tint }}
                  >
                    <Icon size={18} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {n.title}
                    </p>
                    <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {n.message}
                    </p>
                    <p className="text-[11px] font-medium mt-2" style={{ color: 'var(--text-muted)' }}>
                      {new Date(n.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {isUnread && (
                    <div className="flex-shrink-0 mt-2">
                      <span
                        className="block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: tint, boxShadow: `0 0 8px ${tint}60` }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}