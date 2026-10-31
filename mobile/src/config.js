// mobile/src/config.js
const RAW = process.env.EXPO_PUBLIC_API_URL || 'https://real-time-device-tracker-79u1.onrender.com';

export const API_ORIGIN = RAW.replace(/\/+$/, '').replace(/\/api$/, '');
export const API_BASE = `${API_ORIGIN}/api`;