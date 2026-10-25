// server/src/sockets/location.socket.js
import Device from '../models/device.model.js';
import LocationPing from '../models/locationPing.model.js';
import { evaluateGeofences } from '../services/geofenceEvaluator.service.js';
import { markDeviceOffline } from '../services/deviceStatus.service.js';
import { verifyAccessToken } from '../utils/token.util.js';

const OFFLINE_GRACE_MS = (Number(process.env.OFFLINE_GRACE_SECONDS) || 20) * 1000;

export function registerLocationHandlers(io) {
  io.on('connection', async (socket) => {
    console.log('Connected:', socket.id);

    // --- Optional device authentication ---
    let device = null;
    const deviceKey = socket.handshake.auth?.deviceKey;

    if (deviceKey) {
      try {
        device = await Device.findOne({ deviceKey });
        if (device) {
          socket.deviceId = device._id.toString();
          socket.join(`device:${socket.deviceId}`);
          device.status = 'online';
          device.lastSeenAt = new Date();
          await device.save();
          console.log(`Device authenticated: ${device.name} (${device._id})`);
        } else {
          console.warn('[location.socket] Unknown deviceKey presented, ignoring auth (connection still allowed)');
        }
      } catch (err) {
        console.error('[location.socket] Device auth lookup failed:', err.message);
      }
    }

    // --- User identification for browser tabs (real-time notifications) ---
    function identifyUser(token) {
      if (!token) return;
      try {
        const decoded = verifyAccessToken(token);
        if (socket.userId && socket.userId !== decoded.sub) {
          socket.leave(`user:${socket.userId}`);
        }
        socket.userId = decoded.sub;
        socket.join(`user:${socket.userId}`);
        console.log(`Socket ${socket.id} identified as user ${socket.userId}, joined private room`);
      } catch (err) {
        console.warn('[location.socket] Invalid user token on identify, ignoring:', err.message);
      }
    }

    identifyUser(socket.handshake.auth?.token);
    socket.on('identify', ({ token }) => identifyUser(token));

    // --- Location stream ---
    socket.on('send-location', (data) => {
      console.log(data);
      io.emit('receive-location', {
        id: socket.id,
        deviceId: socket.deviceId || null,
        ...data,
      });

      const { latitude, longitude } = data;
      LocationPing.create({
        socketId: socket.id,
        deviceId: socket.deviceId || null,
        latitude,
        longitude,
      }).catch((err) => console.error('[location.socket] Failed to persist ping:', err.message));

      if (socket.deviceId) {
        Device.findByIdAndUpdate(socket.deviceId, {
          lastSeenAt: new Date(),
          status: 'online',
          lastLocation: { latitude, longitude },
        }).catch((err) => console.error('[location.socket] Failed to update device status:', err.message));
      }

      if (socket.deviceId && device) {
        evaluateGeofences({
          deviceId: socket.deviceId,
          deviceName: device.name,
          latitude,
          longitude,
          io,
        });
      }
    });

    // Real trackers send heartbeats even when parked; the bridge forwards them
    // so a parked-but-alive bus isn't mistaken for a dead one.
    socket.on('device-heartbeat', () => {
      if (!socket.deviceId) return;
      Device.findByIdAndUpdate(socket.deviceId, { lastSeenAt: new Date(), status: 'online' }).catch(() => {});
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
      io.emit('user-disconnected', { id: socket.id, deviceId: socket.deviceId || null });
      console.log('User disconnected', socket.id);

      if (!socket.deviceId) return;
      const deviceId = socket.deviceId;

      // Grace period: a quick reconnect (network blip, agent restart) should
      // not raise an alert.
      setTimeout(async () => {
        try {
          const stillConnected = await io.in(`device:${deviceId}`).fetchSockets();
          if (stillConnected.length > 0) return;
          await markDeviceOffline({ deviceId, io });
        } catch (err) {
          console.error('[location.socket] Offline handling failed:', err.message);
        }
      }, OFFLINE_GRACE_MS);
    });
  });
}