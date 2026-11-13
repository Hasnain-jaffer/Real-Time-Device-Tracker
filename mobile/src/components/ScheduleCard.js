// mobile/src/components/ScheduleCard.js
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import apiClient from '../lib/apiClient';
import { useTheme } from '../context/ThemeContext';

function formatClock(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function ScheduleCard({ busId, title = 'Schedule' }) {
  const { colors } = useTheme();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!busId) return undefined;
    let alive = true;
    setLoading(true);
    setError('');
    apiClient
      .get(`/schedule/device/${busId}`)
      .then(({ data }) => alive && setEntries((data.schedule || []).filter((e) => e.geofenceId?.name)))
      .catch(() => alive && setError('Could not load the schedule.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [busId]);

  return (
    <View
      style={{
        backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1,
        borderRadius: 14, padding: 16, marginBottom: 14,
      }}
    >
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>{title}</Text>
      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: 12 }}>
        Expected arrival time at each stop.
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.accent} />
      ) : error ? (
        <Text style={{ fontSize: 13, color: colors.textMuted }}>{error}</Text>
      ) : entries.length === 0 ? (
        <Text style={{ fontSize: 13, color: colors.textMuted }}>No schedule has been published for this bus yet.</Text>
      ) : (
        entries.map((entry, i) => (
          <View
            key={entry._id}
            style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingVertical: 9,
              borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.textPrimary, flex: 1, marginRight: 10 }}>
              {i + 1}. {entry.geofenceId.name}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.accent }}>{formatClock(entry.expectedTime)}</Text>
          </View>
        ))
      )}
    </View>
  );
}