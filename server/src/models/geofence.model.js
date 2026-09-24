// server/src/models/geofence.model.js
import mongoose from 'mongoose';

const geofenceSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['stop', 'home', 'office', 'custom'],
      default: 'stop',
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    radiusMeters: {
      type: Number,
      required: true,
      default: 100,
    },
    color: {
      type: String,
      default: '#2563EB',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // The order of the geofence in the list
    order: {
      type: Number,
      default: 0,
    },
       routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Geofence', geofenceSchema);