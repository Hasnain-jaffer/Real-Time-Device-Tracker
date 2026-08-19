// server/src/controllers/schedule.controller.js
import Schedule from '../models/schedule.model.js';
import { computeDelayForDevice } from '../services/delay.service.js';


export async function listScheduleForDevice(req, res, next) {
  try {
    const { deviceId } = req.params;
    const schedule = await Schedule.find({ deviceId, isActive: true })
      .sort({ sequence: 1 })
      .populate('geofenceId', 'name latitude longitude radiusMeters');
    res.json({ schedule });
  } catch (err) {
    next(err);
  }
}

export async function createScheduleEntry(req, res, next) {
  try {
    const { deviceId, geofenceId, sequence, expectedTime } = req.body;
    if (!deviceId || !geofenceId || expectedTime == null) {
      return res.status(400).json({ message: 'deviceId, geofenceId, and expectedTime are required' });
    }
    const entry = await Schedule.create({ deviceId, geofenceId, sequence: sequence || 0, expectedTime });
    res.status(201).json({ entry });
  } catch (err) {
    next(err);
  }
}

export async function updateScheduleEntry(req, res, next) {
  try {
    const update = {};
    ['sequence', 'expectedTime', 'isActive'].forEach((key) => {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    });
    const entry = await Schedule.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!entry) return res.status(404).json({ message: 'Schedule entry not found' });
    res.json({ entry });
  } catch (err) {
    next(err);
  }
}

export async function deleteScheduleEntry(req, res, next) {
  try {
    const entry = await Schedule.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Schedule entry not found' });
    res.json({ message: 'Schedule entry deleted' });
  } catch (err) {
    next(err);
  }
}
export async function getDelayStatus(req, res, next) {
  try {
    const result = await computeDelayForDevice(req.params.deviceId);
    res.json({ stops: result || [] });
  } catch (err) {
    next(err);
  }
}