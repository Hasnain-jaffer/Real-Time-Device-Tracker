# My Campus Ride

A full-stack, real-time campus bus tracking platform. Riders see live bus locations on a map (web or mobile), get geofence-based arrival/departure alerts, ask questions in plain language, and review route history; admins manage buses, routes, users, schedules, and system-wide analytics. The stack supports three ways for a "device" to report its location: a rider's own browser, a headless Node.js agent (for a Raspberry Pi or old phone strapped to a bus), or a real GT06/TK103 GPS hardware tracker talking raw TCP through a standalone bridge process.

> This repo started as a small Socket.IO + Leaflet demo and has since been rebuilt into a layered, production-oriented monorepo spanning a web client, a React Native mobile app, an Express/MongoDB API, and a dedicated GPS hardware bridge. This README reflects the current architecture — five packages, not one.

## Features

- 🗺️ **Live map tracking** — Leaflet + `react-leaflet` with marker clustering on web, and a native map screen in the mobile app, both showing every online bus in real time over Socket.IO
- 🔐 **Full JWT auth** — access/refresh token pair, email verification and password reset via Resend, per-request suspension checks, role-based access (`user` / `admin`) — shared across web and mobile
- 🚌 **Device (bus) management** — admins register buses, each gets a unique `deviceKey`; keys can be regenerated if compromised
- 📡 **Three ways to report location:**
  - Browser geolocation (for quick testing/demo devices)
  - `tracker-agent` — a standalone Node.js background agent authenticating with a device key, with a simulated-location mode for demos and a GPS-hardware mode reserved for future serial/NMEA support
  - **Real GPS hardware** — `gt06-bridge`, a standalone TCP server implementing the GT06/GT06N/TK103 protocol, so an actual off-the-shelf vehicle tracker reports directly with no app or browser involved
- 🤖 **AI-assisted search & delay notes (Gemini)** — ask a transit question in plain language ("which bus goes near the library") and get matched routes/stops/buses; when a bus is running late, get a one-line delay explanation that is strictly grounded in its own telemetry (scheduled time, today's vs. last-7-days average speed) — the backend rejects any AI-generated note that mentions an unmeasured cause (traffic, weather, breakdown, etc.) or includes a number not present in the metrics, falling back to a deterministic templated note instead. Both endpoints are per-user rate-limited and short-cache the result.
- 🚧 **Geofences** — draw stop/zone boundaries; entry/exit is evaluated live against every location ping and can trigger notifications
- 🕓 **Schedules & delay tracking** — per-device schedule entries with a delay-status endpoint
- 📜 **Trip history & playback** — persisted location pings (`LocationPing`) per device, replayable on the map via playback controls (web and mobile)
- 🔔 **Real-time notifications** — per-user Socket.IO rooms deliver live alerts (e.g. a bus going offline near a stop) in addition to a notifications inbox
- 📊 **Admin analytics** — system overview, daily distance charts, and stop-activity stats (admin-only, available in both the web admin console and a mobile admin panel screen)
- 🛡️ **Admin console** — suspend/activate/delete users, manage all devices, force-toggle tracking on a device
- 🔍 **Global search** across devices/routes
- 📱 **Native mobile app (Expo / React Native)** — buses, routes, live map, history, alerts, profile/settings, and an admin panel screen, with its own drawer navigation, theming, and location services
- 🎨 **Modern React web frontend** — Vite + Tailwind, light/dark theme, toast notifications, route-based code-splitting (`React.lazy`), protected and admin-only routes

## Tech Stack

| Layer | Technology |
|---|---|
| Web Frontend | React 19, Vite, React Router 7, Tailwind CSS, Zustand, TanStack Query, Recharts, Leaflet / react-leaflet |
| Mobile | Expo / React Native, React Navigation (bottom tabs + drawer + native stack), Expo Location, Expo Secure Store |
| Backend | Node.js, Express 5, Socket.IO 4 |
| GPS Hardware Bridge | Standalone Node.js process (`gt06-bridge`) — raw TCP parser for the GT06 protocol, forwards to the main server over Socket.IO and a secret-authenticated HTTP endpoint |
| AI | Google Gemini (`@google/genai`), with an in-process cache and strict output-grounding checks before anything AI-generated reaches a user |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh), bcrypt password hashing, Resend for transactional email |
| Hardening | Helmet, express-rate-limit, CORS with credentials, Zod validation, Morgan logging, timing-safe secret comparison for the bridge's shared-secret auth |
| Tracker Agent | Standalone Node.js process, Socket.IO client |

