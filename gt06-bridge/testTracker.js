// gt06-bridge/testTracker.js
// Simulated GT06 tracker for testing the TCP bridge (or the in-process server) without
// real hardware.
//
// Usage:  node testTracker.js [host] [port] [imei] [lat] [lng]
//   e.g.  node testTracker.js localhost 5024 123456789012345
//         node testTracker.js 13.234.10.20 5023 123456789012345
//         node testTracker.js localhost 5024 123456789012345 25.4612 68.7155   (start at a stop's coordinates)
// Defaults: host=localhost, port=5023, imei=0123456789012345, lat/lng=25.461/68.7183
// (env vars GT06_HOST, GT06_TCP_PORT, TEST_IMEI also work)
//
// Sends a login packet, waits for the server's ACK, then sends a location packet
// every 5 seconds (slowly drifting around Tandojam) and a heartbeat every 30 seconds,
// like a real tracker does.

import net from 'net';

const [, , argHost, argPort, argImei, argLat, argLng] = process.argv;
const HOST = argHost || process.env.GT06_HOST || 'localhost';
const PORT = Number(argPort || process.env.GT06_TCP_PORT || 5023);
const TEST_IMEI = argImei || process.env.TEST_IMEI || '0123456789012345'; // must match the imei of a Device in your DB
const START_LAT = Number(argLat) || 25.461;
const START_LNG = Number(argLng) || 68.7183;
const DRIFT = 0.0001; // about 11 m per step, so a bus placed on a stop stays inside its geofence

function crc16Itu(buffer) {
  let fcs = 0xffff;
  for (const byte of buffer) {
    fcs ^= byte;
    for (let i = 0; i < 8; i++) {
      if (fcs & 1) fcs = (fcs >> 1) ^ 0x8408;
      else fcs >>= 1;
    }
  }
  return (~fcs) & 0xffff;
}

function buildPacket(protocol, body) {
  const serial = Math.floor(Math.random() * 0xffff);
  const serialBuf = Buffer.alloc(2);
  serialBuf.writeUInt16BE(serial, 0);

  const inner = Buffer.concat([Buffer.from([protocol]), body, serialBuf]);
  const length = inner.length + 2; // + checksum(2)

  const forCrc = Buffer.concat([Buffer.from([length]), inner]);
  const crc = crc16Itu(forCrc);
  const crcBuf = Buffer.alloc(2);
  crcBuf.writeUInt16BE(crc, 0);

  return Buffer.concat([
    Buffer.from([0x78, 0x78]),
    Buffer.from([length]),
    inner,
    crcBuf,
    Buffer.from([0x0d, 0x0a]),
  ]);
}

function buildLoginPacket(imei) {
  // IMEI encoded as 8 bytes BCD (each hex digit = one decimal digit, padded)
  const paddedImei = imei.padStart(16, '0');
  const body = Buffer.from(paddedImei, 'hex');
  return buildPacket(0x01, body);
}

function buildHeartbeatPacket() {
  // terminal info, voltage level, GSM signal, alarm/language (values are arbitrary here)
  return buildPacket(0x13, Buffer.from([0x40, 0x04, 0x04, 0x00, 0x01]));
}

function buildLocationPacket(latitude, longitude, speedKmh) {
  const now = new Date();
  const dateTime = Buffer.from([
    now.getUTCFullYear() % 100,
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds(),
  ]);

  const gpsInfoByte = 0xc0 | 8; // arbitrary length nibble + 8 satellites

  const rawLat = Math.round(Math.abs(latitude) * 30000 * 60);
  const rawLon = Math.round(Math.abs(longitude) * 30000 * 60);

  const latBuf = Buffer.alloc(4);
  latBuf.writeUInt32BE(rawLat, 0);
  const lonBuf = Buffer.alloc(4);
  lonBuf.writeUInt32BE(rawLon, 0);

  const speedByte = Buffer.from([Math.min(speedKmh, 255)]);

  // course/status: bit 0x0400 = south; north + east here, so leave it unset
  const courseStatus = Buffer.alloc(2);
  courseStatus.writeUInt16BE(0x0000, 0);

  const body = Buffer.concat([dateTime, Buffer.from([gpsInfoByte]), latBuf, lonBuf, speedByte, courseStatus]);
  return buildPacket(0x12, body);
}

let lat = START_LAT;
let lng = START_LNG;
let started = false;
let locationTimer = null;
let heartbeatTimer = null;

const socket = net.createConnection({ host: HOST, port: PORT }, () => {
  console.log(`[test-tracker] Connected to ${HOST}:${PORT}`);
  console.log(`[test-tracker] Sending login with IMEI ${TEST_IMEI}`);
  socket.write(buildLoginPacket(TEST_IMEI));
});

socket.on('data', (data) => {
  console.log('[test-tracker] Received ACK:', data.toString('hex'));
  if (started) return;
  started = true; // the first ACK is the login ACK: the server accepted us, start reporting

  locationTimer = setInterval(() => {
    lat += (Math.random() - 0.5) * DRIFT;
    lng += (Math.random() - 0.5) * DRIFT;
    const speed = Math.floor(Math.random() * 40);
    console.log(`[test-tracker] Sending location: ${lat.toFixed(6)}, ${lng.toFixed(6)} @ ${speed} km/h`);
    socket.write(buildLocationPacket(lat, lng, speed));
  }, 5000);

  heartbeatTimer = setInterval(() => {
    console.log('[test-tracker] Sending heartbeat');
    socket.write(buildHeartbeatPacket());
  }, 30000);
});

socket.on('error', (err) => {
  // Node 18+ may report a refused connection as an AggregateError with an empty message (IPv6 + IPv4 attempts)
  const parts = err.errors ? err.errors.map((e) => `${e.code} ${e.address}:${e.port}`) : [err.code || err.message || String(err)];
  console.error(`[test-tracker] Error: ${parts.join(', ')}`);
  if (parts.some((p) => p.includes('ECONNREFUSED'))) {
    console.error(`[test-tracker] Nothing is listening on ${HOST}:${PORT}. Start the bridge (or the server) first, or check the port number.`);
  }
});
socket.on('close', () => {
  console.log('[test-tracker] Connection closed');
  clearInterval(locationTimer);
  clearInterval(heartbeatTimer);
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[test-tracker] Stopping (the bus should go offline)');
  socket.destroy();
});