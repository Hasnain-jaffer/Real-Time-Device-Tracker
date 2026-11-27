
// gt06-bridge/testTracker.js
// Synthetic GT06 tracker simulator.
// Generates artificial GPS coordinates; it does NOT read physical GPS hardware.
//
// Default test IMEI: 123456789012345
//
// Usage:
// node testTracker.js
// node testTracker.js --host=3.105.114.11 --port=5023 --imei=861522080091045 --drive
//
// Options:
// --host=localhost
// --port=5023
// --imei=123456789012345
// --speed=60
// --interval=3
// --drive
// --waypoints=path/to/waypoints.json

import net from 'net';
import fs from 'fs';
import { crc16Itu } from './gt06Parser.js';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const value = arg.replace(/^--/, '');
    const separator = value.indexOf('=');

    return separator === -1
      ? [value, true]
      : [value.slice(0, separator), value.slice(separator + 1)];
  })
);

const HOST = args.host || 'localhost';
const PORT = Number(args.port) || 5023;
const IMEI = String(args.imei || '123456789012345');
const SPEED_KMH = Number(args.speed) || 60;
const INTERVAL_S = Number(args.interval) || 3;
const DRIVE = Boolean(args.drive);

if (!/^\d{15,16}$/.test(IMEI)) {
  console.error('ERROR: IMEI must contain 15 or 16 digits.');
  process.exit(1);
}

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error('ERROR: Invalid TCP port.');
  process.exit(1);
}

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
    p => Array.isArray(p) &&
      p.length === 2 &&
      p.every(Number.isFinite)
  )
) {
  console.error('ERROR: Invalid waypoints.');
  process.exit(1);
}

let serial = 0;

const nextSerial = () => {
  serial = (serial % 0xfffe) + 1;
  return serial;
};

function frame(protocol, content) {
  const s = nextSerial();
  const length = 1 + content.length + 2 + 2;

  const ser = Buffer.alloc(2);
  ser.writeUInt16BE(s);

  const crc = Buffer.alloc(2);

  crc.writeUInt16BE(
    crc16Itu(
      Buffer.concat([
        Buffer.from([length, protocol]),
        content,
        ser
      ])
    )
  );

  return {
    s,
    protocol,
    bytes: Buffer.concat([
      Buffer.from([0x78, 0x78, length, protocol]),
      content,
      ser,
      crc,
      Buffer.from([0x0d, 0x0a])
    ])
  };
}

const loginFrame = () =>
  frame(
    0x01,
    Buffer.from(IMEI.padStart(16, '0'), 'hex')
  );

