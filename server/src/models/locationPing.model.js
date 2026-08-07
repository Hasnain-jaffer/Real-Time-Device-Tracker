// server/src/models/locationPing.model.js
import mongoose from 'mongoose';

const locationPingSchema = new mongoose.Schema(
  {
    socketId: {
      type: String,
      required: true,
      index: true,
    },
    // Optional for now — populated once socket auth (Phase 2) attaches a real user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // Optional for now — populated once socket auth (Phase 2) attaches a real device
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      default: null,
      index: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true } // createdAt acts as the ping timestamp
);

// Speeds up "history for this device between these dates" queries
locationPingSchema.index({ socketId: 1, createdAt: -1 });
locationPingSchema.index({ deviceId: 1, createdAt: -1 });

export default mongoose.model('LocationPing', locationPingSchema);