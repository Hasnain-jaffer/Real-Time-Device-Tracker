import { useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput, Linking, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useLiveBuses } from '../context/LiveBusesContext';
import { useUserLocation } from '../context/LocationContext';
import { useNotifications } from '../context/NotificationsContext';
import { haversineMeters, formatDistance, estimateEtaMinutes, formatEta, timeAgo } from '../utils/geo';
import { notificationMeta, NotificationIcon } from '../utils/notificationMeta';
import { goToScreen, openLiveMap } from '../navigation/navigationRef';
import { IconBus } from '../components/Icons';

function Stat({ icon, label, value, color, colors }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={{ fontSize: 10.5, color: colors.textMuted }}>{label}</Text>
        <Text style={{ fontSize: 14.5, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { isConnected } = useSocket();
  const { buses, liveBuses, error, refresh } = useLiveBuses();
  const { position, status } = useUserLocation();
  const { items: alerts } = useNotifications();

  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const withDistance = useMemo(() => {
    if (!position) return [];
    return liveBuses
      .map((b) => ({ ...b, distanceM: haversineMeters(position.latitude, position.longitude, b.latitude, b.longitude) }))
      .sort((a, b) => a.distanceM - b.distanceM);
  }, [liveBuses, position]);

  const nearby = withDistance.slice(0, 3);
  const hero = withDistance[0] || (liveBuses[0] ? { ...liveBuses[0], distanceM: null } : null);
  const heroEta = hero && hero.distanceM != null ? estimateEtaMinutes(hero.distanceM, hero.speedKmh) : null;
  const serviceAlerts = useMemo(
    () => alerts.filter((n) => n.type === 'device-offline' || n.type === 'system-message').slice(0, 3),
    [alerts]
  );
  const locationBlocked = status === 'denied' || status === 'services-off' || status === 'error';

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function ask() {
    const q = query.trim();
    if (!q) return;
    Keyboard.dismiss();
    goToScreen('Routes', { query: q, nonce: Date.now() });
    setQuery('');
  }

  const card = { backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 14 };
  const cardTitle = { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, color: colors.textMuted, marginBottom: 10 };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPage }}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>Welcome back, {user?.name?.split(' ')[0] || 'there'}</Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 3 }}>
        {liveBuses.length} bus{liveBuses.length !== 1 ? 'es' : ''} live · {isConnected ? 'all systems normal' : 'reconnecting…'}
      </Text>
      {!!error && <Text style={{ color: colors.critical, fontSize: 13, marginTop: 8 }}>{error}</Text>}

      <View style={[card, { flexDirection: 'row', marginTop: 16, paddingVertical: 14 }]}>
        <Stat icon="bus-outline" label="Buses" value={buses.length} color={colors.accent} colors={colors} />
        <Stat icon="radio-outline" label="Live now" value={`${liveBuses.length}/${buses.length}`} color={colors.eta} colors={colors} />
        <Stat
          icon="shield-checkmark-outline"
          label="Service"
          value={isConnected ? 'Operational' : 'Degraded'}
          color={isConnected ? colors.accent : colors.critical}
          colors={colors}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={ask}
          returnKeyType="search"
          maxLength={200}
          placeholder="Ask: which bus goes to the hospital?"
          placeholderTextColor={colors.textMuted}
          style={{ flex: 1, backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.textPrimary }}
        />
        <TouchableOpacity onPress={ask} disabled={!query.trim()} style={{ marginLeft: 8, backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, opacity: query.trim() ? 1 : 0.6 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13 }}>✨ Ask</Text>
        </TouchableOpacity>
      </View>

      <View style={card}>
        <Text style={cardTitle}>YOUR NEXT BUS</Text>
        {hero ? (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{hero.name}</Text>
                <Text style={{ fontSize: 12.5, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                  {[hero.routeName, hero.identifier].filter(Boolean).join(' · ') || 'No route assigned'}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.badgeSuccessBg }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.badgeSuccessText }}>Live</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10.5, color: colors.textMuted }}>Distance from you</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 2 }}>{hero.distanceM != null ? formatDistance(hero.distanceM) : '—'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10.5, color: colors.textMuted }}>ETA to you</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 2 }}>
                  {hero.distanceM == null ? '—' : heroEta == null ? 'Stopped' : formatEta(heroEta)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10.5, color: colors.textMuted }}>Speed</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 2 }}>{hero.speedKmh != null ? `${Math.round(hero.speedKmh)} km/h` : '—'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              <TouchableOpacity onPress={() => openLiveMap(hero.id)} style={{ flex: 1, backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginRight: 8 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 13.5 }}>Open live tracking</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('BusDetail', { busId: hero.id, busName: hero.name })} style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 11, alignItems: 'center' }}>
                <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13.5 }}>Bus details</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <Ionicons name="bus-outline" size={30} color={colors.textMuted} />
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 6 }}>
              {buses.length === 0 ? 'No buses registered yet' : 'No buses are live right now'}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>They appear here as soon as they start moving.</Text>
          </View>
        )}
      </View>

      <View style={card}>
        <Text style={cardTitle}>BUSES NEAR YOU</Text>
        {locationBlocked ? (
          <TouchableOpacity onPress={() => Linking.openSettings()}>
            <Text style={{ fontSize: 13, color: colors.critical }}>Location is off. Tap to open settings and allow it, then come back.</Text>
          </TouchableOpacity>
        ) : !position ? (
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Finding your location…</Text>
        ) : nearby.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.textMuted }}>No buses are live right now.</Text>
        ) : (
          nearby.map((b, i) => (
            <TouchableOpacity
              key={b.id}
              onPress={() => openLiveMap(b.id)}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}
            >
              <View style={{ flexShrink: 1, paddingRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                    <IconBus size={14} color={colors.accent} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }} numberOfLines={1}>{b.name}</Text>
                </View>                
                {!!b.routeName && <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2, marginLeft: 36 }} numberOfLines={1}>{b.routeName}</Text>}
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.accent }}>{formatDistance(b.distanceM)}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={card}>
        <Text style={cardTitle}>LIVE RIGHT NOW</Text>
        {liveBuses.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.textMuted }}>No buses live right now.</Text>
        ) : (
          liveBuses.slice(0, 4).map((b, i) => (
            <TouchableOpacity
              key={b.id}
              onPress={() => navigation.navigate('BusDetail', { busId: b.id, busName: b.name })}
              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }} numberOfLines={1}>{b.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginRight: 6 }} />
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: colors.accent }}>Live</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={[cardTitle, { marginBottom: 0 }]}>SERVICE ALERTS</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
            <Text style={{ fontSize: 12.5, fontWeight: '600', color: colors.accent }}>See all</Text>
          </TouchableOpacity>
        </View>
        {serviceAlerts.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 6 }}>
            <Ionicons name="checkmark-circle-outline" size={28} color={colors.accent} />
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>No active alerts</Text>
          </View>
        ) : (
          serviceAlerts.map((n, i) => {
            const meta = notificationMeta(n.type, colors);
            return (
              <View key={n._id} style={{ flexDirection: 'row', paddingVertical: 9, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: meta.bgColor || colors.bgPage, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <NotificationIcon type={n.type} size={18} color={meta.color} />
                </View>                
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontWeight: '600', color: colors.textPrimary }}>{n.title}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{timeAgo(new Date(n.createdAt).getTime())}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}