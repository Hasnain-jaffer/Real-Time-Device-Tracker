
// gt06-bridge/testTracker.js
//
// SIMULATOR ONLY — generates synthetic GT06 GPS packets.
// It does NOT read GPS data from physical hardware.
//
// Tando Allah Yar simulator:
//   IMEI: 123456789012345
//
// Physical Hyderabad tracker:
//   IMEI: 861522080091045
//   This IMEI is deliberately blocked in this simulator.
//
// Usage:
//   node testTracker.js
//   node testTracker.js --host=3.105.114.11 --port=5023 --drive
//
// Options:
//   --host=localhost
//   --port=5023
//   --imei=123456789012345
//   --speed=60
//   --interval=3
//   --drive
//   --waypoints=path/to/waypoints.json

import net from 'net';
import fs from 'fs';
import { crc16Itu } from './gt06Parser.js';

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const DEFAULT_IMEI = '123456789012345';

const PHYSICAL_TRACKER_IMEIS = new Set([
  '861522080091045'
]);

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const value = arg.replace(/^--/, '');
    const separator = value.indexOf('=');

    if (separator === -1) {
      return [value, true];
    }

    return [
      value.slice(0, separator),
      value.slice(separator + 1)
    ];
  })
);

const HOST = args.host || 'localhost';
const PORT = Number(args.port) || 5023;
const IMEI = String(args.imei || DEFAULT_IMEI);

const SPEED_KMH = Number(args.speed) || 60;
const INTERVAL_S = Number(args.interval) || 3;

const DRIVE = Boolean(args.drive);

// Never allow the known physical tracker IMEI
// to be used by this synthetic simulator.
if (PHYSICAL_TRACKER_IMEIS.has(IMEI)) {
  console.error(
    '\nERROR: This IMEI belongs to your physical Hyderabad tracker.'
  );

  console.error(
    'testTracker.js only generates synthetic GPS coordinates.'
  );

  console.error(
    'Use IMEI 123456789012345 for the Tando Allah Yar simulator.\n'
  );

  process.exit(1);
}

if (!/^\d{15,16}$/.test(IMEI)) {
  console.error('ERROR: IMEI must contain 15 or 16 digits.');
  process.exit(1);
}

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error('ERROR: Invalid TCP port.');
  process.exit(1);
}

if (!Number.isFinite(SPEED_KMH) || SPEED_KMH < 0 || SPEED_KMH > 255) {
  console.error('ERROR: Invalid simulator speed.');
  process.exit(1);
}

if (!Number.isFinite(INTERVAL_S) || INTERVAL_S <= 0) {
  console.error('ERROR: Invalid update interval.');
  process.exit(1);
}

// --------------------------------------------------
// DEFAULT SIMULATED ROUTE
// Tando Allah Yar test coordinates
// --------------------------------------------------

const WAYPOINTS = args.waypoints
  ? JSON.parse(fs.readFileSync(args.waypoints, 'utf8'))
  : [
      [25.4628245, 68.7165406],
      [25.4618521, 68.7146871],
      [25.4619528, 68.7108452],
      [25.4642378, 68.7178372],
      [25.4749632, 68.7118645],
      [25.4508657, 68.6760002],
      [25.4264016, 68.5433884]
    ];

if (
  !Array.isArray(WAYPOINTS) ||
  WAYPOINTS.length < 2 ||
  !WAYPOINTS.every(
    (point) =>
      Array.isArray(point) &&
      point.length === 2 &&
      point.every(Number.isFinite)
  )
) {
  console.error('ERROR: Invalid waypoints configuration.');
  process.exit(1);
}

// --------------------------------------------------
// GT06 PACKET SERIAL NUMBER
// --------------------------------------------------

let serial = 0;

const nextSerial = () => {
  serial = (serial % 0xfffe) + 1;
  return serial;
};

// --------------------------------------------------
// GT06 PACKET FRAME
// --------------------------------------------------

function frame(protocol, content) {
  const sequence = nextSerial();

  const length = 1 + content.length + 2 + 2;

  const serialBuffer = Buffer.alloc(2);
  serialBuffer.writeUInt16BE(sequence);

  const crcBuffer = Buffer.alloc(2);

  const crcInput = Buffer.concat([
    Buffer.from([length, protocol]),
    content,
    serialBuffer
  ]);

  crcBuffer.writeUInt16BE(crc16Itu(crcInput));

  return {
    sequence,
    protocol,
    bytes: Buffer.concat([
      Buffer.from([0x78, 0x78, length, protocol]),
      content,
      serialBuffer,
      crcBuffer,
      Buffer.from([0x0d, 0x0a])
    ])
  };
}

