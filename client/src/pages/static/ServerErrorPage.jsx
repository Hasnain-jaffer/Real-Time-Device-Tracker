// client/src/pages/static/ServerErrorPage.jsx
import { Link } from 'react-router-dom';

export default function ServerErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold text-danger">500</p>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        Something went wrong on our end. Please try again shortly.
      </p>
      <Link
        to="/dashboard"
        className="rounded-xl bg-primary text-white px-4 py-2 text-sm font-medium shadow-soft hover:bg-primary-600 transition"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}