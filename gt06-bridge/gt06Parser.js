// server/src/tcp/gt06Parser.js
// Parser for the GT06/GT06N protocol used by common budget GPS trackers
// (GT06N, TK103, and many clones). Packet structure:
//
//   0x78 0x78 [length] [protocol#] [...data...] [serial 2B] [checksum 2B] 0x0D 0x0A
//
// Protocol numbers we care about:
//   0x01 - Login (contains device IMEI)
//   0x12 - GPS + LBS location data
//   0x13 - Heartbeat/status
//   0x16 - Alarm (includes GPS data)

const START_BITS = Buffer.from([0x78, 0x78]);
const STOP_BITS = Buffer.from([0x0d, 0x0a]);

const PROTOCOL = {
  LOGIN: 0x01,
  LOCATION: 0x12,
  HEARTBEAT: 0x13,
  ALARM: 0x16,
};

function bcdToString(buffer) {
  // Each nibble is a decimal digit -- standard BCD encoding used for IMEI
  return buffer.toString('hex');
}

function crc16Itu(buffer) {
  // GT06 uses CRC-ITU (X.25) over [length ... serial], verifying the packet's checksum
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

/**
 * Splits a raw TCP stream buffer into individual GT06 packets.
 * Returns { packets: [Buffer], remainder: Buffer } -- remainder is any
 * incomplete trailing data to prepend to the next chunk (TCP can split
 * packets across multiple reads).
 */
function extractPackets(buffer) {
  const packets = [];
  let offset = 0;

  while (true) {
    const startIdx = buffer.indexOf(START_BITS, offset);
    if (startIdx === -1) break;

    if (startIdx + 3 > buffer.length) break; // not enough bytes yet to read length

    const length = buffer[startIdx + 2];
    const packetEnd = startIdx + 2 + 1 + length + 2; // start(2) + lenByte(1) + body(length) + stop(2)

    if (packetEnd > buffer.length) break; // incomplete, wait for more data

    const packet = buffer.subarray(startIdx, packetEnd);
    if (packet.subarray(packet.length - 2).equals(STOP_BITS)) {
      packets.push(packet);
    }
    offset = packetEnd;
  }

  return { packets, remainder: buffer.subarray(offset) };
}

/**
 * Parses a single validated GT06 packet.
 * Returns { protocol, serial, data } where `data` shape depends on protocol.
 */
function parsePacket(packet) {
  const length = packet[2];
  const protocol = packet[3];
  const body = packet.subarray(4, 4 + length - 5); // exclude protocol byte + serial(2) + checksum(2)
  const serial = packet.readUInt16BE(4 + length - 5);

    if (protocol === PROTOCOL.LOGIN) {
    const imei = bcdToString(body.subarray(0, 8));
    return { protocol, serial, data: { imei } };
  }

  if (protocol === PROTOCOL.LOCATION || protocol === PROTOCOL.ALARM) {
    // Date/time: 6 bytes (YY MM DD HH mm ss)
    // GPS info byte, satellite count, then lat(4B) lon(4B) speed(1B) course/status(2B)
    let offset = 6; // skip datetime
    const gpsInfo = body[offset]; // upper nibble = length, lower nibble = satellite count
    offset += 1;

    const rawLat = body.readUInt32BE(offset);
    offset += 4;
    const rawLon = body.readUInt32BE(offset);
    offset += 4;
    const speedKmh = body[offset];
    offset += 1;
    const courseStatus = body.readUInt16BE(offset);

    // GT06 encodes lat/lon as (degrees * 30000 * 60) -- divide out to get real coordinates
    let latitude = rawLat / 30000 / 60;
    let longitude = rawLon / 30000 / 60;

    const isSouth = !!(courseStatus & 0x0400);
    const isWest = !((courseStatus >> 11) & 0x1) ? false : true; // bit layout varies by clone; see note below
    if (isSouth) latitude = -latitude;
    // Longitude hemisphere bit placement is inconsistent across GT06 clones --
    // if you find coordinates mirrored (wrong side of prime meridian) once real
    // hardware arrives, flip this condition. Flagging honestly rather than
    // guessing a value we can't verify without the physical device.
    if (isWest) longitude = -longitude;

    return {
      protocol,
      serial,
      data: {
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
        speedKmh,
        satelliteCount: gpsInfo & 0x0f,
      },
    };
  }

  if (protocol === PROTOCOL.HEARTBEAT) {
    return { protocol, serial, data: {} };
  }

  return { protocol, serial, data: null };
}

/**
 * Builds the ACK response the device expects after a login or heartbeat
 * packet -- without this, most GT06 clones will disconnect and retry.
 */
function buildAck(protocol, serial) {
  const body = Buffer.alloc(5);
  body[0] = protocol;
  body.writeUInt16BE(serial, 1);
  const length = body.length + 2; // + checksum(2), NOT including start/stop/length byte itself

  const packetForCrc = Buffer.concat([Buffer.from([length]), body]);
  const crc = crc16Itu(packetForCrc);

  const crcBuf = Buffer.alloc(2);
  crcBuf.writeUInt16BE(crc, 0);

  return Buffer.concat([START_BITS, Buffer.from([length]), body, crcBuf, STOP_BITS]);
}

export { PROTOCOL, extractPackets, parsePacket, buildAck };