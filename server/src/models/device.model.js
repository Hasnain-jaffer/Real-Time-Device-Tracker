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
  },
  { timestamps: true }
);

deviceSchema.statics.generateDeviceKey = function () {
  // e.g. "dev_9f2a1c7b3e4d5f6a8b0c1d2e3f4a5b6c" — prefixed for readability, opaque otherwise
  return `dev_${crypto.randomBytes(20).toString('hex')}`;
};

export default mongoose.model('Device', deviceSchema);