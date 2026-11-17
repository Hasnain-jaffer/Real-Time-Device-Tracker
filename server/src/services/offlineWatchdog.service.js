// server/src/services/offlineWatchdog.service.js
import Device from '../models/device.model.js';
import { markDeviceOffline } from './deviceStatus.service.js';

const CHECK_INTERVAL_MS = 30 * 1000;
// Never below 90 s: a healthy tracker can stay quiet that long between reports
const OFFLINE_THRESHOLD_MS = Math.max(90, Number(process.env.OFFLINE_THRESHOLD_SECONDS) || 600) * 1000;

let running = false; // a slow database must not let two checks overlap

// Backstop for silent drops: a bus marked online whose last sign of life
// (location ping, tracker status or heartbeat) is older than the threshold
// gets marked offline and announced.
export function startOfflineWatchdog(io) {
  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const cutoff = new Date(Date.now() - OFFLINE_THRESHOLD_MS);
      // lastSeenAt: null also catches a bus flagged online that never recorded a sign of life
      const stale = await Device.find({
        status: 'online',
        $or: [{ lastSeenAt: { $lt: cutoff } }, { lastSeenAt: null }],
      }).select('_id name lastSeenAt');

      for (const d of stale) {
        try {
          const silentSeconds = d.lastSeenAt ? Math.round((Date.now() - d.lastSeenAt.getTime()) / 1000) : null;
          const flipped = await markDeviceOffline({ deviceId: d._id, io });
          if (flipped) {
            console.log(`[watchdog] ${d.name} marked offline (silent ${silentSeconds === null ? 'since before tracking' : `${silentSeconds}s`})`);
          }
        } catch (err) {
          console.error(`[watchdog] could not mark ${d.name} offline:`, err.message);
        }
      }
    } catch (err) {
      console.error('[watchdog] check failed:', err.message);
    } finally {
      running = false;
    }
  }, CHECK_INTERVAL_MS);

  console.log(`[watchdog] running (offline after ${OFFLINE_THRESHOLD_MS / 1000}s of silence)`);
}