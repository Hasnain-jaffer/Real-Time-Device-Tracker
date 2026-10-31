// mobile/src/utils/notificationMeta.js
import { NotificationIcon } from '../components/Icons';

const META = {
  'geofence-enter': { icon: 'map-pin', tone: 'accent' },
  'geofence-exit': { icon: 'map-pin', tone: 'accent' },
  'device-offline': { icon: 'alert', tone: 'critical' },
  'device-online': { icon: 'check-circle', tone: 'accent' },
  'system-message': { icon: 'clock', tone: 'eta' },
  'security-alert': { icon: 'shield', tone: 'critical' },
  'location-update': { icon: 'map-pin', tone: 'accent' },
};

export function notificationMeta(type, colors) {
  const m = META[type] || { icon: 'bell', tone: 'accent' };
  return { icon: m.icon, color: colors[m.tone] };
}

export function NotificationTypeIcon({ type, size = 22, color }) {
  const meta = notificationMeta(type, { accent: color, critical: color, eta: color });
  return <NotificationIcon type={type} size={size} color={color} />;
}