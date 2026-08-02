// client/src/pages/static/StaticPageLayout.jsx
import { Link } from 'react-router-dom';

export default function StaticPageLayout({ title, children }) {
  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-soft">
        <Link to="/" className="font-semibold text-lg text-primary">
          Device Tracker
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link to="/about" className="hover:text-primary transition">About</Link>
          <Link to="/help" className="hover:text-primary transition">Help</Link>
          <Link to="/contact" className="hover:text-primary transition">Contact</Link>
        </nav>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold mb-6">{title}</h1>
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-4">
          {children}
        </div>
      </main>
    </div>
  );
}