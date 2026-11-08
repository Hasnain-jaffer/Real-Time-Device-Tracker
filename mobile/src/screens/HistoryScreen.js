import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, PanResponder, RefreshControl } from 'react-native';
import apiClient from '../lib/apiClient';
import HistoryMap from '../components/HistoryMap';
import { useTheme } from '../context/ThemeContext';
import { useLiveBuses } from '../context/LiveBusesContext';
import { useRoutePlayback, SPEED_OPTIONS } from '../utils/useRoutePlayback';
import { IconPlay, IconPause, IconSkipBack, IconMap } from '../components/Icons';

function Scrubber({ count, index, onSeek, colors }) {
  const latest = useRef({ count, onSeek });
  latest.current = { count, onSeek };
  const width = useRef(1);

  function handle(x) {
    const { count: c, onSeek: seek } = latest.current;
    if (c < 2) return;
    const ratio = Math.min(1, Math.max(0, x / width.current));
    seek(ratio * (c - 1));
  }

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => handle(e.nativeEvent.locationX),
      onPanResponderMove: (e) => handle(e.nativeEvent.locationX),
    })
  ).current;

  const ratio = count > 1 ? index / (count - 1) : 0;

  return (
    <View
      style={{ flex: 1, height: 32, justifyContent: 'center' }}
      onLayout={(e) => {
        width.current = e.nativeEvent.layout.width || 1;
      }}
      {...pan.panHandlers}
    >
      <View pointerEvents="none" style={{ height: 6, borderRadius: 3, backgroundColor: colors.border }}>
        <View style={{ height: 6, borderRadius: 3, width: `${ratio * 100}%`, backgroundColor: colors.accent }} />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', left: `${ratio * 100}%`, marginLeft: -9, width: 18, height: 18, borderRadius: 9,
          backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: colors.accent,
        }}
      />
    </View>
  );
}

