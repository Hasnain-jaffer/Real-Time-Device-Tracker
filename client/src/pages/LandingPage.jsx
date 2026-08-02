// client/src/pages/LandingPage.jsx
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-soft">
        <span className="font-semibold text-lg text-primary">Device Tracker</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/about" className="hover:text-primary transition">About</Link>
          <Link to="/help" className="hover:text-primary transition">Help</Link>
          <Link to="/login" className="hover:text-primary transition">Log in</Link>
          <Link
            to="/register"
            className="rounded-xl bg-primary text-white px-4 py-2 font-medium shadow-soft hover:bg-primary-600 transition"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          Real-time device tracking,{' '}
          <span className="text-primary">without the complexity.</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Live location updates, full history and path playback, and secure
          account management — built for teams and individuals who need to
          know where things are, right now.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/register"
            className="rounded-xl bg-primary text-white px-6 py-3 font-medium shadow-soft hover:bg-primary-600 transition"
          >
            Create Free Account
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-gray-300 dark:border-gray-700 px-6 py-3 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Sign In
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
          <div className="glass rounded-2xl shadow-soft p-6">
            <p className="text-2xl mb-2">📍</p>
            <h3 className="font-semibold mb-1">Live Tracking</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time markers on an interactive map, updated instantly.
            </p>
          </div>
          <div className="glass rounded-2xl shadow-soft p-6">
            <p className="text-2xl mb-2">🕒</p>
            <h3 className="font-semibold mb-1">Full History</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review past routes, distances, and durations any time.
            </p>
          </div>
          <div className="glass rounded-2xl shadow-soft p-6">
            <p className="text-2xl mb-2">🔒</p>
            <h3 className="font-semibold mb-1">Secure by Default</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              JWT auth, hashed passwords, and full account control.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}