// --------------------------------------------------
// LOGIN PACKET
// --------------------------------------------------

function loginFrame() {
  const imeiBuffer = Buffer.from(
    IMEI.padStart(16, '0'),
    'hex'
  );

  return frame(0x01, imeiBuffer);
}

// --------------------------------------------------
// STATUS / HEARTBEAT PACKET
// --------------------------------------------------

function statusFrame(battery = 5, gsm = 3) {
  return frame(
    0x13,
    Buffer.from([
      0x44,
      battery,
      gsm,
      0x00,
      0x02
    ])
  );
}

// --------------------------------------------------
// SYNTHETIC GPS LOCATION PACKET
// --------------------------------------------------

function locationFrame({
  lat,
  lng,
  speed = 0,
  course = 0,
  fix = true,
  newer = false,
  sats = 8
}) {
  const now = new Date();

  const dateTime = Buffer.from([
    now.getUTCFullYear() % 100,
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ]);

  const latRaw = Buffer.alloc(4);
  const lngRaw = Buffer.alloc(4);

  latRaw.writeUInt32BE(
    Math.round(Math.abs(lat) * 1800000)
  );

  lngRaw.writeUInt32BE(
    Math.round(Math.abs(lng) * 1800000)
  );

  let flags = course & 0x03ff;

  if (fix) flags |= 0x1000;
  if (lat >= 0) flags |= 0x0400;
  if (lng < 0) flags |= 0x0800;

  const flagBuffer = Buffer.alloc(2);
  flagBuffer.writeUInt16BE(flags);

  const lbs = Buffer.from([
    0x01, 0x9a, 0x03, 0x28,
    0x7d, 0x00, 0x1f, 0x71
  ]);

  const parts = [
    dateTime,
    Buffer.from([0xc0 | (sats & 0x0f)]),
    latRaw,
    lngRaw,
    Buffer.from([speed]),
    flagBuffer,
    lbs
  ];

  if (newer) {
    parts.push(
      Buffer.from([
        0x01, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x00
      ])
    );
  }

  return frame(
    newer ? 0x22 : 0x12,
    Buffer.concat(parts)
  );
}

// --------------------------------------------------
// TCP CONNECTION
// --------------------------------------------------

let rx = Buffer.alloc(0);
let waiting = null;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const socket = net.createConnection({
  host: HOST,
  port: PORT
});

socket.setNoDelay(true);
socket.setKeepAlive(true, 30000);

socket.on('data', (data) => {
  rx = Buffer.concat([rx, data]);

  if (waiting && rx.length >= 10) {
    const ack = rx.subarray(0, 10);

    rx = rx.subarray(10);

    waiting(ack);
  }
});

socket.on('error', (error) => {
  console.error(
    `Could not connect to ${HOST}:${PORT}: ${error.message}`
  );

  process.exit(1);
});

socket.on('close', () => {
  console.log('\nSimulator connection closed.');
});

// --------------------------------------------------
// ACK VALIDATION
// --------------------------------------------------

let failures = 0;

