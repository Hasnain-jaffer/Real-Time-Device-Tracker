// mobile/src/screens/RouteDetailScreen.js
import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import apiClient from '../lib/apiClient';
import LeafletMap from '../components/LeafletMap';
import { useTheme } from '../context/ThemeContext';
import { useLiveBuses } from '../context/LiveBusesContext';
import { useUserLocation } from '../context/LocationContext';
import { formatDistance } from '../utils/geo';
import { IconBus } from '../components/Icons';

export default function RouteDetailScreen({ route }) {
  const { routeId } = route.params;
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { buses, liveBuses } = useLiveBuses();
  const { position } = useUserLocation();

  const [detail, setDetail] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [eta, setEta] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [refreshing, setRefreshing] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/routes/${routeId}`);
      setDetail(data);
      setLoadError('');
    } catch (err) {
      setLoadError(err.response?.status === 404 ? 'This route no longer exists.' : 'Could not load this route. Pull down to retry.');
    }
  }, [routeId]);

  const fetchEta = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/routes/${routeId}/eta`);
      setEta(data);
    } catch {
      // ETA is optional; keep showing the last value
    }
  }, [routeId]);

  // Load when the screen is focused, refresh ETAs every 20s, and tick the
  // clock so "in N min" keeps counting down between refreshes.
  useFocusEffect(
    useCallback(() => {
      loadDetail();
      fetchEta();
      const poll = setInterval(fetchEta, 20000);
      const tick = setInterval(() => setNow(Date.now()), 30000);
      return () => {
        clearInterval(poll);
        clearInterval(tick);
      };
    }, [loadDetail, fetchEta])
  );

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([loadDetail(), fetchEta()]);
    setRefreshing(false);
  }

  const stops = detail?.stops || [];
  const mapStops = useMemo(
    () => stops.map((s) => ({ id: s._id, lat: s.latitude, lng: s.longitude, name: s.name })),
    [detail]
  );
  const routeBuses = buses.filter((b) => b.routeId === routeId);
  const liveHere = liveBuses.filter((b) => b.routeId === routeId);

  function soonestEta(stopId) {
    let best = null;
    (eta?.buses || []).forEach((b) => {
      const e = b.etas.find((x) => x.stopId === stopId);
      if (!e) return;
      const t = new Date(e.etaAt).getTime();
      if (!best || t < best.t) best = { t, busName: b.name, method: e.method };
    });
    return best;
  }

  const card = { backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1, borderRadius: 14 };

  if (!detail && !loadError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPage, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPage, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: colors.critical, fontSize: 14, textAlign: 'center' }}>{loadError}</Text>
        <TouchableOpacity onPress={onRefresh} style={{ marginTop: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPage }}
      contentContainerStyle={{ padding: 16 }}
      nestedScrollEnabled
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>{detail.route.name}</Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
        {stops.length} stop{stops.length !== 1 ? 's' : ''} · {(detail.totalDistanceMeters / 1000).toFixed(1)} km ·{' '}
        {liveHere.length} bus{liveHere.length !== 1 ? 'es' : ''} live
      </Text>

      {stops.length > 0 && (
        <View style={[card, { height: 240, overflow: 'hidden', marginTop: 14 }]}>
          <LeafletMap
            buses={liveHere}
            user={position}
            isDark={isDark}
            stops={mapStops}
            onSelect={(id) => navigation.navigate('Live Map', { busId: id })}
          />
        </View>
      )}

      {routeBuses.length > 0 && (
        <View style={{ marginTop: 14 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Buses on this route</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {routeBuses.map((b) => (
              <TouchableOpacity
                key={b.id}
                disabled={!b.isLive || b.latitude == null}
                onPress={() => navigation.navigate('Live Map', { busId: b.id })}
                style={{
                  marginRight: 8, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1,
                  borderColor: colors.border, backgroundColor: b.isLive ? colors.badgeSuccessBg : colors.bgSurface,
                  flexDirection: 'row', alignItems: 'center',
                }}
              >
                <IconBus size={12} color={b.isLive ? colors.badgeSuccessText : colors.textMuted} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12.5, fontWeight: '600', color: b.isLive ? colors.badgeSuccessText : colors.textMuted }}>
                  {b.name} · {b.isLive ? 'Live' : 'Offline'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={[card, { padding: 16, marginTop: 8 }]}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>Route timeline</Text>
        <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2, marginBottom: 14 }}>
          Arrival times appear once a bus on this route has passed a stop. "Past trips" means learned from this route's history; "rough" means estimated from the bus's current speed.
        </Text>

        {stops.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 }}>
            No stops have been added to this route yet.
          </Text>
        ) : (
          stops.map((stop, i) => {
            const isLast = i === stops.length - 1;
            const endpoint = i === 0 || isLast;
            const next = soonestEta(stop._id);
            const minutes = next ? Math.max(0, Math.round((next.t - now) / 60000)) : null;
            return (
              <View key={stop._id} style={{ flexDirection: 'row' }}>
                <View style={{ width: 30, alignItems: 'center' }}>
                  <View
                    style={{
                      width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: endpoint ? colors.accent : colors.eta,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
                  </View>
                  {!isLast && <View style={{ width: 2, flex: 1, backgroundColor: colors.border, marginTop: 2 }} />}
                </View>

                <View style={{ flex: 1, paddingLeft: 8, paddingBottom: isLast ? 0 : 18 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>
                    {stop.name}
                    {i === 0 && <Text style={{ fontSize: 10, fontWeight: '700', color: colors.accent }}>{'  START'}</Text>}
                    {isLast && stops.length > 1 && <Text style={{ fontSize: 10, fontWeight: '700', color: colors.eta }}>{'  DESTINATION'}</Text>}
                  </Text>
                  {i > 0 && (
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      {formatDistance(stop.distanceFromPrevMeters)} from previous stop
                    </Text>
                  )}
                  {next && (
                    <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.accent, marginTop: 4 }}>
                      {next.busName} · {new Date(next.t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {minutes === 0 ? ' (arriving)' : ` (in ${minutes} min)`}
                      <Text style={{ fontWeight: '400', color: colors.textMuted }}>
                        {next.method === 'historical' ? '  · past trips' : '  · rough'}
                      </Text>
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}