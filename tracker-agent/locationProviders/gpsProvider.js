// tracker-agent/locationProviders/gpsProvider.js
// Placeholder for real GPS hardware integration via a serial NMEA-0183 device
// (e.g. a USB GPS dongle). To wire this up for real hardware:
//   npm install serialport @serialport/parser-readline
// then parse incoming $GPGGA/$GPRMC sentences into { latitude, longitude }.
//
// Left unimplemented intentionally — the project's current phase is
// architecture-ready, not hardware-integrated. See README for details.

export function createGpsProvider() {
  throw new Error(
    '[gpsProvider] Real GPS hardware integration is not implemented yet. ' +
      'Set LOCATION_SOURCE=simulate in .env to run the agent without hardware.'
  );
}