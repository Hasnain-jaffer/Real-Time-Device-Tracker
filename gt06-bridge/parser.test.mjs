// gt06-bridge/parser.test.mjs  (run with: npm test)
// Checks the parser against examples from the GT06 protocol manual and against
// packets captured from real trackers.
import { crc16Itu, extractPackets, parsePacket, buildAck, hasValidCrc } from './gt06Parser.js';

let failed = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${extra}`);
  if (!ok) failed++;
};
const hex = (s) => Buffer.from(s.replace(/\s+/g, ''), 'hex');
const first = (buf) => parsePacket(extractPackets(buf).packets[0]);

// --- Examples from the protocol manual ---
const login = hex('78 78 0D 01 01 23 45 67 89 01 23 45 00 01 8C DD 0D 0A');
const status = hex('78 78 0A 13 40 04 04 00 01 00 0F DC EE 0D 0A');
check('manual login packet: CRC valid', hasValidCrc(login));
check('manual status packet: CRC valid', hasValidCrc(status));
check('login ACK matches the manual', buildAck(0x01, 1).toString('hex') === '787805010001d9dc0d0a');

const l = first(login);
check('login gives the 15-digit IMEI', l.type === 'login' && l.data.imei === '123456789012345', JSON.stringify(l.data));
const s = first(status);
check('status gives battery 4 and signal 4', s.type === 'status' && s.data.batteryLevel === 4 && s.data.gsmSignal === 4, JSON.stringify(s.data));

// --- Packets captured from real trackers ---
// Greater Noida, India (north + east, like Pakistan). Status word 0xD439.
const india = hex('78781f121405170f0027c4030e3b70085189600cd43901940b03fe00df2c00ec1ffc0d0a');
const r1 = first(india).data;
check(
  'real packet (India) decodes to about 28.48N, 77.53E',
  r1.hasFix && r1.latitude > 28.4 && r1.latitude < 28.6 && r1.longitude > 77.4 && r1.longitude < 77.7,
  JSON.stringify(r1)
);
// Rio de Janeiro area, Brazil (south + west). Status word 0x3879.
const brazil = hex('78781f1212010413090ec7027468fc04820cb800387902d40b19de00626b0107d8930d0a');
const r2 = first(brazil).data;
check(
  'real packet (Brazil) decodes to about 22.9S, 42.0W',
  r2.hasFix && r2.latitude < -22 && r2.latitude > -23.5 && r2.longitude < -41.5 && r2.longitude > -42.5,
  JSON.stringify(r2)
);

// --- A packet with no GPS fix must not be treated as a position ---
const noFix = Buffer.from(india);
const base = 4 + 16; // the status word sits at content offset 16; content starts at byte 4 of the frame
noFix.writeUInt16BE(india.readUInt16BE(base) & ~0x1000, base);
check('packet without the GPS-fix bit has hasFix = false', first(noFix).data.hasFix === false);

// --- TCP stream handling ---
const all = Buffer.concat([india, status, brazil]);
check('three packets in one chunk', extractPackets(all).packets.length === 3);
const a = extractPackets(all.subarray(0, 20));
const b = extractPackets(Buffer.concat([a.remainder, all.subarray(20)]));
check('one packet split across two chunks', a.packets.length === 0 && b.packets.length === 3);
check('garbage before a packet is skipped', extractPackets(Buffer.concat([Buffer.from([1, 2, 3, 0x78, 0x00, 9]), india])).packets.length === 1);

console.log(failed ? `\n${failed} FAILED` : '\nALL PASSED');
process.exit(failed ? 1 : 0);