// server/src/sockets/location.socket.js
// Preserves the original V1 real-time location broadcast logic untouched for
// any connection that doesn't present a deviceKey (backward compatible).
// New: connections that DO present a valid deviceKey are tied to a real
// Device document — their pings are attributed to that device's identity
// and lastSeenAt/status are kept in sync.

import Device from '../models/device.model.js';
import LocationPing from '../models/locationPing.model.js';

export function registerLocationHandlers(io) {
  io.on('connection', async (socket) => {
    console.log('Connected:', socket.id);

    // --- Optional device authentication (additive, non-breaking) ---
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

    // --- Existing V1 broadcast logic, unchanged ---
    socket.on('send-location', (data) => {
      console.log(data);
      io.emit('receive-location', {
        id: socket.id,
        deviceId: socket.deviceId || null, // additive field only, old clients ignore it
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

      // Keep device's lastSeenAt/lastLocation fresh on every ping, not just connect
      if (socket.deviceId) {
        Device.findByIdAndUpdate(socket.deviceId, {
          lastSeenAt: new Date(),
          status: 'online',
          lastLocation: { latitude, longitude },
        }).catch((err) => {
          console.error('[location.socket] Failed to update device status:', err.message);
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