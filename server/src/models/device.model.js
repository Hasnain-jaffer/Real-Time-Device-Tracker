// server/src/models/device.model.js
import mongoose from 'mongoose';
import crypto from 'crypto';

const deviceSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // e.g. "Route 4A", "Bus 12" — kept generic so it also fits non-bus device types later
    identifier: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['bus', 'browser', 'tracker-agent', 'other'],
      default: 'bus',
    },
    deviceKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false, // never returned by default; admin endpoints request it with .select('+deviceKey')
    },
    imei: { 
      type: String, 
      trim: true 
    },
    status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    trackingEnabled: {
      type: Boolean,
      default: true,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
    lastLocation: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      default: null,
      index: true,
    },
    insideGeofenceIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Geofence' }],
      default: [],
    },
    health: {
      gsmSignal: { type: Number, default: null },
      batteryLevel: { type: Number, default: null },
      updatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Unique only among buses that actually have an IMEI. (A plain unique+sparse index
// treats "imei: null" as a value, so a second bus without an IMEI would be rejected.
// If you ever hit a duplicate-key error registering a bus, that was the cause.)
deviceSchema.index({ imei: 1 }, { unique: true, partialFilterExpression: { imei: { $type: 'string' } } });

deviceSchema.statics.generateDeviceKey = function () {
  // e.g. "dev_9f2a1c7b3e4d5f6a8b0c1d2e3f4a5b6c" — prefixed for readability, opaque otherwise
  return `dev_${crypto.randomBytes(20).toString('hex')}`;
};

export default mongoose.model('Device', deviceSchema);