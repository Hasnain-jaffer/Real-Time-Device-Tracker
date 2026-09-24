# My Campus Ride

A full-stack, real-time campus bus tracking platform. Riders see live bus locations on a map, get geofence-based arrival/departure alerts, and can review route history; admins manage buses, routes, users, schedules, and system-wide analytics. The stack supports three ways for a "device" to report its location: a rider's own browser, a headless Node.js agent (for a Raspberry Pi or old phone strapped to a bus), or a real GT06/TK103 GPS hardware tracker talking raw TCP.

> This repo started as a small Socket.IO + Leaflet demo and has since been rebuilt into a layered, production-oriented monorepo (`client/`, `server/`, `tracker-agent/`). This README reflects the current architecture.

## Features

- 🗺️ **Live map tracking** — Leaflet + `react-leaflet` with marker clustering, showing every online bus in real time over Socket.IO
- 🔐 **Full JWT auth** — access/refresh token pair, email verification and password reset via Resend, per-request suspension checks, role-based access (`user` / `admin`)
- 🚌 **Device (bus) management** — admins register buses, each gets a unique `deviceKey`; keys can be regenerated if compromised
- 📡 **Three ways to report location:**
  - Browser geolocation (for quick testing/demo devices)
  - `tracker-agent` — a standalone Node.js background agent authenticating with a device key, with a simulated-location mode for demos and a GPS-hardware mode reserved for future serial/NMEA support
  - **Real GPS hardware** — a raw TCP server (`gt06Server.js`) implementing the GT06/TK103 protocol, so an actual off-the-shelf vehicle tracker can report directly, no app or browser involved
- 🚧 **Geofences** — draw stop/zone boundaries; entry/exit is evaluated live against every location ping and can trigger notifications
- 🕓 **Schedules & delay tracking** — per-device schedule entries with a delay-status endpoint
- 📜 **Trip history & playback** — persisted location pings (`LocationPing`) per device, replayable on the map via playback controls
- 🔔 **Real-time notifications** — per-user Socket.IO rooms deliver live alerts (e.g. a bus going offline near a stop) in addition to a notifications inbox
- 📊 **Admin analytics** — system overview, daily distance charts, and stop-activity stats (admin-only)
- 🛡️ **Admin console** — suspend/activate/delete users, manage all devices, force-toggle tracking on a device
- 🔍 **Global search** across devices/routes
- 🎨 **Modern React frontend** — Vite + Tailwind, light/dark theme, toast notifications, route-based code-splitting (`React.lazy`), protected and admin-only routes

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router 7, Tailwind CSS, Zustand, TanStack Query, Recharts, Leaflet / react-leaflet |
| Backend | Node.js, Express 5, Socket.IO 4, raw TCP (`net`) for GT06 hardware |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh), bcrypt password hashing, Resend for transactional email |
| Hardening | Helmet, express-rate-limit, CORS with credentials, Zod validation, Morgan logging |
| Tracker Agent | Standalone Node.js process, Socket.IO client |

## Monorepo Structure

```
Real-Time-Device-Tracker/
├── client/                     # React (Vite) frontend
│   └── src/
│       ├── app/                # Providers: Auth, Socket, Theme, Toast, route guards
│       ├── components/         # layout, map (LiveMap + clustering), UI primitives
│       ├── features/           # admin, analytics, devices, geofences, history, search, tracking
│       ├── pages/               # Dashboard, DeviceCenter, LiveTracking, History, Analytics, Admin, auth pages, static pages
│       └── lib/                 # apiClient (axios), socketClient, tokenStore
├── server/                     # Express + Socket.IO + TCP API
│   └── src/
│       ├── config/db.js
│       ├── controllers/         # auth, device, geofence, history, analytics, admin, notification, profile, schedule, search
│       ├── middleware/auth.middleware.js   # authenticate + role-based authorize()
│       ├── models/               # Device, User, Geofence, LocationPing, Notification, Schedule
│       ├── routes/
│       ├── services/             # geofenceEvaluator, notification, mailer, delay
│       ├── sockets/location.socket.js      # browser/agent Socket.IO location handling
│       └── tcp/                  # gt06Parser.js + gt06Server.js — real GPS hardware protocol support
└── tracker-agent/               # Standalone headless location-reporting agent
    ├── agent.js
    └── locationProviders/        # simulate & (reserved) real GPS providers
```

