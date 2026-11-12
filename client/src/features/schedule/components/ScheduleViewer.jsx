// client/src/features/schedule/components/ScheduleViewer.jsx
import { useEffect, useState } from 'react';
import * as scheduleApi from '../api/scheduleApi';

function formatClock(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function ScheduleViewer({ stops, buses }) {
  const [busId, setBusId] = useState('');
  const [times, setTimes] = useState({}); // stopId -> 'HH:mm'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (buses.length > 0 && !buses.some((b) => b._id === busId)) setBusId(buses[0]._id);
  }, [buses, busId]);

  useEffect(() => {
    if (!busId) return undefined;
    let alive = true;
    setIsLoading(true);
    setError('');
    scheduleApi
      .listDeviceSchedule(busId)
      .then((list) => {
        if (!alive) return;
        const byStop = {};
        list.forEach((entry) => {
          const stopId = entry.geofenceId?._id || entry.geofenceId;
          if (stopId) byStop[stopId] = entry.expectedTime;
        });
        setTimes(byStop);
      })
      .catch((err) => {
        if (!alive) return;
        setTimes({});
        setError(err?.response?.data?.message || err?.message || 'Could not load the schedule.');
      })
      .finally(() => alive && setIsLoading(false));
    return () => { alive = false; };
  }, [busId]);

  const hasAnyTime = stops.some((s) => times[s._id]);

  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Bus schedule</h2>
        {buses.length > 1 && (
          <select
            value={busId}
            onChange={(e) => setBusId(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs focus:outline-none"
            style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            {buses.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        )}
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Expected arrival time at each stop.</p>

      {buses.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No bus is assigned to this route yet.</p>
      ) : isLoading ? (
        <div className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-page)' }} />
      ) : error ? (
        <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>{error}</p>
      ) : !hasAnyTime ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No schedule has been published for this bus yet.</p>
      ) : (
        <div className="space-y-2">
          {stops.map((stop, i) => (
            <div
              key={stop._id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl"
              style={{ backgroundColor: 'var(--bg-page)', border: '1px solid var(--border)' }}
            >
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{i + 1}.</span> {stop.name}
              </span>
              <span className="text-sm font-semibold" style={{ color: times[stop._id] ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                {times[stop._id] ? formatClock(times[stop._id]) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}