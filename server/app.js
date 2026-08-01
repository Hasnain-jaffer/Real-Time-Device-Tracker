// server/app.js
import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB } from './src/config/db.js';
import { registerLocationHandlers } from './src/sockets/location.socket.js';
import authRoutes from './src/routes/auth.routes.js';

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