## How It Works

1. **Auth** — Users register/log in against `server/src/controllers/auth.controller.js`; the server issues a short-lived access token and a refresh token. `authenticate` middleware validates the access token *and* re-checks the user isn't suspended on every request, so a suspended account's existing token stops working immediately rather than at next login.
2. **Devices** — An admin creates a bus in Device Center, which generates a unique `deviceKey`. That key is how a device (agent or hardware tracker) authenticates without a user login of its own.
3. **Location reporting** — Depending on the source:
   - A browser or the `tracker-agent` connects via Socket.IO with `auth: { deviceKey }` and emits `send-location`; the server persists a `LocationPing`, updates the device's `lastLocation`/`status`, evaluates geofences, and broadcasts `receive-location` to every connected client.
   - A real GT06/TK103 GPS unit connects over raw TCP to `gt06Server.js`, which parses the binary protocol, matches the tracker's IMEI to a registered device, and feeds location updates through the same geofence-evaluation and broadcast path.
4. **Geofences** — Every incoming location ping is checked against registered geofence boundaries; entering/exiting one can fire a notification, delivered live to the relevant user's private Socket.IO room (`user:<id>`) as well as stored for the notifications inbox.
5. **History & analytics** — Every ping is stored, so `DeviceHistoryPage` can replay a route over time, and admin-only `analytics.routes.js` endpoints aggregate distance and stop-activity data for the dashboard charts.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Resend](https://resend.com/) API key (for verification/reset emails) — optional for local dev if you don't need those flows working

### 1. Server

```bash
cd server
npm install
cp .env.example .env   # fill in MONGO_URI, JWT secrets, CLIENT_URL, RESEND_API_KEY
npm run dev
```

Runs the HTTP/Socket.IO API on `PORT` (default `5000`) and the GT06 TCP listener on `GT06_TCP_PORT` (default `5023`).

### 2. Client

```bash
cd client
npm install
cp .env.example .env   # VITE_API_URL, VITE_SOCKET_URL pointing at your server
npm run dev
```

### 3. (Optional) Tracker Agent — simulate a bus without hardware

```bash
cd tracker-agent
npm install
cp .env.example .env
# In the app: Device Center → register a bus → copy its Device Key → paste as DEVICE_KEY in .env
npm start
```

By default it streams a gently wandering simulated location every 5 seconds — no GPS hardware required to see the live map working end-to-end.

### 4. (Optional) Real GPS hardware

Point a GT06/TK103-compatible tracker's server address/port at your deployed `GT06_TCP_PORT`, and register a device with a matching `imei`. No agent or app needed on that path — the hardware talks directly to `gt06Server.js`.

## Roadmap

- [ ] Implement the reserved `LOCATION_SOURCE=gps` provider in `tracker-agent` (real serial/NMEA GPS module support — currently throws a clear "not yet implemented" error)
- [ ] Resolve the internal naming inconsistency — the app is "My Campus Ride" in `package.json`/root README, but the tracker agent and its README still say "TrackSphere"
- [ ] Deduplicate the repeated route registrations in `history.routes.js` (`/devices` and `/:socketId` are each registered twice)
- [ ] Replace the placeholder Vite/React template text still in `client/README.md`
- [ ] Add a top-level LICENSE file (none currently present)
- [ ] CI for lint/test across the three packages

## Author

**Hasnain Jaffer**
- GitHub: [@Hasnain-jaffer](https://github.com/Hasnain-jaffer)
