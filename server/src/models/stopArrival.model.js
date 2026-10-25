// server/src/models/stopArrival.model.js
import mongoose from 'mongoose';

const stopArrivalSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  geofenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Geofence', required: true },
  arrivedAt: { type: Date, required: true },
});

stopArrivalSchema.index({ routeId: 1, arrivedAt: -1 });
stopArrivalSchema.index({ deviceId: 1, arrivedAt: -1 });

export default mongoose.model('StopArrival', stopArrivalSchema);