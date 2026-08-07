// server/src/controllers/device.controller.js
import Device from '../models/device.model.js';

export async function listMyDevices(req, res, next) {
  try {
    const devices = await Device.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ devices });
  } catch (err) {
    next(err);
  }
}

export async function createDevice(req, res, next) {
  try {
    const { name, identifier, type } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Device name is required' });
    }

    const device = await Device.create({
      ownerId: req.user.id,
      name,
      identifier: identifier || '',
      type: type || 'bus',
      deviceKey: Device.generateDeviceKey(),
    });

    res.status(201).json({ device });
  } catch (err) {
    next(err);
  }
}

export async function getDevice(req, res, next) {
  try {
    const device = await Device.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ device });
  } catch (err) {
    next(err);
  }
}

export async function updateDevice(req, res, next) {
  try {
    const { name, identifier, trackingEnabled } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (identifier !== undefined) update.identifier = identifier;
    if (trackingEnabled !== undefined) update.trackingEnabled = trackingEnabled;

    const device = await Device.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      update,
      { new: true }
    );

    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ device });
  } catch (err) {
    next(err);
  }
}

export async function deleteDevice(req, res, next) {
  try {
    const device = await Device.findOneAndDelete({ _id: req.params.id, ownerId: req.user.id });
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ message: 'Device deleted' });
  } catch (err) {
    next(err);
  }
}

export async function regenerateDeviceKey(req, res, next) {
  try {
    const device = await Device.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      { deviceKey: Device.generateDeviceKey() },
      { new: true }
    );
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ device });
  } catch (err) {
    next(err);
  }
}