## Monorepo Structure

```
Real-Time-Device-Tracker/
├── client/                     # React (Vite) web frontend
│   └── src/
│       ├── app/                 # Providers: Auth, Socket, Theme, Toast, route guards
│       ├── components/          # layout, map (LiveMap + clustering), UI primitives
│       ├── features/             # admin, ai, analytics, devices, geofences, history, routes, schedule, search, tracking
│       ├── pages/                 # Dashboard, DeviceCenter, LiveTracking, History, Analytics, Admin, auth pages, static pages
│       └── lib/                    # apiClient (axios), socketClient, tokenStore
├── mobile/                      # Expo / React Native companion app
│   └── src/
│       ├── context/              # Auth, Socket, LiveBuses, Location, Notifications, Theme, Drawer
│       ├── screens/                # Home, Buses, Routes, LiveMap, History, Alerts, AdminPanel, auth & profile screens
│       ├── components/              # map, schedule card, tracker control, in-app banner, theming
│       └── navigation/               # drawer + stack navigators
├── server/                      # Express + Socket.IO API
│   └── src/
│       ├── config/db.js
│       ├── controllers/            # auth, device, geofence, history, analytics, admin, ai, bridge, notification, profile, route, schedule, search
│       ├── middleware/                # auth.middleware.js (JWT + role check), bridgeAuth.middleware.js (GT06 bridge shared-secret)
│       ├── models/                      # Device, User, Geofence, LocationPing, Notification, Route, Schedule, StopArrival
│       ├── routes/
│       ├── services/                      # geofenceEvaluator, notification/notify, mailer, delay, eta, gemini, aiCache, aiMetrics, deviceStatus, offlineWatchdog
│       ├── sockets/location.socket.js         # browser/agent Socket.IO location handling
│       ├── scripts/promoteToAdmin.js
│       └── utils/                              # aiSearch, delayNote grounding helpers, password, token
├── gt06-bridge/                 # Standalone GT06/TK103 TCP bridge (deployed separately — see note below)
│   ├── bridge.js                 # TCP server + Socket.IO client that forwards parsed pings to the main server
│   ├── gt06Parser.js              # Binary protocol parser
│   └── testTracker.js              # Simulates a real tracker for local testing without hardware
└── tracker-agent/                # Standalone headless location-reporting agent (software, not hardware)
    ├── agent.js
    └── locationProviders/            # simulate & (reserved) real GPS providers
```

> **Why `gt06-bridge` is a separate package:** the main `server` is deployed on a platform (Render) that doesn't support raw TCP listeners, so the GT06 hardware protocol is handled by `gt06-bridge` running on its own host (e.g. a small AWS/DigitalOcean instance) with an open TCP port. The bridge resolves a tracker's IMEI to a registered device via a shared-secret-protected endpoint on the main server (`bridgeAuth.middleware.js`, checked with a timing-safe comparison) and then streams location updates to it over Socket.IO — from the main server's point of view, it's just another authenticated device.

## How It Works

1. **Auth** — Users register/log in against `server/src/controllers/auth.controller.js`; the server issues a short-lived access token and a refresh token. `authenticate` middleware validates the access token *and* re-checks the user isn't suspended on every request, so a suspended account's existing token stops working immediately rather than at next login. The mobile app uses the same API, storing tokens in Expo Secure Store.
2. **Devices** — An admin creates a bus in Device Center, which generates a unique `deviceKey`. That key is how a device (agent or hardware tracker) authenticates without a user login of its own.
3. **Location reporting** — Depending on the source:
   - A browser or the `tracker-agent` connects via Socket.IO with `auth: { deviceKey }` and emits `send-location`; the server persists a `LocationPing`, updates the device's `lastLocation`/`status`, evaluates geofences, and broadcasts `receive-location` to every connected client (web and mobile).
   - A real GT06/GT06N/TK103 GPS unit connects over raw TCP to `gt06-bridge`, which parses the binary protocol, resolves the tracker's IMEI to a registered device via the main server's bridge API, and forwards location updates through the same Socket.IO path — geofence evaluation and broadcast happen identically regardless of source.
