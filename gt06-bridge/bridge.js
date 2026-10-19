// gt06-bridge/bridge.js
// Runs on the cloud VM (AWS EC2). Accepts raw GT06/TK103 TCP connections from the
// physical tracker, decodes them, and forwards positions to the Render backend as a
// Socket.IO client -- the same way tracker-agent/agent.js does. The VM never touches
// MongoDB; the backend's existing location.socket.js handles persistence, geofencing
// and broadcasting.

import 'dotenv/config';
import net from 'net';
import axios from 'axios';
import { io as ioClient } from 'socket.io-client';
import { extractPackets, parsePacket, buildAck, PROTOCOL } from './gt06Parser.js';

const SERVER_URL = (process.env.SERVER_URL || '').replace(/\/+$/, '');
const BRIDGE_SECRET = process.env.BRIDGE_SECRET;
const TCP_PORT = Number(process.env.TCP_PORT) || 5023;
const IDLE_TIMEOUT_MS = Number(process.env.IDLE_TIMEOUT_MS) || 10 * 60 * 1000;
const LOG_RAW = process.env.LOG_RAW === 'true';
const MAX_BUFFER_BYTES = 4096; // protects memory if a client sends garbage with no valid packet

if (!SERVER_URL || !BRIDGE_SECRET) {
  console.error('[bridge] SERVER_URL and BRIDGE_SECRET must be set in .env');
  process.exit(1);
}

const api = axios.create({
  baseURL: SERVER_URL,
  timeout: 8000,
  headers: { 'x-bridge-secret': BRIDGE_SECRET },
});

// imei -> { ioSocket, tcpSocket, deviceKey }
// One Socket.IO connection per physical tracker. `tcpSocket` is whichever TCP
// connection currently owns the session (trackers reconnect often on mobile networks).
const sessions = new Map();

async function resolveDeviceKey(imei) {
  const { data } = await api.get(`/api/bridge/devices/by-imei/${encodeURIComponent(imei)}`);
  return data.device.deviceKey;
}

function openSession(imei, deviceKey, tcpSocket) {
  const existing = sessions.get(imei);

  if (existing) {
    // Tracker reconnected: drop the old (possibly half-open) TCP connection and hand
    // ownership to the new one. Its 'close' handler becomes a no-op (see closeSession).
    if (existing.tcpSocket !== tcpSocket) existing.tcpSocket.destroy();
    if (existing.deviceKey === deviceKey) {
      existing.tcpSocket = tcpSocket;
      return existing;
    }
    existing.ioSocket.disconnect(); // device key was regenerated -- start fresh
  }

  const ioSocket = ioClient(SERVER_URL, {
    auth: { deviceKey },
    reconnection: true,
    reconnectionDelay: 2000,
  });

  ioSocket.on('connect', () => console.log(`[bridge] Socket.IO connected for IMEI ${imei}`));
  ioSocket.on('disconnect', (reason) => console.log(`[bridge] Socket.IO disconnected for IMEI ${imei}: ${reason}`));
  ioSocket.on('connect_error', (err) => console.error(`[bridge] Socket.IO error for IMEI ${imei}: ${err.message}`));

  const session = { ioSocket, tcpSocket, deviceKey };
  sessions.set(imei, session);
  return session;
}

// Called when a TCP connection ends. Disconnecting the Socket.IO client is what makes
// the backend mark the bus offline, so it must happen -- but only if this TCP socket
// still owns the session (a newer connection may have taken over).
function closeSession(imei, tcpSocket) {
  const session = sessions.get(imei);
  if (!session || session.tcpSocket !== tcpSocket) return;
  session.ioSocket.disconnect();
  sessions.delete(imei);
  console.log(`[bridge] Session closed for IMEI ${imei} (bus will show offline)`);
}

