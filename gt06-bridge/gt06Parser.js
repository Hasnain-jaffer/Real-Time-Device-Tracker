// gt06-bridge/gt06Parser.js
// Parser for the GT06 / GT06N / TK103-clone binary protocol.
//
// Frame:  78 78 [len] [protocol] [content...] [serial 2B] [crc 2B] 0D 0A
//   len  = bytes from protocol number through crc (inclusive)
//   crc  = CRC-ITU (CRC-16/X-25) over [len .. serial]
// Long frames start 79 79 and carry a 2-byte length (we frame them but ignore them).

const START_SHORT = [0x78, 0x78];
const START_LONG = [0x79, 0x79];

export const PROTOCOL = {
  LOGIN: 0x01,
  GPS_LBS: 0x12, // location (older firmware)
  STATUS: 0x13, // heartbeat / terminal status
  ALARM: 0x16, // location + alarm
  GPS_LBS_2: 0x22, // location (GT06N / newer firmware)
  ALARM_2: 0x26, // location + alarm (newer firmware)
  HEARTBEAT_2: 0x23, // heartbeat on some models (no battery/GSM decoding)
};

const LOCATION_PROTOCOLS = new Set([
  PROTOCOL.GPS_LBS,
  PROTOCOL.GPS_LBS_2,
  PROTOCOL.ALARM,
  PROTOCOL.ALARM_2,
]);
const ACK_PROTOCOLS = new Set([PROTOCOL.LOGIN, PROTOCOL.STATUS, PROTOCOL.HEARTBEAT_2, PROTOCOL.ALARM, PROTOCOL.ALARM_2]);

const MAX_FRAME = 2048;

export function crc16Itu(buffer) {
  let crc = 0xffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >> 1) ^ 0x8408 : crc >> 1;
  }
  return ~crc & 0xffff;
}

// Splits a TCP byte stream into complete frames. Keeps any partial frame in
// `remainder` (TCP can split or merge packets), and resyncs past garbage.
export function extractPackets(buffer) {
  const packets = [];
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const b0 = buffer[offset];
    const b1 = buffer[offset + 1];
    const isShort = b0 === START_SHORT[0] && b1 === START_SHORT[1];
    const isLong = b0 === START_LONG[0] && b1 === START_LONG[1];
    if (!isShort && !isLong) {
      offset++;
      continue;
    }

    const headerLen = isLong ? 4 : 3;
    if (offset + headerLen > buffer.length) break; // length field not fully received yet

    const length = isLong ? buffer.readUInt16BE(offset + 2) : buffer[offset + 2];
    const total = headerLen + length + 2;
    if (length < 5 || total > MAX_FRAME) {
      offset++; // implausible length: not a real frame start, resync
      continue;
    }
    if (offset + total > buffer.length) break; // frame incomplete, wait for more bytes

    if (buffer[offset + total - 2] !== 0x0d || buffer[offset + total - 1] !== 0x0a) {
      offset++; // bad stop bits: resync one byte at a time instead of swallowing data
      continue;
    }

    packets.push(buffer.subarray(offset, offset + total));
    offset += total;
  }

  return { packets, remainder: buffer.subarray(offset) };
}

export function hasValidCrc(packet) {
  const body = packet.subarray(2, packet.length - 4);
  return crc16Itu(body) === packet.readUInt16BE(packet.length - 4);
}

function parseLocation(content) {
  // datetime(6) | gps info(1) | lat(4) | lon(4) | speed(1) | course+status(2) ...
  if (content.length < 18) throw new Error('location packet too short');
  const satellites = content[6] & 0x0f;
  const rawLat = content.readUInt32BE(7);
  const rawLon = content.readUInt32BE(11);
  const speedKmh = content[15];
  const flags = content.readUInt16BE(16);

  let latitude = rawLat / 1800000; // value is degrees * 30000 * 60
  let longitude = rawLon / 1800000;
  if ((flags & 0x0400) === 0) latitude = -latitude; // bit 10: 1 = north, 0 = south
  if ((flags & 0x0800) !== 0) longitude = -longitude; // bit 11: 1 = west, 0 = east

  const hasFix =
    (flags & 0x1000) !== 0 && // bit 12: GPS is positioned
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    !(rawLat === 0 && rawLon === 0);

  return {
    latitude: Number(latitude.toFixed(6)),
    longitude: Number(longitude.toFixed(6)),
    speedKmh,
    satellites,
    course: flags & 0x03ff,
    hasFix,
    flags,
  };
}

function parseStatus(content) {
  // terminal info(1) | voltage level(1) | gsm signal(1) | alarm/language(2)
  if (content.length < 3) throw new Error('status packet too short');
  const info = content[0];
  return {
    acc: (info & 0x02) !== 0,
    charging: (info & 0x04) !== 0,
    gpsTracking: (info & 0x40) !== 0,
    batteryLevel: content[1], // 0 (no power) .. 6 (very high)
    gsmSignal: content[2], // 0 (none) .. 4 (strong)
  };
}

function parseLogin(content) {
  if (content.length < 8) throw new Error('login packet too short');
  // 8 bytes of BCD = 16 digits. IMEI is 15 digits, so the first digit is padding.
  const raw = content.subarray(0, 8).toString('hex');
  if (!/^\d{16}$/.test(raw)) throw new Error('login packet has a non-numeric terminal id');
  return { imei: raw.startsWith('0') ? raw.slice(1) : raw };
}

export function parsePacket(packet) {
  const isLong = packet[0] === 0x79;
  const headerLen = isLong ? 4 : 3;
  const protocol = packet[headerLen];
  const content = packet.subarray(headerLen + 1, packet.length - 6);
  const serial = packet.readUInt16BE(packet.length - 6);

  const base = { protocol, serial, needsAck: !isLong && ACK_PROTOCOLS.has(protocol) };

  if (isLong) return { ...base, type: 'unknown' };
  if (protocol === PROTOCOL.LOGIN) return { ...base, type: 'login', data: parseLogin(content) };
  if (protocol === PROTOCOL.STATUS) return { ...base, type: 'status', data: parseStatus(content) };
  if (protocol === PROTOCOL.HEARTBEAT_2) return { ...base, type: 'heartbeat' };
  if (LOCATION_PROTOCOLS.has(protocol)) return { ...base, type: 'location', data: parseLocation(content) };
  return { ...base, type: 'unknown' };
}

// Server -> tracker acknowledgement: 78 78 05 <protocol> <serial> <crc> 0D 0A
export function buildAck(protocol, serial) {
  const body = Buffer.alloc(4);
  body[0] = 0x05;
  body[1] = protocol;
  body.writeUInt16BE(serial, 2);
  const crc = Buffer.alloc(2);
  crc.writeUInt16BE(crc16Itu(body), 0);
  return Buffer.concat([Buffer.from(START_SHORT), body, crc, Buffer.from([0x0d, 0x0a])]);
}