import { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import apiClient from '../lib/apiClient';
import { useTheme } from '../context/ThemeContext';
import { useLiveBuses } from '../context/LiveBusesContext';
import { useNotifications } from '../context/NotificationsContext';
import { openLiveMap } from '../navigation/navigationRef';
import { timeAgo } from '../utils/geo';
import { notificationMeta } from '../utils/notificationMeta';
import { IconBus, IconSparkle, IconSignal, IconBattery, NotificationIcon } from '../components/Icons';

const SIGNAL_LABELS = ['No signal', 'Extremely weak', 'Very weak', 'Good', 'Strong'];
const BATTERY_LABELS = ['No power', 'Extremely low', 'Very low', 'Low', 'Medium', 'High', 'Very high'];

function pickStops(data) {
  if (Array.isArray(data)) return data;
  return data?.stops || data?.schedule || data?.delays || [];
}

function delayInfo(minutes) {
  if (minutes == null) return { label: 'Not yet arrived', tone: 'neutral' };
  if (minutes <= 2) return { label: 'On time', tone: 'success' };
  if (minutes <= 10) return { label: `${minutes} min late`, tone: 'warning' };
  return { label: `${minutes} min late`, tone: 'danger' };
}

function heartbeat(lastSeenMs, nowMs) {
  if (!lastSeenMs) return { label: 'No data', tone: 'neutral' };
  const age = nowMs - lastSeenMs;
  if (age < 15000) return { label: 'Healthy', tone: 'success' };
  if (age < 60000) return { label: 'Delayed', tone: 'warning' };
  return { label: 'Lost', tone: 'danger' };
}

export default function BusDetailScreen({ route }) {
  const { busId } = route.params;
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { buses } = useLiveBuses();
  const { items: notifications } = useNotifications();

  const live = buses.find((b) => b.id === busId);
  const [device, setDevice] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [pings, setPings] = useState([]);
  const [delay, setDelay] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showData, setShowData] = useState(false);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async () => {
    const [d, s, p, n] = await Promise.allSettled([
      apiClient.get(`/devices/${busId}`),
      apiClient.get(`/schedule/device/${busId}/delay`),
      apiClient.get(`/history/device/${busId}`, { params: { limit: 20 } }),
      apiClient.get(`/ai/delay-note/${busId}`),
    ]);
    if (d.status === 'fulfilled') {
      setDevice(d.value.data.device);
      setLoadError('');
    } else {
      setLoadError(d.reason?.response?.status === 404 ? 'This bus no longer exists.' : 'Could not load this bus. Pull down to retry.');
    }
    setSchedule(s.status === 'fulfilled' ? pickStops(s.value.data) : []);
    setPings(p.status === 'fulfilled' ? p.value.data.pings || [] : []);
    setDelay(n.status === 'fulfilled' ? n.value.data : null);
  }, [busId]);

  useFocusEffect(
  useCallback(() => {
    let cancelled = false;
    // Use requestIdleCallback instead of removed InteractionManager
    const idleCallback = () => {
      if (!cancelled) load();
    };
    
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(idleCallback, { timeout: 500 });
    } else {
      // Fallback for older RN
      setTimeout(idleCallback, 50);
    }

    const poll = setInterval(load, 30000);
    const tick = setInterval(() => setNow(Date.now()), 5000);
    
    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [load])
);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const toneStyle = (tone) => {
    if (tone === 'success') return { bg: colors.badgeSuccessBg, fg: colors.badgeSuccessText };
    if (tone === 'warning') return { bg: colors.eta + '26', fg: colors.eta };
    if (tone === 'danger') return { bg: colors.critical + '22', fg: colors.critical };
    return { bg: colors.bgPage, fg: colors.textMuted };
  };

  const Pill = ({ label, tone }) => {
    const t = toneStyle(tone);
    return (
      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: t.bg }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: t.fg }}>{label}</Text>
      </View>
    );
  };

  const card = { backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 14 };
  const cardTitle = { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 };

  if (!device && !loadError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPage, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPage, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: colors.critical, fontSize: 14, textAlign: 'center' }}>{loadError}</Text>
        <TouchableOpacity onPress={onRefresh} style={{ marginTop: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLive = live ? live.isLive : device.status === 'online';
  const lat = live?.latitude ?? device.lastLocation?.latitude;
  const lng = live?.longitude ?? device.lastLocation?.longitude;
  const lastSeenMs = Math.max(device.lastSeenAt ? new Date(device.lastSeenAt).getTime() : 0, live?.updatedAt || 0);
  const hb = heartbeat(lastSeenMs, now);
  const routeId = live?.routeId || device.routeId;
  const routeName = live?.routeName || '';
  const health = device.health || {};
  const busNotifications = notifications
    .filter((n) => n.deviceId === busId || (!n.deviceId && n.message?.includes(device.name)))
    .slice(0, 10);
  const orderedPings = pings.slice().reverse();

  const meta = [
    { label: 'Tracking', value: device.trackingEnabled ? 'Enabled' : 'Disabled' },
    { label: 'Last active', value: lastSeenMs ? timeAgo(lastSeenMs, now) : 'Never' },
    { label: 'Current location', value: lat != null ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : '—' },
    { label: 'Registered', value: device.createdAt ? new Date(device.createdAt).toLocaleDateString() : '—' },
  ];

  const healthRows = [
    { label: 'Connection status', value: isLive ? 'Connected' : 'Disconnected', tone: isLive ? 'success' : 'danger' },
    { label: 'Last heartbeat', value: hb.label, tone: hb.tone },
    { label: 'Tracking status', value: device.trackingEnabled ? 'Active' : 'Inactive', tone: device.trackingEnabled ? 'success' : 'neutral' },
    { label: 'Internet status', value: isLive ? 'Reachable' : 'Unreachable', tone: isLive ? 'success' : 'danger' },
  ];

  const hardware = [
    { label: 'Signal strength', text: SIGNAL_LABELS[health.gsmSignal], level: health.gsmSignal, max: 4, Icon: IconSignal },
    { label: 'Battery level', text: BATTERY_LABELS[health.batteryLevel], level: health.batteryLevel, max: 6, Icon: IconBattery },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPage }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
            <View style={{ width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: isLive ? colors.accent + '24' : colors.bgPage }}>
              <IconBus size={24} color={isLive ? colors.accent : colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }} numberOfLines={2}>{device.name}</Text>
              {!!device.identifier && <Text style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 2 }}>{device.identifier}</Text>}
            </View>
          </View>
          <Pill label={isLive ? 'Live' : 'Offline'} tone={isLive ? 'success' : 'neutral'} />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 }}>
          {meta.map((m) => (
            <View key={m.label} style={{ width: '50%', marginBottom: 12, paddingRight: 8 }}>
              <Text style={{ fontSize: 10.5, color: colors.textMuted }}>{m.label}</Text>
              <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.textPrimary, marginTop: 2 }} numberOfLines={1}>{m.value}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', marginTop: 2 }}>
          <TouchableOpacity
            disabled={!isLive || lat == null}
            onPress={() => openLiveMap(busId)}
            style={{ flex: 1, backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginRight: 8, opacity: !isLive || lat == null ? 0.45 : 1 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13.5 }}>View on live map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!routeId}
            onPress={() => navigation.navigate('RouteDetail', { routeId, routeName })}
            style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 11, alignItems: 'center', opacity: routeId ? 1 : 0.45 }}
          >
            <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13.5 }}>{routeId ? 'View route' : 'No route assigned'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!!delay?.note && (
        <View style={[card, { borderLeftWidth: 4, borderLeftColor: colors.eta }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>Delay summary</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.eta + '26' }}>
              {delay.source === 'ai' && <IconSparkle size={10} color={colors.eta} style={{ marginRight: 4 }} />}
              <Text style={{ fontSize: 10.5, fontWeight: '600', color: colors.eta }}>{delay.source === 'ai' ? 'AI-written' : 'Auto summary'}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 20 }}>{delay.note}</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 8 }}>Based only on this system's own tracking data.</Text>
          <TouchableOpacity onPress={() => setShowData((v) => !v)} style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.eta }}>{showData ? 'Hide data' : 'View data'}</Text>
          </TouchableOpacity>
          {showData && !!delay.metrics && (
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                Scheduled {delay.metrics.scheduledTime} · Arrived {delay.metrics.arrivedAt} · Delay {delay.metrics.delayMinutes} min
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>Avg moving speed today: {delay.metrics.todayAvgMovingSpeedKmh ?? 'n/a'} km/h</Text>
              {/* FIX: backend returns last7DaysAvgMovingSpeedKmh, not usualAvgMovingSpeedKmh */}
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                Avg moving speed, previous 7 days: {delay.metrics.last7DaysAvgMovingSpeedKmh ?? 'no history yet'} km/h
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={card}>
        <Text style={cardTitle}>Route schedule</Text>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: -6, marginBottom: 12 }}>Expected vs actual arrival at each stop today.</Text>
        {schedule === null ? (
          <ActivityIndicator color={colors.accent} />
        ) : schedule.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 8 }}>No schedule has been set up for this bus yet.</Text>
        ) : (
          schedule
            .slice()
            .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
            .map((stop, i) => {
              const info = delayInfo(stop.delayMinutes);
              return (
                <View
                  key={`${stop.stopName}-${i}`}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{stop.stopName}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                      Scheduled {stop.expectedTime}
                      {stop.actualArrival ? ` · Arrived ${new Date(stop.actualArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </Text>
                  </View>
                  <Pill label={info.label} tone={info.tone} />
                </View>
              );
            })
        )}
      </View>

      <View style={card}>
        <Text style={cardTitle}>Device health</Text>
        {healthRows.map((r, i) => (
          <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
            <Text style={{ fontSize: 13.5, color: colors.textPrimary }}>{r.label}</Text>
            <Pill label={r.value} tone={r.tone} />
          </View>
        ))}

        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted, marginTop: 14, marginBottom: 8 }}>Tracker hardware</Text>
        <View style={{ flexDirection: 'row' }}>
          {hardware.map((h, i) => {
            const HwIcon = h.Icon;
            const ratio = h.text ? h.level / h.max : 0;
            const barColor = ratio >= 0.5 ? colors.badgeSuccessText : ratio >= 0.25 ? colors.eta : colors.critical;
            return (
              <View key={h.label} style={{ flex: 1, backgroundColor: colors.bgPage, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 10, marginRight: i === 0 ? 8 : 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <HwIcon size={13} color={colors.textMuted} style={{ marginRight: 5 }} />
                  <Text style={{ fontSize: 11.5, color: colors.textMuted }}>{h.label}</Text>
                </View>
                <Text style={{ fontSize: 13.5, fontWeight: '700', color: h.text ? colors.textPrimary : colors.textMuted, marginTop: 2 }}>{h.text || 'No tracker data'}</Text>
                {!!h.text && (
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, marginTop: 8 }}>
                    <View style={{ height: 6, borderRadius: 3, width: `${ratio * 100}%`, backgroundColor: barColor }} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
        {!!health.updatedAt && (
          <Text style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 8 }}>
            Reported by the tracker at {new Date(health.updatedAt).toLocaleTimeString()}
          </Text>
        )}
      </View>

      <View style={card}>
        <Text style={cardTitle}>Recent activity</Text>
        {orderedPings.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 8 }}>No recent activity for this device.</Text>
        ) : (
          orderedPings.map((p, i) => (
            <View key={p._id || i} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 5, marginRight: 12, backgroundColor: i === 0 ? colors.accent : colors.border }} />
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>{new Date(p.createdAt).toLocaleTimeString()}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{Number(p.latitude).toFixed(5)}, {Number(p.longitude).toFixed(5)}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={card}>
        <Text style={cardTitle}>Recent notifications</Text>
        {busNotifications.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 8 }}>No notifications for this bus yet.</Text>
        ) : (
          busNotifications.map((n, i) => {
            const meta = notificationMeta(n.type, colors);
            return (
              <View key={n._id} style={{ flexDirection: 'row', paddingVertical: 9, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
                {/* FIX: was <Text>{meta2.icon}</Text> which printed a raw string/emoji */}
                <View style={{ marginRight: 10, marginTop: 1 }}>
                  <NotificationIcon type={n.type} size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.textPrimary }}>{n.title}</Text>
                  <Text style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 1 }}>{n.message}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>{timeAgo(new Date(n.createdAt).getTime(), now)}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}