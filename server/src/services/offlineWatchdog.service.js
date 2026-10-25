// server/src/services/offlineWatchdog.service.js
import Device from '../models/device.model.js';
import { markDeviceOffline } from './deviceStatus.service.js';

const CHECK_INTERVAL_MS = 30 * 1000;
const OFFLINE_THRESHOLD_MS = (Number(process.env.OFFLINE_THRESHOLD_SECONDS) || 300) * 1000;

// Backstop for silent drops: a bus marked online whose last sign of life
// (location ping or tracker heartbeat) is older than the threshold gets
// marked offline and announced.
export function startOfflineWatchdog(io) {
  setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - OFFLINE_THRESHOLD_MS);
      const stale = await Device.find({ status: 'online', lastSeenAt: { $lt: cutoff } }).select('_id');
      for (const d of stale) {
        await markDeviceOffline({ deviceId: d._id, io });
      }
    } catch (err) {
      console.error('[watchdog] check failed:', err.message);
    }
  }, CHECK_INTERVAL_MS);

  console.log(`[watchdog] running (offline after ${OFFLINE_THRESHOLD_MS / 1000}s of silence)`);
}