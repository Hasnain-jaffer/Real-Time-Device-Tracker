// client/src/features/schedule/components/ScheduleEditor.jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as scheduleApi from '../api/scheduleApi';
import { useToast } from '../../../app/ToastContext';

function describeError(err) {
  const status = err?.response?.status;
  const message = err?.response?.data?.message || err?.message || 'Unknown error';
  return status ? `${message} (${status})` : message;
}

export default function ScheduleEditor({ stops, buses, tokens = {} }) {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const wantedBus = searchParams.get('bus');
  const wantsSchedule = searchParams.get('view') === 'schedule';

  const [busId, setBusId] = useState('');
  const [entries, setEntries] = useState({}); // stopId -> the schedule entry we keep
  const [stale, setStale] = useState([]); // duplicates, and entries for stops no longer on this route
  const [times, setTimes] = useState({}); // stopId -> 'HH:mm' (or '' when cleared)
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const latestLoad = useRef(0); // ignores a slow response for a bus that is no longer selected
  const rootRef = useRef(null);

  const surface = tokens['--bg-surface'] || '#FFFFFF';
  const page = tokens['--bg-page'] || '#F4EFE6';
  const border = tokens['--border'] || '#E1D9C8';
  const textPrimary = tokens['--text-primary'] || '#173B32';
  const textSecondary = tokens['--text-secondary'] || '#5B6B5F';
  const textMuted = tokens['--text-muted'] || '#9C8F73';
  const accent = tokens['--accent-primary'] || '#5E8C61';
  const critical = tokens['--accent-critical'] || '#B94A3A';
  const amber = tokens['--accent-eta'] || '#D59A3A';

  // Prefer the bus named in the link (?bus=...), otherwise the first bus on the route
  useEffect(() => {
    if (buses.length > 0 && !buses.some((b) => b._id === busId)) {
      setBusId((buses.find((b) => b._id === wantedBus) || buses[0])._id);
    }
  }, [buses, busId, wantedBus]);

  // Arriving from a device page's Schedule button: scroll to this card
  useEffect(() => {
    if (!wantsSchedule) return undefined;
    const timer = setTimeout(() => rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    return () => clearTimeout(timer);
  }, [wantsSchedule]);

  const load = useCallback(
    async (id) => {
      const mine = ++latestLoad.current;
      setIsLoading(true);
      setLoadError('');
      try {
        const list = await scheduleApi.listDeviceSchedule(id);
        if (mine !== latestLoad.current) return;

        const onRoute = new Set(stops.map((s) => s._id));
        const byStop = {};
        const outdated = [];

        list.forEach((entry) => {
          // geofenceId is a populated object, a plain id, or null when the stop was deleted
          const stopId = entry.geofenceId?._id || entry.geofenceId || null;
          if (!stopId || !onRoute.has(stopId)) {
            outdated.push(entry);
            return;
          }
          const current = byStop[stopId];
          if (!current) {
            byStop[stopId] = entry;
            return;
          }
          // Two entries for one stop: keep the most recently saved one
          const entryIsNewer = new Date(entry.updatedAt || 0) >= new Date(current.updatedAt || 0);
          if (entryIsNewer) {
            outdated.push(current);
            byStop[stopId] = entry;
          } else {
            outdated.push(entry);
          }
        });

        const draft = {};
        Object.entries(byStop).forEach(([stopId, entry]) => {
          draft[stopId] = entry.expectedTime || '';
        });
        setEntries(byStop);
        setTimes(draft);
        setStale(outdated);
      } catch (err) {
        if (mine !== latestLoad.current) return;
        setEntries({});
        setTimes({});
        setStale([]);
        setLoadError(describeError(err));
      } finally {
        if (mine === latestLoad.current) setIsLoading(false);
      }
    },
    [stops]
  );

  useEffect(() => {
    if (busId) load(busId);
  }, [busId, load]);

  // The first stop whose time is earlier than the stop before it ('HH:mm' strings sort correctly)
  let outOfOrderStop = '';
  {
    let previous = '';
    for (const stop of stops) {
      const time = times[stop._id];
      if (!time) continue;
      if (previous && time < previous) {
        outOfOrderStop = stop.name;
        break;
      }
      previous = time;
    }
  }

  async function handleSave() {
    if (outOfOrderStop) {
      showToast(`"${outOfOrderStop}" is earlier than the stop before it. Fix the order first.`, 'error');
      return;
    }

    // Work out what actually changed before sending anything
    const ops = stale.map((entry) => () => scheduleApi.deleteScheduleEntry(entry._id));
    stops.forEach((stop, i) => {
      const time = times[stop._id] || '';
      const existing = entries[stop._id];
      if (existing && !time) {
        ops.push(() => scheduleApi.deleteScheduleEntry(existing._id));
      } else if (existing && existing.expectedTime !== time) {
        ops.push(() => scheduleApi.updateScheduleEntry(existing._id, { expectedTime: time, sequence: i }));
      } else if (!existing && time) {
        ops.push(() =>
          scheduleApi.createScheduleEntry({ deviceId: busId, geofenceId: stop._id, sequence: i, expectedTime: time })
        );
      }
    });

    if (ops.length === 0) {
      showToast('No changes to save', 'info');
      return;
    }

    setIsSaving(true);
    try {
      for (const op of ops) await op();
      showToast('Schedule saved', 'success');
    } catch (err) {
      showToast(`Could not save: ${describeError(err)}`, 'error');
    } finally {
      setIsSaving(false);
      load(busId); // show what the server really has, even after a partial failure
    }
  }

  return (
    <div
      ref={rootRef}
      className="scroll-mt-24 rounded-2xl p-5"
      style={{ backgroundColor: surface, border: `1px solid ${border}` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="text-sm font-semibold" style={{ color: textPrimary }}>Bus schedule</h2>
        {buses.length > 0 && (
          <select
            value={busId}
            onChange={(e) => setBusId(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs focus:outline-none"
            style={{ backgroundColor: page, border: `1px solid ${border}`, color: textPrimary }}
          >
            {buses.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>
      <p className="text-xs mb-4" style={{ color: textMuted }}>
        Set the expected arrival time (24-hour) at each stop. Times should increase along the route. Delays are
        measured against these times.
      </p>

      {buses.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: textMuted }}>
          No bus is assigned to this route yet. Assign one in Route Center first.
        </p>
      ) : isLoading ? (
        <div className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: page }} />
      ) : loadError ? (
        <div className="rounded-xl px-4 py-3" style={{ backgroundColor: page, border: `1px solid ${border}` }}>
          <p className="text-sm font-medium" style={{ color: critical }}>Could not load this bus's schedule.</p>
          <p className="text-xs mt-1" style={{ color: textMuted }}>{loadError}</p>
          <button
            onClick={() => load(busId)}
            className="mt-3 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {stale.length > 0 && (
            <div className="rounded-xl px-4 py-3 mb-3" style={{ backgroundColor: page, border: `1px solid ${amber}` }}>
              <p className="text-xs font-semibold" style={{ color: amber }}>
                {stale.length} outdated {stale.length === 1 ? 'entry' : 'entries'} found (a duplicate, or a stop that is
                no longer on this route). {stale.length === 1 ? 'It' : 'They'} will be removed when you save.
              </p>
              <ul className="mt-1 space-y-0.5">
                {stale.map((entry) => (
                  <li key={entry._id} className="text-xs" style={{ color: textSecondary }}>
                    {entry.geofenceId?.name || 'Unknown stop'} · {entry.expectedTime}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            {stops.map((stop, i) => (
              <div
                key={stop._id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl"
                style={{
                  backgroundColor: page,
                  border: `1px solid ${stop.name === outOfOrderStop ? critical : border}`,
                }}
              >
                <span className="text-sm" style={{ color: textPrimary }}>
                  <span style={{ color: textMuted }}>{i + 1}.</span> {stop.name}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={times[stop._id] || ''}
                    onChange={(e) => setTimes((prev) => ({ ...prev, [stop._id]: e.target.value }))}
                    className="rounded-lg px-2 py-1 text-sm focus:outline-none"
                    style={{ backgroundColor: surface, border: `1px solid ${border}`, color: textSecondary }}
                  />
                  {times[stop._id] && (
                    <button
                      onClick={() => setTimes((prev) => ({ ...prev, [stop._id]: '' }))}
                      className="text-xs"
                      style={{ color: textMuted }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {outOfOrderStop && (
            <p className="text-xs mt-3 font-medium" style={{ color: critical }}>
              "{outOfOrderStop}" is earlier than the stop before it. Times must increase along the route.
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="mt-4 rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {isSaving ? 'Saving…' : stale.length > 0 ? 'Save and remove outdated' : 'Save schedule'}
          </button>
        </>
      )}
    </div>
  );
}