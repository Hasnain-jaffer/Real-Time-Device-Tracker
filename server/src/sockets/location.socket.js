// server/src/sockets/location.socket.js
import mongoose from 'mongoose';
import Device from '../models/device.model.js';
import User from '../models/user.model.js';
import LocationPing from '../models/locationPing.model.js';
import { evaluateGeofences } from '../services/geofenceEvaluator.service.js';
import { markDeviceOffline } from '../services/deviceStatus.service.js';
import { verifyAccessToken } from '../utils/token.util.js';

const OFFLINE_GRACE_MS = (Number(process.env.OFFLINE_GRACE_SECONDS) || 20) * 1000;
const MIN_REPORT_INTERVAL_MS = 1000; // at most one position per second per connection

// Accept only real, in-range coordinates
function readCoordinates(data) {
  const latitude = data?.latitude;
  const longitude = data?.longitude;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

export function registerLocationHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Connected:', socket.id);

    let device = null; // hardware tracker authenticated by its device key
    let lastReportAt = 0;

    // Grace period: a quick reconnect (network blip, agent restart) should not raise an alert
    function scheduleOfflineCheck(deviceId) {
      setTimeout(async () => {
        try {
          const stillConnected = await io.in(`device:${deviceId}`).fetchSockets();
          if (stillConnected.length > 0) return;
          await markDeviceOffline({ deviceId, io });
        } catch (err) {
          console.error('[location.socket] Offline handling failed:', err.message);
        }
      }, OFFLINE_GRACE_MS);
    }

    // An admin can report a position on behalf of one bus (phone or browser used as a tracker)
    function releaseBoundDevice() {
      const id = socket.boundDeviceId;
      if (!id) return;
      socket.leave(`device:${id}`);
      socket.boundDeviceId = null;
      socket.boundDevice = null;
      io.emit('user-disconnected', { id: socket.id, deviceId: id });
      scheduleOfflineCheck(id);
    }

    function report(deviceId, deviceDoc, { latitude, longitude }) {
      io.emit('receive-location', { id: socket.id, deviceId, latitude, longitude });

      LocationPing.create({ socketId: socket.id, deviceId, latitude, longitude }).catch((err) =>
        console.error('[location.socket] Failed to persist ping:', err.message)
      );

      Device.findByIdAndUpdate(deviceId, {
        lastSeenAt: new Date(),
        status: 'online',
        lastLocation: { latitude, longitude },
      }).catch((err) => console.error('[location.socket] Failed to update device status:', err.message));

      if (deviceDoc) {
        evaluateGeofences({ deviceId, deviceName: deviceDoc.name, latitude, longitude, io });
      }
    }

    // --- Optional device authentication (hardware trackers) ---
    async function authenticateDevice() {
      const deviceKey = socket.handshake.auth?.deviceKey;
      if (!deviceKey) return;
      try {
        device = await Device.findOne({ deviceKey });
        if (!device) {
          console.warn('[location.socket] Unknown deviceKey presented, ignoring auth (connection still allowed)');
          return;
        }
        socket.deviceId = device._id.toString();
        socket.join(`device:${socket.deviceId}`);
        device.status = 'online';
        device.lastSeenAt = new Date();
        await device.save();
        console.log(`Device authenticated: ${device.name} (${device._id})`);
      } catch (err) {
        console.error('[location.socket] Device auth lookup failed:', err.message);
      }
    }

    // --- User identification (private notification room + admin check) ---
    async function identifyUser(token) {
      if (!token) return;
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.sub).select('role isSuspended');
        if (!user || user.isSuspended) throw new Error('account unavailable');

        if (socket.userId && socket.userId !== decoded.sub) {
          socket.leave(`user:${socket.userId}`);
          releaseBoundDevice(); // a different person must not keep reporting as a bus
        }
        socket.userId = decoded.sub;
        socket.isAdmin = user.role === 'admin';
        if (!socket.isAdmin) releaseBoundDevice();
        socket.join(`user:${socket.userId}`);
        console.log(`Socket ${socket.id} identified as user ${socket.userId}${socket.isAdmin ? ' (admin)' : ''}`);
      } catch (err) {
        console.warn('[location.socket] Invalid user token on identify, ignoring:', err.message);
      }
    }

    // Everything this connection needs before it may report anything
    const ready = (async () => {
      await authenticateDevice();
      await identifyUser(socket.handshake.auth?.token);
    })();

    socket.on('identify', async (payload) => {
      await ready;
      await identifyUser(payload?.token);
    });

    // --- Location stream ---
    socket.on('send-location', async (data) => {
      await ready;

      const coords = readCoordinates(data);
      if (!coords) return;

      const now = Date.now();
      if (now - lastReportAt < MIN_REPORT_INTERVAL_MS) return;
      lastReportAt = now;

      // 1. A hardware tracker authenticated by its device key
      if (socket.deviceId) {
        report(socket.deviceId, device, coords);
        return;
      }

      // 2. Anyone else must be a signed-in admin
      if (!socket.isAdmin) return;

      const requestedId = data?.deviceId ? String(data.deviceId) : null;

      if (!requestedId) {
        // "Just show me on the map": visible live, never stored
        releaseBoundDevice();
        io.emit('receive-location', { id: socket.id, deviceId: null, ...coords });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(requestedId)) return;

      if (socket.boundDeviceId !== requestedId) {
        const bus = await Device.findById(requestedId);
        if (!bus) return;
        releaseBoundDevice();
        socket.boundDeviceId = requestedId;
        socket.boundDevice = bus;
        socket.join(`device:${requestedId}`);
      }
      report(socket.boundDeviceId, socket.boundDevice, coords);
    });

    // An admin stops sharing
    socket.on('stop-location', async () => {
      await ready;
      if (!socket.isAdmin) return;
      if (socket.boundDeviceId) releaseBoundDevice();
      else io.emit('user-disconnected', { id: socket.id, deviceId: null });
    });

    // Real trackers send heartbeats even when parked; the bridge forwards them
    // so a parked-but-alive bus isn't mistaken for a dead one.
    socket.on('device-heartbeat', async () => {
      await ready;
      if (!socket.deviceId) return;
      Device.findByIdAndUpdate(socket.deviceId, { lastSeenAt: new Date(), status: 'online' }).catch(() => {});
    });

    // --- Disconnect ---
    socket.on('disconnect', async () => {
      await ready;
      const id = socket.deviceId || socket.boundDeviceId;
      if (!id) {
        if (socket.isAdmin) io.emit('user-disconnected', { id: socket.id, deviceId: null });
        return;
      }
      io.emit('user-disconnected', { id: socket.id, deviceId: id });
      console.log('Device disconnected', socket.id);
      scheduleOfflineCheck(id);
    });
  });
}