// server/cleanFakeData.js
// Removes one bus's location history and notifications and resets its live fields.
// The bus itself (name, IMEI, route, device key) is kept.
//
import dns from 'dns'; // Set DNS servers to Google's public DNS servers
dns.setServers(['8.8.8.8', '8.8.4.4']); 
process.env.TZ = process.env.TZ || 'Asia/Karachi'; // delay.service.js uses server-local time; Render defaults to UTC
//   Preview:  node cleanFakeData.js 861522080091045
//   Delete:   node cleanFakeData.js 861522080091045 --confirm
import 'dotenv/config';
import fs from 'fs';
import mongoose from 'mongoose';
import Device from './src/models/device.model.js';
import LocationPing from './src/models/locationPing.model.js';
import Notification from './src/models/notification.model.js';

const imei = process.argv[2];
const confirm = process.argv.includes('--confirm');
// Check your server/.env: use the same variable name your app uses for MongoDB
const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

async function main() {
  if (!/^\d{15}$/.test(imei || '')) throw new Error('Give a 15-digit IMEI as the first argument.');
  if (!uri) throw new Error('No MONGODB_URI or MONGO_URI found in .env.');

  await mongoose.connect(uri);

  const device = await Device.findOne({ imei });
  if (!device) throw new Error(`No bus has IMEI ${imei}. Check you are using the right database.`);

  const filter = { deviceId: device._id };
  const pings = await LocationPing.find(filter).lean();
  const notes = await Notification.find(filter).lean();

  console.log(`Database: ${mongoose.connection.name}`);
  console.log(`Bus: ${device.name} (${imei})`);
  console.log(`Location points: ${pings.length}`);
  console.log(`Notifications: ${notes.length}`);
  if (pings.length) {
    const times = pings.map((p) => p.createdAt.getTime());
    const show = (t) => new Date(t).toLocaleString('en-GB', { timeZone: 'Asia/Karachi' });
    console.log(`From ${show(Math.min(...times))} to ${show(Math.max(...times))} (Pakistan time)`);
  }

  if (!confirm) {
    console.log('\nPreview only. Nothing was changed. Add --confirm to delete.');
    return;
  }

  const backup = `backup-${imei}-${Date.now()}.json`;
  fs.writeFileSync(backup, JSON.stringify({ device: device.toObject(), pings, notes }, null, 2));
  console.log(`\nBackup saved: ${backup}`);

  // Delete only what was backed up
  const p = await LocationPing.deleteMany({ _id: { $in: pings.map((x) => x._id) } });
  const n = await Notification.deleteMany({ _id: { $in: notes.map((x) => x._id) } });
  await Device.updateOne(
    { _id: device._id },
    {
      $set: {
        status: 'offline',
        lastSeenAt: null,
        lastLocation: { latitude: null, longitude: null },
        insideGeofenceIds: [],
        health: { gsmSignal: null, batteryLevel: null, updatedAt: null },
      },
    }
  );

  console.log(`Deleted ${p.deletedCount} location points and ${n.deletedCount} notifications. Bus reset.`);
}

main()
  .catch((err) => {
    console.error('ERROR:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());