// gt06-bridge/bridge.js
// Receives GT06 / GT06N / TK103 binary packets over raw TCP and forwards them to
// the RoutePulse backend over Socket.IO, exactly like tracker-agent does for
// software trackers. Runs on a VM, because Render cannot accept raw TCP.
import 'dotenv/config';
import net from 'net';
import axios from 'axios';
import { io as ioClient } from 'socket.io-client';
import { extractPackets, parsePacket, buildAck, hasValidCrc } from './gt06Parser.js';

const SERVER_URL = (process.env.SERVER_URL || '').replace(/\/+$/, '');
const BRIDGE_SECRET = process.env.BRIDGE_SECRET;
const TCP_PORT = Number(process.env.TCP_PORT) || 5023;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // drop connections that went silent
const MAX_BUFFER = 4096;

if (!SERVER_URL || !BRIDGE_SECRET) {
  console.error('[bridge] SERVER_URL and BRIDGE_SECRET must be set in .env');
  process.exit(1);
}

const connections = new Map(); // imei -> live connection (one link per tracker)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const lastLogged = new Map();
function logThrottled(key, everyMs, message, level = 'log') {
  const now = Date.now();
  if (now - (lastLogged.get(key) || 0) < everyMs) return;
  lastLogged.set(key, now);
  console[level](message);
}

// ---- talking to the backend ----

async function connectTracker(conn, imei) {
  // Retries for as long as the tracker stays connected: the backend may be waking
  // up (Render free tier), or an admin may register this IMEI a minute from now.
  for (let attempt = 1; !conn.closed && conn.imei === imei; attempt++) {
    try {
      const { data } = await axios.get(`${SERVER_URL}/api/bridge/device-by-imei/${imei}`, {
        headers: { 'x-bridge-secret': BRIDGE_SECRET },
        timeout: 70000,
      });
      if (conn.closed || conn.imei !== imei) return;
      attachSocket(conn, imei, data.device);
      return;
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        console.error('[bridge] The backend rejected BRIDGE_SECRET. Check it matches on both sides.');
        await sleep(30000);
      } else if (status === 404) {
        logThrottled(`unreg-${imei}`, 300000, `[bridge] IMEI ${imei} is not registered to any bus yet. Add it in Device Center; retrying every 30s.`, 'warn');
        await sleep(30000);
      } else {
        logThrottled(`lookup-${imei}`, 60000, `[bridge] Backend not reachable for IMEI ${imei} (${err.message}); retrying.`, 'warn');
        await sleep(Math.min(5000 * attempt, 30000));
      }
    }
  }
}

function attachSocket(conn, imei, device) {
  const socket = ioClient(SERVER_URL, {
    auth: { deviceKey: device.deviceKey },
    reconnection: true,
    reconnectionDelay: 2000,
  });
  conn.io = socket;

  socket.on('connect', () => {
    console.log(`[bridge] IMEI ${imei} linked to "${device.name}"`);
    if (conn.pendingHealth) socket.emit('device-health', conn.pendingHealth);
    if (conn.pendingLocation) socket.emit('send-location', conn.pendingLocation);
    conn.pendingHealth = null;
    conn.pendingLocation = null;
  });
  socket.on('connect_error', (err) =>
    logThrottled(`link-${imei}`, 60000, `[bridge] Server link error for IMEI ${imei}: ${err.message}`, 'warn')
  );
}

// ---- handling tracker packets ----

function onLogin(conn, imei) {
  const previous = connections.get(imei);
  if (previous && previous !== conn) {
    console.log(`[bridge] IMEI ${imei} reconnected; closing its old link`);
    previous.tcp.destroy();
  }
  conn.imei = imei;
  connections.set(imei, conn);
  conn.io?.disconnect();
  conn.io = null;
  console.log(`[bridge] Tracker login: IMEI ${imei}`);
  connectTracker(conn, imei);
}

function onStatus(conn, status) {
  const payload = { batteryLevel: status.batteryLevel, gsmSignal: status.gsmSignal };
  if (conn.io?.connected) conn.io.emit('device-health', payload);
  else conn.pendingHealth = payload;
}

