// server/src/controllers/admin.controller.js
import User from '../models/user.model.js';
import Device from '../models/device.model.js';
import Geofence from '../models/geofence.model.js';

export async function getSystemOverview(req, res, next) {
  try {
    const [totalUsers, totalDevices, onlineDevices, totalGeofences, suspendedUsers] = await Promise.all([
      User.countDocuments(),
      Device.countDocuments(),
      Device.countDocuments({ status: 'online' }),
      Geofence.countDocuments(),
      User.countDocuments({ isSuspended: true }),
    ]);

    res.json({
      totalUsers,
      totalDevices,
      onlineDevices,
      offlineDevices: totalDevices - onlineDevices,
      totalGeofences,
      suspendedUsers,
    });
  } catch (err) {
    next(err);
  }
}

export async function listAllUsers(req, res, next) {
  try {
    const { search = '' } = req.query;
    const query = search
      ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
      : {};

    const users = await User.find(query)
      .select('name email role isVerified isSuspended createdAt')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function suspendUser(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: true },
      { new: true }
    ).select('name email isSuspended');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function activateUser(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: false },
      { new: true }
    ).select('name email isSuspended');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function deleteUserAdmin(req, res, next) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account from here' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Also clean up their devices/geofences to avoid orphaned records
    await Device.deleteMany({ ownerId: req.params.id });
    await Geofence.deleteMany({ ownerId: req.params.id });
    res.json({ message: 'User and their devices/stops deleted' });
  } catch (err) {
    next(err);
  }
}

export async function listAllDevices(req, res, next) {
  try {
    const devices = await Device.find()
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ devices });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteDevice(req, res, next) {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ message: 'Device deleted' });
  } catch (err) {
    next(err);
  }
}

export async function adminToggleTracking(req, res, next) {
  try {
    const { trackingEnabled } = req.body;
    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { trackingEnabled },
      { new: true }
    );
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json({ device });
  } catch (err) {
    next(err);
  }
}