4. **Geofences** — Every incoming location ping is checked against registered geofence boundaries; entering/exiting one can fire a notification, delivered live to the relevant user's private Socket.IO room (`user:<id>`) as well as stored for the notifications inbox.
5. **AI search & delay notes** — `POST /api/ai/search` grounds every answer in a fresh query of the app's own routes/stops/buses (never trusting the model for facts, only for matching); results are cached briefly by query text, with a simple keyword-match fallback if Gemini isn't configured or fails. `GET /api/ai/delay-note/:deviceId` only fires once a bus is meaningfully late, and only accepts an AI-written explanation if it is short, cites no unmeasured cause, and uses no number absent from the underlying metrics — otherwise a deterministic, metrics-only sentence is used instead.
6. **History & analytics** — Every ping is stored, so the Device History page (web) / History screen (mobile) can replay a route over time, and admin-only analytics endpoints aggregate distance and stop-activity data for dashboard charts.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Resend](https://resend.com/) API key (for verification/reset emails) — optional for local dev if you don't need those flows working
- A Gemini API key — optional; AI search/delay notes gracefully fall back to text-matching/templates if unset

### 1. Server

```bash
cd server
npm install
cp .env.example .env   # fill in MONGO_URI, JWT secrets, CLIENT_URL, RESEND_API_KEY, GEMINI key, BRIDGE_SECRET
npm run dev
```

Runs the HTTP/Socket.IO API on `PORT` (default `5000`).

### 2. Web Client

```bash
cd client
npm install
cp .env.example .env   # VITE_API_URL, VITE_SOCKET_URL pointing at your server
npm run dev
```

### 3. Mobile App

```bash
cd mobile
npm install
cp .env.example .env   # point at your server/socket URLs
npm start              # then press a/i/w, or scan the QR code with Expo Go
```

### 4. (Optional) Tracker Agent — simulate a bus without hardware

```bash
cd tracker-agent
npm install
cp .env.example .env
# In the app: Device Center → register a bus → copy its Device Key → paste as DEVICE_KEY in .env
npm start
```

By default it streams a gently wandering simulated location every 5 seconds — no GPS hardware required to see the live map working end-to-end.

### 5. (Optional) Real GPS hardware via gt06-bridge

```bash
cd gt06-bridge
npm install
cp .env.example .env   # SERVER_URL, BRIDGE_SECRET (must match the server's), TCP_PORT
npm start
```

Point a GT06/GT06N/TK103-compatible tracker's server address/port at this bridge's `TCP_PORT`, and register a device in the app with a matching `imei`. You can also run `npm run simulate` in this package to emulate a real tracker's TCP packets without hardware.

## Known Naming / Cleanup Items

- **"TrackSphere" vs. "My Campus Ride"** — the app is "My Campus Ride" in the root README and `package.json`, but `tracker-agent/README.md` and its in-app copy still refer to "TrackSphere" from an earlier name. Worth a find-and-replace pass.
- **`server/views.legacy/`** — the original EJS + vanilla-JS Socket.IO/Leaflet demo this project started from is still present, clearly marked `.legacy`. It isn't wired into the current Express app and can be deleted once you're confident nothing still references it.
- **Duplicate route registrations** in `server/src/routes/history.routes.js` — `/devices` and `/:socketId` are each registered twice; harmless (Express just uses the first match) but worth cleaning up.
- `client/README.md` still has the default Vite/React template text.
- No top-level `LICENSE` file yet.

## Roadmap

- [ ] Implement the reserved `LOCATION_SOURCE=gps` provider in `tracker-agent` (real serial/NMEA GPS module support — currently throws a clear "not yet implemented" error)
- [ ] Verify the GT06 longitude hemisphere bit against a real tracker in the field (currently unconfirmed on hardware)
- [ ] Add automated tests/CI across all four JS packages (client, server, mobile, gt06-bridge, tracker-agent)
- [ ] Admin-only "AI Insights" view beyond per-bus delay notes (aggregate patterns across the system)
- [ ] Formal SRS, ER/architecture diagrams, test plan, and deployment guide for the FYP writeup

## Project Context

This is an active Final Year Project (BS Information Technology, IT Centre, Sindh Agriculture University Tandojam — FYP 2026–27, supervised by Prof. Dr. Pinial Khan), built by a 4-person group. The proposal names it "My Campus Ride" (titled "RoutePulse" in some earlier body text) and commits to a full React Native rebuild (delivered, as seen in `mobile/`) plus real GT06N/TK103 hardware integration (the physical tracker has been acquired and `gt06-bridge` is built to support it).

## Author

**Hasnain Jaffer**
- GitHub: [@Hasnain-jaffer](https://github.com/Hasnain-jaffer)
