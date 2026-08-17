// server/src/sockets/location.socket.js
import Device from '../models/device.model.js';
import LocationPing from '../models/locationPing.model.js';
import { evaluateGeofences } from '../services/geofenceEvaluator.service.js';
import { verifyAccessToken } from '../utils/token.util.js';
import User from '../models/user.model.js';
import Notification from '../models/notification.model.js';

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
// --- User identification for browser tabs (for real-time notifications) ---
    function identifyUser(token) {
      if (!token) return;
      try {
        const decoded = verifyAccessToken(token);
        // Leave any previous room first, in case this socket was identified
        // as a different/stale user before (defensive, avoids duplicate joins).
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

    // Identify on initial connection using whatever token was present then...
    identifyUser(socket.handshake.auth?.token);

    // ...and allow the client to re-identify at any time with a fresh token,
    // which is essential since access tokens are short-lived and refreshed
    // silently in the background without the socket connection knowing.
    socket.on('identify', ({ token }) => {
      identifyUser(token);
    });

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
          const disconnectedDevice = await Device.findByIdAndUpdate(
            socket.deviceId,
            { status: 'offline' },
            { new: true }
          );

          // If it was inside a stop when it went silent, that's meaningfully
          // different from a real geofence exit -- flag it honestly rather
          // than pretending the bus "left".
          if (disconnectedDevice && disconnectedDevice.insideGeofenceIds.length > 0) {
            const users = await User.find().select('_id');
            for (const user of users) {
              const notif = await Notification.create({
                userId: user._id,
                type: 'device-offline',
                title: `${disconnectedDevice.name} went offline`,
                message: `${disconnectedDevice.name} stopped reporting while still near a stop. It may have arrived and parked, or lost connection.`,
              });
              io.to(`user:${user._id.toString()}`).emit('notification', notif);
            }
          }
        } catch (err) {
          console.error('[location.socket] Failed to update device on disconnect:', err.message);
        }
      }
    });
  });
}