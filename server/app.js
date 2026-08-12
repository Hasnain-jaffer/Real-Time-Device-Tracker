import dns from 'dns'; // Set DNS servers to Google's public DNS servers
dns.setServers(['8.8.8.8', '8.8.4.4']); 

// server/app.js
import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { Server as SocketIOServer } from 'socket.io';
import historyRoutes from './src/routes/history.routes.js';
import { connectDB } from './src/config/db.js';
import { registerLocationHandlers } from './src/sockets/location.socket.js';
import authRoutes from './src/routes/auth.routes.js';
import notificationRoutes from './src/routes/notification.routes.js';
import profileRoutes from './src/routes/profile.routes.js';
import deviceRoutes from './src/routes/device.routes.js';
import geofenceRoutes from './src/routes/geofence.routes.js';
import analyticsRoutes from './src/routes/analytics.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import searchRoutes from './src/routes/search.routes.js';

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// --- Core middleware ---
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

// --- Auth routes ---
app.use('/api/auth', authRoutes);
// --- History routes ---
app.use('/api/history', historyRoutes);
// --- Notification routes ---
app.use('/api/notifications', notificationRoutes);
// --- Profile routes ---
app.use('/api/profile', profileRoutes); 
// --- Device routes ---
app.use('/api/devices', deviceRoutes);
// --- Geofence routes ---
app.use('/api/geofences', geofenceRoutes);
// --- Analytics routes ---
app.use('/api/analytics', analyticsRoutes);
// --- Admin routes ---
app.use('/api/admin', adminRoutes);
// --- Search routes ---
app.use('/api/search', searchRoutes);

// --- Socket handlers (existing V1 logic, unchanged) ---
registerLocationHandlers(io);

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// --- Central error handler ---
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

async function start() {
  await connectDB();
  const port = process.env.PORT || 5000;
  server.listen(port, () => {
    console.log(`Server running on port ${port} [${process.env.NODE_ENV}]`);
  });
}

start();

export { app, server, io };