function formatMinutes(total) {
  if (total < 60) return `${total} min`;
  return `${Math.floor(total / 60)} h ${total % 60} min`;
}

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const { buses } = useLiveBuses();

  const [selectedId, setSelectedId] = useState(null);
  const [pings, setPings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const pb = useRoutePlayback(pings);

  const loadHistory = useCallback(async (id) => {
    if (!id) return;
    const mine = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.get(`/history/device/${id}`, { params: { limit: 500 } });
      if (mine !== requestId.current) return; // a newer request replaced this one
      setPings(data.pings || []);
    } catch (err) {
      if (mine !== requestId.current) return;
      setPings([]);
      setError(
        err.response?.status === 403 || err.response?.status === 404
          ? "This bus's history is not available to you."
          : 'Could not load the history. Pull down to retry.'
      );
    } finally {
      if (mine === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId && buses.length > 0) setSelectedId((buses.find((b) => b.isLive) || buses[0]).id);
  }, [buses, selectedId]);

  useEffect(() => {
    setShowAll(false);
    loadHistory(selectedId);
  }, [selectedId, loadHistory]);

  async function onRefresh() {
    setRefreshing(true);
    await loadHistory(selectedId);
    setRefreshing(false);
  }

  const durationMin =
    pings.length > 1 ? Math.round((new Date(pings[pings.length - 1].createdAt) - new Date(pings[0].createdAt)) / 60000) : 0;

  const reversed = useMemo(() => pings.slice().reverse(), [pings]);
  const visibleTimeline = showAll ? reversed : reversed.slice(0, 100);

  const minutes = Math.floor(pb.elapsedSeconds / 60);
  const seconds = Math.floor(pb.elapsedSeconds % 60);

  const card = { backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 14 };
  const statCell = { flex: 1 };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPage }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>History</Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>Replay where a bus has been.</Text>

      {buses.length === 0 ? (
        <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 16 }}>No buses registered yet.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14, marginBottom: 14 }}>
          {buses.map((b) => {
            const active = b.id === selectedId;
            return (
              <TouchableOpacity
                key={b.id}
                onPress={() => setSelectedId(b.id)}
                style={{
                  marginRight: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
                  borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accent : colors.bgSurface,
                  flexDirection: 'row', alignItems: 'center',
                }}
              >
                {b.isLive && <View style={{ width: 7, height: 7, borderRadius: 4, marginRight: 6, backgroundColor: active ? '#FFFFFF' : colors.accent }} />}
                <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#FFFFFF' : colors.textPrimary }}>{b.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={[card, { flexDirection: 'row' }]}>
        <View style={statCell}>
          <Text style={{ fontSize: 10.5, color: colors.textMuted }}>Points recorded</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 2 }}>{pings.length}</Text>
        </View>
        <View style={statCell}>
          <Text style={{ fontSize: 10.5, color: colors.textMuted }}>Distance travelled</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 2 }}>{pb.totalKm.toFixed(2)} km</Text>
        </View>
        <View style={statCell}>
          <Text style={{ fontSize: 10.5, color: colors.textMuted }}>Duration</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 2 }}>{formatMinutes(durationMin)}</Text>
        </View>
      </View>

      {!!error && <Text style={{ color: colors.critical, fontSize: 13, marginBottom: 12 }}>{error}</Text>}

      {pb.canPlay && (
        <View style={card}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={pb.restart}
              accessibilityLabel="Restart playback"
              style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: colors.bgPage, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}
            >
              <IconSkipBack size={18} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pb.isPlaying ? pb.pause : pb.play}
              accessibilityLabel={pb.isPlaying ? 'Pause playback' : 'Play route'}
              style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}
            >
              {pb.isPlaying ? <IconPause size={22} color="#FFFFFF" /> : <IconPlay size={22} color="#FFFFFF" />}
            </TouchableOpacity>
            <Scrubber count={pings.length} index={pb.index} onSeek={pb.seek} colors={colors} />
          </View>

          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            {SPEED_OPTIONS.map((s) => {
              const active = pb.speed === s;
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => pb.setSpeed(s)}
                  style={{ marginRight: 6, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: active ? colors.accent : 'transparent' }}
                >
                  <Text style={{ fontSize: 12.5, fontWeight: '600', color: active ? '#FFFFFF' : colors.textMuted }}>{s}x</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 10 }}>
            Point {pb.index + 1} of {pings.length} · Elapsed {minutes}m {seconds}s · {pb.distanceSoFarKm.toFixed(2)} km travelled
          </Text>
        </View>
      )}

      <View style={[card, { padding: 0, height: 300, overflow: 'hidden' }]}>
        {pings.length > 0 ? (
          <>
           
            <HistoryMap path={pings} playIndex={pb.index} isDark={isDark} topOffset={32}/>
            <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(23,59,50,0.88)', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '600' }}>Route playback — Point {pb.index + 1}</Text>
            </View>
          </>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.accent} />
            ) : (
              <>
                <IconMap size={32} color={colors.textMuted} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 6 }}>No location history for this bus yet</Text>
              </>
            )}
          </View>
        )}
      </View>

      <View style={card}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Timeline</Text>
        {pings.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 8 }}>No points yet.</Text>
        ) : (
          <>
            {visibleTimeline.map((p, r) => (
              <TouchableOpacity
                key={p._id || r}
                onPress={() => pb.seek(pings.length - 1 - r)}
                style={{ paddingVertical: 8, borderTopWidth: r === 0 ? 0 : 1, borderTopColor: colors.border }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>{new Date(p.createdAt).toLocaleTimeString()}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{Number(p.latitude).toFixed(5)}, {Number(p.longitude).toFixed(5)}</Text>
              </TouchableOpacity>
            ))}
            {!showAll && reversed.length > 100 && (
              <TouchableOpacity onPress={() => setShowAll(true)} style={{ paddingTop: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.accent }}>Show all {reversed.length} points</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}