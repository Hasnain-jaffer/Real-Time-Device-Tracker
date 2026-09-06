// server/src/tcp/testGt06Client.js
// Simulated GT06 tracker for testing the TCP server without real hardware.
// Run with: node src/tcp/testGt06Client.js
//
// Sends a real login packet (with a test IMEI), then periodic location
// packets with slowly changing coordinates, mimicking a real device.

import net from 'net';

const HOST = 'localhost';
const PORT = process.env.GT06_TCP_PORT || 5023;
const TEST_IMEI = '0123456789012345'; // must match the `imei` field you set on a Device in your DB

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

  const gpsInfoByte = 0xc0 | 8; // arbitrary length nibble + 8 satellites, "fixed" flag bits set

  const rawLat = Math.round(Math.abs(latitude) * 30000 * 60);
  const rawLon = Math.round(Math.abs(longitude) * 30000 * 60);

  const latBuf = Buffer.alloc(4);
  latBuf.writeUInt32BE(rawLat, 0);
  const lonBuf = Buffer.alloc(4);
  lonBuf.writeUInt32BE(rawLon, 0);

  const speedByte = Buffer.from([Math.min(speedKmh, 255)]);

  // course/status: bit 0x0400 = south, north hemisphere here so leave unset
  const courseStatus = Buffer.alloc(2);
  courseStatus.writeUInt16BE(0x0000, 0);

  const body = Buffer.concat([dateTime, Buffer.from([gpsInfoByte]), latBuf, lonBuf, speedByte, courseStatus]);
  return buildPacket(0x12, body);
}

const socket = net.createConnection({ host: HOST, port: PORT }, () => {
  console.log(`[test-client] Connected to ${HOST}:${PORT}`);
  console.log(`[test-client] Sending login with IMEI ${TEST_IMEI}`);
  socket.write(buildLoginPacket(TEST_IMEI));
});

socket.on('data', (data) => {
  console.log('[test-client] Received ACK:', data.toString('hex'));
});

let lat = 25.4610;
let lng = 68.7183;

setInterval(() => {
  lat += (Math.random() - 0.5) * 0.0005;
  lng += (Math.random() - 0.5) * 0.0005;
  const speed = Math.floor(Math.random() * 40);
  console.log(`[test-client] Sending location: ${lat.toFixed(6)}, ${lng.toFixed(6)} @ ${speed} km/h`);
  socket.write(buildLocationPacket(lat, lng, speed));
}, 5000);

socket.on('error', (err) => console.error('[test-client] Error:', err.message));
socket.on('close', () => console.log('[test-client] Connection closed'));