function onLocation(conn, loc) {
  if (!loc.hasFix) {
    // Alive but no GPS fix (indoors / cold start): keep the bus online, plot nothing
    logThrottled(`nofix-${conn.imei}`, 60000, `[bridge] IMEI ${conn.imei}: no GPS fix yet (satellites: ${loc.satellites})`);
    if (conn.io?.connected) conn.io.emit('device-heartbeat');
    return;
  }

  if (!conn.firstFixLogged) {
    conn.firstFixLogged = true;
    console.log(
      `[bridge] First fix for IMEI ${conn.imei}: ${loc.latitude}, ${loc.longitude} ` +
        `(satellites ${loc.satellites}, status word 0x${loc.flags.toString(16)})`
    );
  }

  const payload = { latitude: loc.latitude, longitude: loc.longitude };
  if (conn.io?.connected) conn.io.emit('send-location', payload);
  else conn.pendingLocation = payload; // keep only the newest until the link is up

  logThrottled(`fwd-${conn.imei}`, 30000, `[bridge] IMEI ${conn.imei}: ${loc.latitude}, ${loc.longitude} @ ${loc.speedKmh} km/h`);
}

function handlePacket(conn, packet) {
  let parsed;
  try {
    parsed = parsePacket(packet);
  } catch (err) {
    console.error(`[bridge] Could not parse packet (${err.message}): ${packet.toString('hex')}`);
    return;
  }

  if (!hasValidCrc(packet)) {
    // Not fatal: some clones compute the CRC differently, and TCP already protects the bytes
    logThrottled(`crc-${conn.imei}`, 60000, `[bridge] CRC mismatch on 0x${parsed.protocol.toString(16)} (continuing): ${packet.toString('hex')}`, 'warn');
  }

  if (parsed.needsAck) conn.tcp.write(buildAck(parsed.protocol, parsed.serial));

  if (parsed.type === 'login') onLogin(conn, parsed.data.imei);
  else if (parsed.type === 'status') onStatus(conn, parsed.data);
  else if (parsed.type === 'location') onLocation(conn, parsed.data);
  else {
    logThrottled(
      `unknown-${parsed.protocol}`,
      300000,
      `[bridge] Unhandled packet type 0x${parsed.protocol.toString(16)}: ${packet.toString('hex')}`,
      'warn'
    );
  }
}

const server = net.createServer((tcp) => {
  const conn = { tcp, imei: null, io: null, closed: false, pendingLocation: null, pendingHealth: null, firstFixLogged: false, sawFrame: false };
  let buffer = Buffer.alloc(0);

  console.log(`[bridge] Tracker connected from ${tcp.remoteAddress}:${tcp.remotePort}`);
  tcp.setKeepAlive(true, 30000);
  tcp.setTimeout(IDLE_TIMEOUT_MS);
  tcp.on('timeout', () => {
    console.warn(`[bridge] Idle timeout for IMEI ${conn.imei || 'unknown'}, closing`);
    tcp.destroy();
  });

  tcp.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    const { packets, remainder } = extractPackets(buffer);
    buffer = remainder.length > MAX_BUFFER ? Buffer.alloc(0) : remainder;

    if (packets.length > 0) {
      conn.sawFrame = true;
    } else if (!conn.sawFrame && chunk.length > 20) {
      // Plenty of bytes but nothing shaped like a GT06 frame: the tracker probably speaks another protocol
      const ascii = chunk.subarray(0, 80).toString('latin1').replace(/[^\x20-\x7e]/g, '.');
      logThrottled(
        `proto-${tcp.remoteAddress}`,
        60000,
        `[bridge] Receiving data that is not GT06 frames, so this tracker may use a different protocol. ascii="${ascii}" hex=${chunk.subarray(0, 40).toString('hex')}`,
        'warn'
      );
    }

    for (const packet of packets) handlePacket(conn, packet);
  });

  tcp.on('close', () => {
    conn.closed = true;
    console.log(`[bridge] Tracker disconnected (IMEI ${conn.imei || 'unknown'})`);
    if (conn.imei && connections.get(conn.imei) === conn) connections.delete(conn.imei);
    // Closing the Socket.IO link is what lets the platform notice the drop
    conn.io?.disconnect();
  });

  tcp.on('error', (err) => console.error('[bridge] TCP error:', err.message));
});

server.listen(TCP_PORT, () => {
  console.log(`[bridge] GT06 TCP bridge listening on port ${TCP_PORT}, forwarding to ${SERVER_URL}`);
});

// One misbehaving connection must never take every tracker down
process.on('uncaughtException', (err) => console.error('[bridge] Uncaught exception:', err));
process.on('unhandledRejection', (err) => console.error('[bridge] Unhandled rejection:', err));

function shutdown() {
  console.log('[bridge] Shutting down');
  for (const conn of connections.values()) {
    conn.io?.disconnect();
    conn.tcp.destroy();
  }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);