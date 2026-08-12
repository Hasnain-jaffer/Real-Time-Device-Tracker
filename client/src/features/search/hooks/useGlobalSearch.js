// client/src/features/search/hooks/useGlobalSearch.js
import { useEffect, useState } from 'react';
import apiClient from '../../../lib/apiClient';

export function useGlobalSearch(query, delayMs = 300) {
  const [results, setResults] = useState({ devices: [], geofences: [], notifications: [] });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ devices: [], geofences: [], notifications: [] });
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      apiClient
        .get('/search', { params: { q: query } })
        .then(({ data }) => setResults(data))
        .catch(() => {})
        .finally(() => setIsSearching(false));
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [query, delayMs]);

  return { results, isSearching };
}