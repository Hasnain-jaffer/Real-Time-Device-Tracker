// client/src/pages/NotificationsPage.jsx
import { useEffect, useState } from 'react';
import apiClient from '../lib/apiClient';
import { useSocket } from '../app/SocketProvider';

const TYPE_ICONS = {
  'device-online': '🟢',
  'device-offline': '⚪',
  'security-alert': '🔒',
  'system-message': '⏱️',
  'location-update': '📍',
  'geofence-enter': '🚏',
  'geofence-exit': '👋',
};

export default function NotificationsPage() {
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

  const { socket } = useSocket();

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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <button
          onClick={handleMarkAllRead}
          className="text-sm text-primary hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="glass rounded-2xl shadow-soft p-8 text-center text-gray-500 dark:text-gray-400">
          No notifications yet. You'll see security alerts and device status changes here.
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n._id}
              onClick={() => !n.isRead && handleMarkRead(n._id)}
              className={`glass rounded-xl shadow-soft p-4 flex gap-3 cursor-pointer transition ${
                n.isRead ? 'opacity-60' : ''
              }`}
            >
              <span className="text-xl">{TYPE_ICONS[n.type] || '🔔'}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{n.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}