const statusFrame = (battery = 5, gsm = 3) =>
  frame(
    0x13,
    Buffer.from([0x44, battery, gsm, 0x00, 0x02])
  );

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

  const dt = Buffer.from([
    now.getUTCFullYear() % 100,
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  ]);

  const latRaw = Buffer.alloc(4);
  const lngRaw = Buffer.alloc(4);

  latRaw.writeUInt32BE(Math.round(Math.abs(lat) * 1800000));
  lngRaw.writeUInt32BE(Math.round(Math.abs(lng) * 1800000));

  let flags = course & 0x03ff;

  if (fix) flags |= 0x1000;
  if (lat >= 0) flags |= 0x0400;
  if (lng < 0) flags |= 0x0800;

  const flagBuf = Buffer.alloc(2);
  flagBuf.writeUInt16BE(flags);

  const lbs = Buffer.from([
    0x01, 0x9a, 0x03, 0x28,
    0x7d, 0x00, 0x1f, 0x71
  ]);

  const parts = [
    dt,
    Buffer.from([0xc0 | (sats & 0x0f)]),
    latRaw,
    lngRaw,
    Buffer.from([speed]),
    flagBuf,
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

let rx = Buffer.alloc(0);
let waiting = null;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const socket = net.createConnection({
  host: HOST,
  port: PORT
});

socket.setNoDelay(true);

socket.on('data', data => {
  rx = Buffer.concat([rx, data]);

  if (waiting && rx.length >= 10) {
    const ack = rx.subarray(0, 10);
    rx = rx.subarray(10);
    waiting(ack);
  }
});

socket.on('error', error => {
  console.error(`Connection error: ${error.message}`);
  process.exit(1);
});

socket.on('close', () => {
  console.log('Simulator connection closed.');
});

let failures = 0;

function report(ok, label, detail = '') {
  if (!ok) failures++;

  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? '  ' + detail : ''}`
  );
}

function sendExpectingAck(packet, label) {
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      waiting = null;
      report(false, `${label}: no ACK within 3s`);
      resolve();
    }, 3000);

    waiting = ack => {
      clearTimeout(timer);
      waiting = null;

      const valid =
        ack[0] === 0x78 &&
        ack[1] === 0x78 &&
        ack[2] === 0x05 &&
        ack[3] === packet.protocol &&
        ack.readUInt16BE(4) === packet.s &&
        ack.readUInt16BE(6) === crc16Itu(ack.subarray(2, 6)) &&
        ack[8] === 0x0d &&
        ack[9] === 0x0a;

      report(valid, `${label}: ACK is well-formed`, ack.toString('hex'));
      resolve();
    };

    socket.write(packet.bytes);
  });
}

function destination(i) {
  return {
    lat: 25.4628 + i * 0.0003,
    lng: 68.7165 + i * 0.0003
  };
}

async function selfCheck() {
  console.log('\nSYNTHETIC GT06 TRACKER SIMULATOR');
  console.log(`IMEI: ${IMEI}`);
  console.log(`Server: ${HOST}:${PORT}`);
  console.log('WARNING: All generated coordinates are artificial.\n');

  await sendExpectingAck(loginFrame(), 'login');
  await sleep(1500);

  await sendExpectingAck(statusFrame(5, 3), 'status / heartbeat');

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

  console.log('SENT  no-GPS-fix packet');

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
  console.log('SENT  two packets in one TCP write');

  await sleep(300);

  const e = locationFrame({
    lat: destination(4).lat,
    lng: destination(4).lng,
    speed: 37
  }).bytes;

  socket.write(e.subarray(0, 15));
  await sleep(150);
  socket.write(e.subarray(15));

  console.log('SENT  split TCP packet');

  await sleep(500);

  console.log(
    failures
      ? `\n${failures} check(s) FAILED`
      : '\nAll ACK checks passed.'
  );
}

function* routePositions() {
  const R = 6371;

  const km = (a, b) => {
    const dLat = ((b[0] - a[0]) * Math.PI) / 180;
    const dLon = ((b[1] - a[1]) * Math.PI) / 180;

    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };

  const cum = [0];

  for (let i = 1; i < WAYPOINTS.length; i++) {
    cum.push(
      cum[i - 1] + km(WAYPOINTS[i - 1], WAYPOINTS[i])
    );
  }

  const total = cum[cum.length - 1];
  const step = (SPEED_KMH * INTERVAL_S) / 3600;

  let travelled = 0;

  while (true) {
    travelled += step;

    if (travelled > total + 0.3) travelled = 0;

    const d = Math.min(travelled, total);

    let i = 1;

    while (i < cum.length - 1 && cum[i] < d) i++;

    const seg = cum[i] - cum[i - 1];
    const f = seg === 0 ? 0 : (d - cum[i - 1]) / seg;

    yield [
      WAYPOINTS[i - 1][0] +
        (WAYPOINTS[i][0] - WAYPOINTS[i - 1][0]) * f,

      WAYPOINTS[i - 1][1] +
        (WAYPOINTS[i][1] - WAYPOINTS[i - 1][1]) * f
    ];
  }
}

async function drive() {
  console.log(
    `Driving synthetic route at ${SPEED_KMH} km/h, every ${INTERVAL_S}s.`
  );

  console.log('Press Ctrl+C to stop.');

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
    console.error(error.message);
    socket.destroy();
    process.exitCode = 1;
  }
})();
