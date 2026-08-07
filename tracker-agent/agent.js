// tracker-agent/agent.js
import 'dotenv/config';
import { io } from 'socket.io-client';
import { createSimulateProvider } from './locationProviders/simulateProvider.js';
import { createGpsProvider } from './locationProviders/gpsProvider.js';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const DEVICE_KEY = process.env.DEVICE_KEY;
const REPORT_INTERVAL_MS = Number(process.env.REPORT_INTERVAL_MS) || 5000;
const LOCATION_SOURCE = process.env.LOCATION_SOURCE || 'simulate';

if (!DEVICE_KEY || DEVICE_KEY === 'dev_your_device_key_here') {
  console.error('[agent] Missing DEVICE_KEY. Set it in .env — get it from Device Center in the app.');
  process.exit(1);
}

function getLocationProvider() {
  if (LOCATION_SOURCE === 'gps') {
    return createGpsProvider();
  }
  return createSimulateProvider({
    startLat: Number(process.env.SIMULATE_START_LAT) || 25.4610,
    startLng: Number(process.env.SIMULATE_START_LNG) || 68.7183,
    wanderMeters: Number(process.env.SIMULATE_WANDER_METERS) || 50,
  });
}

const getLocation = getLocationProvider();

console.log('[agent] Starting TrackSphere Tracker Agent');
console.log(`[agent] Server: ${SERVER_URL}`);
console.log(`[agent] Location source: ${LOCATION_SOURCE}`);
console.log(`[agent] Report interval: ${REPORT_INTERVAL_MS}ms`);

const socket = io(SERVER_URL, {
  auth: { deviceKey: DEVICE_KEY },
  reconnection: true,
  reconnectionDelay: 2000,
  reconnectionAttempts: Infinity,
});

let reportTimer = null;

socket.on('connect', () => {
  console.log(`[agent] Connected to server (socket id: ${socket.id})`);
  startReporting();
});

socket.on('disconnect', (reason) => {
  console.warn(`[agent] Disconnected: ${reason}. Will attempt to reconnect...`);
  stopReporting();
});

socket.on('connect_error', (err) => {
  console.error('[agent] Connection error:', err.message);
});

function startReporting() {
  stopReporting();
  reportTimer = setInterval(() => {
    try {
      const { latitude, longitude } = getLocation();
      socket.emit('send-location', { latitude, longitude });
      console.log(`[agent] Reported location: ${latitude}, ${longitude}`);
    } catch (err) {
      console.error('[agent] Failed to get/report location:', err.message);
    }
  }, REPORT_INTERVAL_MS);
}

function stopReporting() {
  if (reportTimer) {
    clearInterval(reportTimer);
    reportTimer = null;
  }
}

process.on('SIGINT', () => {
  console.log('\n[agent] Shutting down...');
  stopReporting();
  socket.disconnect();
  process.exit(0);
});