// server/src/controllers/bridge.controller.js
import Device from '../models/device.model.js';

export async function getDeviceByImei(req, res, next) {
  try {
    const raw = String(req.params.imei || '').trim();
    if (!/^\d{10,17}$/.test(raw)) {
      return res.status(400).json({ message: 'Invalid IMEI format' });
    }

    // GT06 login packets send the 15-digit IMEI as 8 BCD bytes (16 digits, one leading 0 pad)
        // The bridge sends the 15-digit IMEI. Also match a bus saved earlier in the old 16-digit form ("0" + IMEI).
    const candidates = [raw];
    if (raw.length === 16 && raw.startsWith('0')) candidates.push(raw.slice(1));
    if (raw.length === 15) candidates.push(`0${raw}`);

    const device = await Device.findOne({ imei: { $in: candidates } }).select('name imei +deviceKey');
    if (!device) {
      return res.status(404).json({ message: 'No device registered with this IMEI' });
    }

    res.json({ device: { deviceKey: device.deviceKey, name: device.name, imei: device.imei } });
  } catch (err) {
    next(err);
  }
}