function report(ok, label, detail = '') {
  if (!ok) failures++;

  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label}${
      detail ? '  ' + detail : ''
    }`
  );
}

function sendExpectingAck(packet, label) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      waiting = null;

      report(
        false,
        `${label}: no ACK within 3s`
      );

      resolve();
    }, 3000);

    waiting = (ack) => {
      clearTimeout(timer);
      waiting = null;

      const wellFormed =
        ack[0] === 0x78 &&
        ack[1] === 0x78 &&
        ack[2] === 0x05 &&
        ack[3] === packet.protocol &&
        ack.readUInt16BE(4) === packet.sequence &&
        ack.readUInt16BE(6) ===
          crc16Itu(ack.subarray(2, 6)) &&
        ack[8] === 0x0d &&
        ack[9] === 0x0a;

      report(
        wellFormed,
        `${label}: ACK is well-formed`,
        ack.toString('hex')
      );

      resolve();
    };

    socket.write(packet.bytes);
  });
}

// --------------------------------------------------
// SYNTHETIC TEST POSITIONS
// --------------------------------------------------

function destination(index) {
  return {
    lat: 25.4628 + index * 0.0003,
    lng: 68.7165 + index * 0.0003
  };
}

// --------------------------------------------------
// PROTOCOL SELF-CHECK
// --------------------------------------------------

async function selfCheck() {
  console.log('\nSYNTHETIC GT06 SIMULATOR');
  console.log(`IMEI: ${IMEI}`);
  console.log(`Destination: ${HOST}:${PORT}`);
  console.log('GPS coordinates are generated, not physical.\n');

  await sendExpectingAck(
    loginFrame(),
    'login'
  );

  await sleep(1500);

  await sendExpectingAck(
    statusFrame(5, 3),
    'status / heartbeat'
  );

  const a = destination(0);

  socket.write(
    locationFrame({
      lat: a.lat,
      lng: a.lng,
      speed: 30,
      course: 90
    }).bytes
  );

  console.log('SENT  synthetic location 0x12');

  await sleep(300);

  const b = destination(1);

  socket.write(
    locationFrame({
      lat: b.lat,
      lng: b.lng,
      speed: 32,
      course: 91,
      newer: true
    }).bytes
  );

  console.log('SENT  synthetic location 0x22');

  await sleep(300);

  socket.write(
    locationFrame({
      lat: 0,
      lng: 0,
      fix: false,
      sats: 0
    }).bytes
  );

  console.log('SENT  no-GPS-fix test packet');

  await sleep(300);

  const c = locationFrame({
    lat: destination(2).lat,
    lng: destination(2).lng,
    speed: 35
  }).bytes;

  const d = locationFrame({
    lat: destination(3).lat,
    lng: destination(3).lng,
    speed: 36
  }).bytes;

  socket.write(Buffer.concat([c, d]));

  console.log('SENT  multiple packets in one TCP write');

  await sleep(300);

  const e = locationFrame({
    lat: destination(4).lat,
    lng: destination(4).lng,
    speed: 37
  }).bytes;

  socket.write(e.subarray(0, 15));

  await sleep(150);

  socket.write(e.subarray(15));

  console.log('SENT  split TCP packet test');

  await sleep(500);

  if (failures) {
    console.log(`\n${failures} check(s) FAILED`);
  } else {
    console.log(
      '\nAll ACK checks passed.'
    );
  }
}

// --------------------------------------------------
// SIMULATED ROUTE MOVEMENT
// --------------------------------------------------

function* routePositions() {
  const R = 6371;

  const distanceKm = (a, b) => {
    const dLat =
      ((b[0] - a[0]) * Math.PI) / 180;

    const dLon =
      ((b[1] - a[1]) * Math.PI) / 180;

    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a[0] * Math.PI) / 180) *
        Math.cos((b[0] * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return (
      R *
      2 *
      Math.atan2(
        Math.sqrt(x),
        Math.sqrt(1 - x)
      )
    );
  };

  const cumulative = [0];

  for (let i = 1; i < WAYPOINTS.length; i++) {
    cumulative.push(
      cumulative[i - 1] +
        distanceKm(WAYPOINTS[i - 1], WAYPOINTS[i])
    );
  }

  const total = cumulative[cumulative.length - 1];

  const step =
    (SPEED_KMH * INTERVAL_S) / 3600;

  let travelled = 0;

  while (true) {
    travelled += step;

    if (travelled > total + 0.3) {
      travelled = 0;
    }

    const distance = Math.min(travelled, total);

    let index = 1;

    while (
      index < cumulative.length - 1 &&
      cumulative[index] < distance
    ) {
      index++;
    }

    const segment =
      cumulative[index] - cumulative[index - 1];

    const fraction =
      segment === 0
        ? 0
        : (distance - cumulative[index - 1]) / segment;

    const start = WAYPOINTS[index - 1];
    const end = WAYPOINTS[index];

    yield [
      start[0] + (end[0] - start[0]) * fraction,
      start[1] + (end[1] - start[1]) * fraction
    ];
  }
}

// --------------------------------------------------
// CONTINUOUS SIMULATED DRIVING
// --------------------------------------------------

async function drive() {
  console.log(
    `\nDriving SYNTHETIC route at ${SPEED_KMH} km/h.`
  );

  console.log(
    `Update interval: ${INTERVAL_S} seconds.`
  );

  console.log(
    'Press Ctrl+C to stop the simulator.\n'
  );

  let ticks = 0;

  for (const [lat, lng] of routePositions()) {
    socket.write(
      locationFrame({
        lat,
        lng,
        speed: SPEED_KMH
      }).bytes
    );

    if (++ticks % 10 === 0) {
      socket.write(statusFrame(5, 3).bytes);
    }

    await sleep(INTERVAL_S * 1000);
  }
}

// --------------------------------------------------
// MAIN
// --------------------------------------------------

(async () => {
  try {
    await new Promise((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('error', reject);
    });

    console.log('TCP connection established.');

    await selfCheck();

    if (failures > 0) {
      socket.end();
      process.exitCode = 1;
      return;
    }

    if (DRIVE) {
      await drive();
    } else {
      socket.end();

      await sleep(300);

      process.exitCode = 0;
    }
  } catch (error) {
    console.error('Simulator error:', error.message);
    socket.destroy();
    process.exitCode = 1;
  }
})();
