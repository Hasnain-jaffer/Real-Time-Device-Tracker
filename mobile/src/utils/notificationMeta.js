// mobile/src/utils/notificationMeta.js
import React from 'react';
import Svg, { Path, Circle, Line } from 'react-native-svg';

// Icon components for each notification type
export const NotificationIcon = ({ type, size = 24, color = '#000' }) => {
  switch (type) {
    case 'device-offline':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
          <Line x1="12" y1="2" x2="12" y2="12" />
        </Svg>
      );
    case 'system-message':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
          <Line x1="12" y1="8" x2="12" y2="12" />
          <Line x1="12" y1="16" x2="12.01" y2="16" />
        </Svg>
      );
    case 'security-alert':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <Line x1="12" y1="8" x2="12" y2="12" />
          <Line x1="12" y1="16" x2="12.01" y2="16" />
        </Svg>
      );
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </Svg>
      );
  }
};

// Metadata for each notification type
export function notificationMeta(type, colors) {
  switch (type) {
    case 'device-offline':
      return {
        color: colors.critical,
        bgColor: colors.critical + '15',
        label: 'Offline',
      };
    case 'system-message':
      return {
        color: colors.eta,
        bgColor: colors.eta + '15',
        label: 'System',
      };
    case 'security-alert':
      return {
        color: colors.critical,
        bgColor: colors.critical + '15',
        label: 'Security',
      };
    default:
      return {
        color: colors.accent,
        bgColor: colors.accentBg,
        label: 'Info',
      };
  }
}