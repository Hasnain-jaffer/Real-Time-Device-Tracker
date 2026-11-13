// server/src/controllers/schedule.controller.js
import mongoose from 'mongoose';
import Schedule from '../models/schedule.model.js';
import Device from '../models/device.model.js';
import Geofence from '../models/geofence.model.js';
import { computeDelayForDevice } from '../services/delay.service.js';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const isId = (value) => mongoose.Types.ObjectId.isValid(value);

export async function listScheduleForDevice(req, res, next) {
  try {
    const { deviceId } = req.params;
    if (!isId(deviceId)) return res.status(400).json({ message: 'Invalid device id' });

    const schedule = await Schedule.find({ deviceId, isActive: true })
      .sort({ sequence: 1, createdAt: 1 })
      .populate('geofenceId', 'name latitude longitude radiusMeters routeId');
    res.json({ schedule });
  } catch (err) {
    next(err);
  }
}

export async function createScheduleEntry(req, res, next) {
  try {
    const { deviceId, geofenceId, sequence, expectedTime } = req.body;
    if (!deviceId || !geofenceId || !expectedTime) {
      return res.status(400).json({ message: 'deviceId, geofenceId, and expectedTime are required' });
    }
    if (!isId(deviceId) || !isId(geofenceId)) {
      return res.status(400).json({ message: 'Invalid deviceId or geofenceId' });
    }
    if (!TIME_PATTERN.test(expectedTime)) {
      return res.status(400).json({ message: 'expectedTime must be HH:mm (24-hour)' });
    }

    const [device, stop] = await Promise.all([
      Device.findById(deviceId).select('routeId'),
      Geofence.findById(geofenceId).select('routeId'),
    ]);
    if (!device) return res.status(404).json({ message: 'Bus not found' });
    if (!stop) return res.status(404).json({ message: 'Stop not found' });
    if (!device.routeId || String(stop.routeId) !== String(device.routeId)) {
      return res.status(400).json({ message: 'This stop is not on the route assigned to this bus' });
    }

    // One entry per bus and stop: saving again updates the existing entry
    const entry = await Schedule.findOneAndUpdate(
      { deviceId, geofenceId },
      { $set: { sequence: Number(sequence) || 0, expectedTime, isActive: true } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
}

export async function updateScheduleEntry(req, res, next) {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    if (req.body.expectedTime !== undefined && !TIME_PATTERN.test(req.body.expectedTime)) {
      return res.status(400).json({ message: 'expectedTime must be HH:mm (24-hour)' });
    }

    const update = {};
    ['sequence', 'expectedTime', 'isActive'].forEach((key) => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });
    const entry = await Schedule.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!entry) return res.status(404).json({ message: 'Schedule entry not found' });
    res.json({ entry });
  } catch (err) {
    next(err);
  }
}

export async function deleteScheduleEntry(req, res, next) {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
    const entry = await Schedule.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Schedule entry not found' });
    res.json({ message: 'Schedule entry deleted' });
  } catch (err) {
    next(err);
  }
}

export async function getDelayStatus(req, res, next) {
  try {
    if (!isId(req.params.deviceId)) return res.status(400).json({ message: 'Invalid device id' });
    const result = await computeDelayForDevice(req.params.deviceId);
    res.json({ stops: result || [] });
  } catch (err) {
    next(err);
  }
}