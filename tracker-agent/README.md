# TrackSphere Tracker Agent

A standalone tracking client that streams a device's live location to the
TrackSphere server — independent of any browser session. This is the
software equivalent of a physical GPS tracker unit: install it on any
machine (a Raspberry Pi mounted on a bus, an old phone, a laptop) and it
reports location continuously, with no user login required.

## How it authenticates

Each device registered in the TrackSphere Device Center gets a unique
`deviceKey`. The agent connects to the server's Socket.IO endpoint using
that key, and every location it reports is attributed to that specific
device — exactly as if the bus itself were "logged in."

## Setup

1. `cd tracker-agent`
2. `npm install`
3. `cp .env.example .env`
4. In the TrackSphere app, go to **Device Center**, register a bus (or use
   an existing one), click **Show** on its Device Key, and paste it into
   `.env` as `DEVICE_KEY`.
5. `npm start`

## Location sources

- `LOCATION_SOURCE=simulate` (default) — generates gently wandering
  coordinates for demos and testing, no hardware required.
- `LOCATION_SOURCE=gps` — reserved for real GPS hardware (USB/serial NMEA
  module) integration in a future version. Currently throws a clear error
  if selected, since hardware integration is architecture-ready but not
  yet implemented.

## Behavior

- Reconnects automatically if the connection drops (network loss, server
  restart) — never requires manual restart in the field.
- Reports on a fixed interval (`REPORT_INTERVAL_MS`, default 5 seconds).
- Runs headless — no UI, designed to run as a background process or
  systemd service on embedded hardware.