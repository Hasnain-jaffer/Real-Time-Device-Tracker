// server/src/tcp/gt06Server.js
import net from 'net';
import { extractPackets, parsePacket, buildAck, PROTOCOL } from './gt06Parser.js';
import Device from '../models/device.model.js';
import LocationPing from '../models/locationPing.model.js';
import { evaluateGeofences } from '../services/geofenceEvaluator.service.js';

export function startGt06Server({ port, io }) {
  const server = net.createServer((socket) => {
    let buffer = Buffer.alloc(0);
    let boundDevice = null;

    console.log(`[gt06] Tracker connected from ${socket.remoteAddress}:${socket.remotePort}`);

    socket.on('data', async (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const { packets, remainder } = extractPackets(buffer);
      buffer = remainder;

      for (const packet of packets) {
        let parsed;
        try {
          parsed = parsePacket(packet);
        } catch (err) {
          console.error('[gt06] Failed to parse packet:', err.message);
          continue;
        }

        if (parsed.protocol === PROTOCOL.LOGIN) {
          const { imei } = parsed.data;
          try {
            const device = await Device.findOne({ imei });
            if (device) {
              boundDevice = device;
              device.status = 'online';
              device.lastSeenAt = new Date();
              await device.save();
              console.log(`[gt06] Tracker identified: ${device.name} (IMEI ${imei})`);
            } else {
              console.warn(`[gt06] Unknown IMEI ${imei} -- no matching registered device`);
            }
          } catch (err) {
            console.error('[gt06] Login lookup failed:', err.message);
          }
          socket.write(buildAck(parsed.protocol, parsed.serial));
        } else if (parsed.protocol === PROTOCOL.HEARTBEAT) {
          if (boundDevice) {
            Device.findByIdAndUpdate(boundDevice._id, { lastSeenAt: new Date(), status: 'online' }).catch(() => {});
          }
          socket.write(buildAck(parsed.protocol, parsed.serial));
        } else if (parsed.protocol === PROTOCOL.LOCATION || parsed.protocol === PROTOCOL.ALARM) {
          if (!boundDevice) {
            console.warn('[gt06] Location packet received before login -- ignoring');
            continue;
          }

          const { latitude, longitude } = parsed.data;
          const deviceId = boundDevice._id.toString();

          io.emit('receive-location', { id: `gt06-${deviceId}`, deviceId, latitude, longitude });

          LocationPing.create({ socketId: `gt06-${deviceId}`, deviceId, latitude, longitude }).catch((err) => {
            console.error('[gt06] Failed to persist ping:', err.message);
          });

          Device.findByIdAndUpdate(deviceId, {
            lastSeenAt: new Date(),
            status: 'online',
            lastLocation: { latitude, longitude },
          }).catch(() => {});

          evaluateGeofences({ deviceId, deviceName: boundDevice.name, latitude, longitude, io });
        }
      }
    });

    socket.on('close', async () => {
      console.log('[gt06] Tracker disconnected');
      if (boundDevice) {
        try {
          await Device.findByIdAndUpdate(boundDevice._id, { status: 'offline' });
          io.emit('user-disconnected', { id: `gt06-${boundDevice._id}`, deviceId: boundDevice._id.toString() });
        } catch (err) {
          console.error('[gt06] Failed to mark device offline:', err.message);
        }
      }
    });

    socket.on('error', (err) => {
      console.error('[gt06] Socket error:', err.message);
    });
  });

  server.listen(port, () => {
    console.log(`[gt06] TCP server listening on port ${port} for GT06/TK103 trackers`);
  });

  return server;
}