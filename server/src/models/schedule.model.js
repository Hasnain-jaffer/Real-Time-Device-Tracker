// server/src/models/schedule.model.js
import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
      index: true,
    },
    geofenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Geofence',
      required: true,
    },
    // Order of this stop within the bus's route (0 = first stop)
    sequence: {
      type: Number,
      required: true,
      default: 0,
    },
    // Expected time of day, stored as "HH:mm" (24h), applied to today's date
    // when computing delay — simpler than full datetime scheduling for a
    // single-daily-route university bus, and easy to extend to multiple
    // departures later without a schema change.
    expectedTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

scheduleSchema.index({ deviceId: 1, sequence: 1 });

export default mongoose.model('Schedule', scheduleSchema);