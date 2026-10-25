// server/src/services/deviceStatus.service.js
import Device from '../models/device.model.js';
import { broadcastNotification } from './notify.service.js';

export async function markDeviceOffline({ deviceId, io }) {
  // Atomic online -> offline flip: only the caller that actually changes the
  // status announces it, so the disconnect path and the watchdog can never
  // send duplicate alerts for the same drop.
  const device = await Device.findOneAndUpdate(
    { _id: deviceId, status: 'online' },
    { status: 'offline' },
    { new: true }
  );
  if (!device) return null;

  // Removes the bus from the live map
  io.emit('user-disconnected', { id: `offline-${device._id}`, deviceId: device._id.toString() });

  const wasInsideStop = device.insideGeofenceIds.length > 0;
  await broadcastNotification(io, {
    type: 'device-offline',
    title: `${device.name} went offline`,
    message: wasInsideStop
      ? `${device.name} stopped reporting while still near a stop. It may have arrived and parked, or lost connection.`
      : `${device.name} stopped reporting. It may have been switched off or lost its connection.`,
    deviceId: device._id,
  });

  return device;
}