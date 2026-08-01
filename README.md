# Real-Time Device Tracker

A real-time location tracking web app built with **Node.js**, **Express**, **Socket.IO**, and **Leaflet**. Every connected device shares its live GPS position, and all clients see every device's marker update on a shared map in real time — no page refresh required.

## Features

- 📍 **Live location broadcasting** — uses the browser's Geolocation API (`watchPosition`) to continuously capture each device's coordinates
- ⚡ **Real-time updates via WebSockets** — Socket.IO pushes location changes to every connected client instantly
- 🗺️ **Interactive map** — powered by Leaflet with OpenStreetMap tiles
- 👥 **Multi-device support** — each connected socket gets its own marker, added, moved, or removed as devices connect/disconnect
- 🔌 **Automatic cleanup** — markers are removed from the map the moment a device disconnects

## Tech Stack

| Layer      | Technology                     |
|------------|---------------------------------|
| Server     | Node.js, Express 5              |
| Real-time  | Socket.IO 4                     |
| Templating | EJS                              |
| Frontend   | Vanilla JS, Leaflet.js           |
| Dev Tools  | Nodemon                          |

## Project Structure

```
Real-Time-Device-Tracker/
├── public/
│   ├── css/
│   │   └── style.css       # Fullscreen map styling
│   └── js/
│       └── script.js       # Geolocation capture + Leaflet map logic
├── views/
│   └── index.ejs           # Main page (map container)
├── app.js                  # Express server + Socket.IO event handling
├── package.json
└── .gitignore
```

## How It Works

1. When a client loads the page, the browser asks for location permission and starts watching the device's position.
2. Each position update is emitted to the server over a `send-location` socket event.
3. The server broadcasts that location (tagged with the socket's unique ID) to **all** connected clients via `receive-location`.
4. Each client's map places or updates a marker for that device ID.
5. When a device disconnects, the server emits `user-disconnected`, and every client removes that marker from the map.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- npm

### Installation

```bash
git clone https://github.com/Hasnain-jaffer/Real-Time-Device-Tracker.git
cd Real-Time-Device-Tracker
npm install
```

### Running the App

```bash
npm run dev
```

The server starts on **http://localhost:3000**. Open it in multiple browser tabs/devices (with location access allowed) to see each one appear on the map in real time.

> **Note:** Most browsers only allow the Geolocation API over HTTPS or `localhost`. To test across real devices on a network, you'll need HTTPS or a tunneling tool like [ngrok](https://ngrok.com/).

## Roadmap

This project is being actively developed toward a production-grade tracking system. Planned enhancements include:

- [ ] JWT-based authentication with hardware/device-level identity
- [ ] Persistent location history in MongoDB
- [ ] Redis-backed Socket.IO adapter for horizontal scaling across multiple server instances
- [ ] Security hardening (rate limiting, input validation, CORS policy)
- [ ] React-based frontend
- [ ] AI-assisted insights (e.g., anomaly detection, route prediction)

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request.

## License

This project is licensed under the ISC License.

## Author

**Hasnain Jaffer**
- GitHub: [@Hasnain-jaffer](https://github.com/Hasnain-jaffer)
