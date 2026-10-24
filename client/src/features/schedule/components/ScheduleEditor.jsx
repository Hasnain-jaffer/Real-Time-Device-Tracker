// client/src/features/schedule/components/ScheduleEditor.jsx
import { useEffect, useState } from 'react';
import * as scheduleApi from '../api/scheduleApi';
import { useToast } from '../../../app/ToastContext';

export default function ScheduleEditor({ stops, buses, tokens = {} }) {
  const { showToast } = useToast();
  const [busId, setBusId] = useState('');
  const [entries, setEntries] = useState({}); // stopId -> existing schedule entry
  const [times, setTimes] = useState({}); // stopId -> 'HH:mm' (or '' when cleared)
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const surface = tokens['--bg-surface'] || '#FFFFFF';
  const page = tokens['--bg-page'] || '#F4EFE6';
  const border = tokens['--border'] || '#E1D9C8';
  const textPrimary = tokens['--text-primary'] || '#173B32';
  const textSecondary = tokens['--text-secondary'] || '#5B6B5F';
  const textMuted = tokens['--text-muted'] || '#9C8F73';
  const accent = tokens['--accent-primary'] || '#5E8C61';

  useEffect(() => {
    if (buses.length > 0 && !buses.some((b) => b._id === busId)) setBusId(buses[0]._id);
  }, [buses]);

  async function load(id) {
    setIsLoading(true);
    try {
      const list = await scheduleApi.listDeviceSchedule(id);
      const byStop = {};
      const draft = {};
      list.forEach((entry) => {
        const stopId = entry.geofenceId?._id;
        if (!stopId) return; // stop was deleted since this entry was created
        byStop[stopId] = entry;
        draft[stopId] = entry.expectedTime;
      });
      setEntries(byStop);
      setTimes(draft);
    } catch {
      showToast('Could not load schedule', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (busId) load(busId);
  }, [busId]);

  async function handleSave() {
    setIsSaving(true);
    try {
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        const time = times[stop._id] || '';
        const existing = entries[stop._id];

        if (existing && !time) {
          await scheduleApi.deleteScheduleEntry(existing._id);
        } else if (existing && existing.expectedTime !== time) {
          await scheduleApi.updateScheduleEntry(existing._id, { expectedTime: time, sequence: i });
        } else if (!existing && time) {
          await scheduleApi.createScheduleEntry({
            deviceId: busId,
            geofenceId: stop._id,
            sequence: i,
            expectedTime: time,
          });
        }
      }
      showToast('Schedule saved', 'success');
      await load(busId);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save schedule', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: surface, border: `1px solid ${border}` }}>
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
        Set the expected arrival time (24-hour) at each stop. Delays are measured against these times.
      </p>

      {buses.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: textMuted }}>
          No bus is assigned to this route yet. Assign one in Route Center first.
        </p>
      ) : isLoading ? (
        <div className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: page }} />
      ) : (
        <>
          <div className="space-y-2">
            {stops.map((stop, i) => (
              <div
                key={stop._id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl"
                style={{ backgroundColor: page, border: `1px solid ${border}` }}
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

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="mt-4 rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: accent }}
          >
            {isSaving ? 'Saving…' : 'Save schedule'}
          </button>
        </>
      )}
    </div>
  );
}