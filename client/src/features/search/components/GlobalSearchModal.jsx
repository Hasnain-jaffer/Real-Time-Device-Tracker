// client/src/features/search/components/GlobalSearchModal.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '../hooks/useGlobalSearch';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const { results, isSearching } = useGlobalSearch(query);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function goTo(path) {
    navigate(path);
    onClose();
  }

  const hasAnyResults =
    results.devices.length > 0 || results.geofences.length > 0 || results.notifications.length > 0;

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-start justify-center pt-24 bg-gray-900/60 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-glass border border-gray-200/50 dark:border-gray-800 overflow-hidden">
        <div className="p-3 border-b border-gray-100 dark:border-gray-800">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search buses, stops, notifications…"
            className="w-full bg-transparent px-2 py-2 text-sm focus:outline-none"
          />
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {!query.trim() && (
            <p className="text-sm text-gray-400 text-center py-8">
              Start typing to search across your buses, stops, and notifications.
            </p>
          )}

          {query.trim() && isSearching && (
            <p className="text-sm text-gray-400 text-center py-8">Searching…</p>
          )}

          {query.trim() && !isSearching && !hasAnyResults && (
            <p className="text-sm text-gray-400 text-center py-8">No results for "{query}".</p>
          )}

          {results.devices.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-400 px-2 py-1">Buses</p>
              {results.devices.map((d) => (
                <button
                  key={d._id}
                  onClick={() => goTo(`/devices/${d._id}`)}
                  className="w-full text-left px-2 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  🚌 {d.name} {d.identifier && <span className="text-gray-400">· {d.identifier}</span>}
                </button>
              ))}
            </div>
          )}

          {results.geofences.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-400 px-2 py-1">Stops</p>
              {results.geofences.map((g) => (
                <button
                  key={g._id}
                  onClick={() => goTo('/stops')}
                  className="w-full text-left px-2 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  📍 {g.name}
                </button>
              ))}
            </div>
          )}

          {results.notifications.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 px-2 py-1">Notifications</p>
              {results.notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => goTo('/notifications')}
                  className="w-full text-left px-2 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  🔔 {n.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}