const server = net.createServer((tcpSocket) => {
  let buffer = Buffer.alloc(0);
  let imei = null;
  let session = null;
  let chain = Promise.resolve(); // processes chunks strictly in order, even with async lookups

  const remote = `${tcpSocket.remoteAddress}:${tcpSocket.remotePort}`;
  console.log(`[bridge] Tracker connected from ${remote}`);

  tcpSocket.setKeepAlive(true, 30000);
  tcpSocket.setTimeout(IDLE_TIMEOUT_MS);
  tcpSocket.on('timeout', () => {
    console.warn(`[bridge] Idle timeout for ${remote} (IMEI ${imei || 'unknown'}) -- closing`);
    tcpSocket.destroy();
  });

  async function handlePacket(packet) {
    let parsed;
    try {
      parsed = parsePacket(packet);
    } catch (err) {
      console.error('[bridge] Parse error:', err.message);
      return;
    }

    if (parsed.protocol === PROTOCOL.LOGIN) {
      const loginImei = parsed.data.imei;
      try {
        const deviceKey = await resolveDeviceKey(loginImei);
        if (tcpSocket.destroyed) return; // tracker hung up while we were looking it up
        imei = loginImei;
        session = openSession(imei, deviceKey, tcpSocket);
        console.log(`[bridge] Tracker identified: IMEI ${imei}`);
        tcpSocket.write(buildAck(parsed.protocol, parsed.serial));
      } catch (err) {
        const status = err.response?.status;
        if (status === 404) {
          console.warn(`[bridge] Unknown IMEI ${loginImei} -- not registered on any device. Closing.`);
          tcpSocket.destroy();
        } else if (status === 401 || status === 503) {
          console.error(`[bridge] Backend rejected the bridge (HTTP ${status}). Check BRIDGE_SECRET on both sides.`);
          tcpSocket.destroy();
        } else {
          // Network/backend hiccup: do not ACK, the tracker will retry its login
          console.error(`[bridge] Login lookup failed for IMEI ${loginImei}: ${err.message}`);
        }
      }
      return;
    }

    if (parsed.protocol === PROTOCOL.HEARTBEAT) {
      tcpSocket.write(buildAck(parsed.protocol, parsed.serial));
      return;
    }

    if (parsed.protocol === PROTOCOL.LOCATION || parsed.protocol === PROTOCOL.ALARM) {
      if (!session) {
        console.warn('[bridge] Location packet before successful login -- ignoring');
        return;
      }
      const { latitude, longitude } = parsed.data;
      if (latitude === 0 && longitude === 0) {
        console.warn(`[bridge] IMEI ${imei}: 0,0 position (no GPS fix yet) -- skipped`);
        return;
      }
      if (!session.ioSocket.connected) {
        console.warn(`[bridge] IMEI ${imei}: backend link is down -- position dropped`);
        return;
      }
      session.ioSocket.emit('send-location', { latitude, longitude });
      console.log(`[bridge] IMEI ${imei}: ${latitude}, ${longitude}`);
      return;
    }

    // Many GT06N variants also use protocols 0x22/0x23/0x26 etc. Log them so we can add support.
    console.warn(`[bridge] Unhandled protocol 0x${parsed.protocol.toString(16).padStart(2, '0')} from IMEI ${imei || 'unknown'}`);
  }

  tcpSocket.on('data', (chunk) => {
    if (LOG_RAW) console.log(`[bridge][raw] ${remote} ${chunk.toString('hex')}`);

    buffer = Buffer.concat([buffer, chunk]);
    const { packets, remainder } = extractPackets(buffer);
    buffer = remainder;

    if (buffer.length > MAX_BUFFER_BYTES) {
      console.warn(`[bridge] ${remote} sent ${buffer.length} bytes without a valid GT06 packet -- closing`);
      tcpSocket.destroy();
      return;
    }

    for (const packet of packets) {
      chain = chain.then(() => handlePacket(packet)).catch((err) => {
        console.error('[bridge] Unexpected error handling packet:', err.message);
      });
    }
  });

  tcpSocket.on('close', () => {
    console.log(`[bridge] Tracker disconnected (IMEI ${imei || 'unknown'})`);
    if (imei) closeSession(imei, tcpSocket);
  });

  tcpSocket.on('error', (err) => console.error(`[bridge] TCP error (${remote}):`, err.message));
});

server.listen(TCP_PORT, '0.0.0.0', () => {
  console.log(`[bridge] GT06 TCP bridge listening on 0.0.0.0:${TCP_PORT}, forwarding to ${SERVER_URL}`);
});

function shutdown(signal) {
  console.log(`[bridge] ${signal} received, shutting down`);
  for (const s of sessions.values()) s.ioSocket.disconnect();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));