// server/src/sockets/location.socket.js
import Device from '../models/device.model.js';
import LocationPing from '../models/locationPing.model.js';
import { evaluateGeofences } from '../services/geofenceEvaluator.service.js';
import { verifyAccessToken } from '../utils/token.util.js';

export function registerLocationHandlers(io) {
  io.on('connection', async (socket) => {
    console.log('Connected:', socket.id);

    // --- Optional device authentication (Batch 17, unchanged) ---
    let device = null;
    const deviceKey = socket.handshake.auth?.deviceKey;

    if (deviceKey) {
      try {
        device = await Device.findOne({ deviceKey });
        if (device) {
          socket.deviceId = device._id.toString();
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

    // --- New: optional user identification for browser tabs (for real-time notifications) ---
    const userToken = socket.handshake.auth?.token;
    if (userToken) {
      try {
        const decoded = verifyAccessToken(userToken);
        socket.userId = decoded.sub;
        socket.join(`user:${socket.userId}`);
        console.log(`Browser session identified as user ${socket.userId}, joined private room`);
      } catch (err) {
        console.warn('[location.socket] Invalid user token on socket, staying anonymous:', err.message);
      }
    }

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
      }).catch((err) => {
        console.error('[location.socket] Failed to persist ping:', err.message);
      });

      if (socket.deviceId) {
        Device.findByIdAndUpdate(socket.deviceId, {
          lastSeenAt: new Date(),
          status: 'online',
          lastLocation: { latitude, longitude },
        }).catch((err) => {
          console.error('[location.socket] Failed to update device status:', err.message);
        });
      }

      if (socket.deviceId && device) {
        evaluateGeofences({
          deviceId: socket.deviceId,
          ownerId: device.ownerId,
          deviceName: device.name,
          latitude,
          longitude,
          io,
        });
      }
    });

    socket.on('disconnect', async () => {
      io.emit('user-disconnected', { id: socket.id, deviceId: socket.deviceId || null });
      console.log('User disconnected', socket.id);

      if (socket.deviceId) {
        try {
          await Device.findByIdAndUpdate(socket.deviceId, { status: 'offline' });
        } catch (err) {
          console.error('[location.socket] Failed to mark device offline:', err.message);
        }
      }
    });
  });
}