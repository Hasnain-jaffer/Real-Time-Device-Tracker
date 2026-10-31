// mobile/src/screens/HomeScreen.js
import { useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useLiveBuses } from '../context/LiveBusesContext';
import { useUserLocation } from '../context/LocationContext';
import { haversineMeters, formatDistance } from '../utils/geo';
import { IconBus } from '../components/Icons';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { isConnected } = useSocket();
  const { buses, liveBuses, error, refresh } = useLiveBuses();
  const { position, status } = useUserLocation();
  const [refreshing, setRefreshing] = useState(false);

  const nearby = useMemo(() => {
    if (!position) return [];
    return liveBuses
      .map((b) => ({ ...b, distanceM: haversineMeters(position.latitude, position.longitude, b.latitude, b.longitude) }))
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, 3);
  }, [liveBuses, position]);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const openOnMap = (busId) => navigation.navigate('Live Map', { busId });

  const card = { backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14 };
  const locationBlocked = status === 'denied' || status === 'services-off' || status === 'error';

  const header = (
    <View>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>
        Hi, {user?.name?.split(' ')[0] || 'there'}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, marginRight: 6, backgroundColor: isConnected ? colors.accent : colors.critical }} />
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
          {isConnected ? 'Live connection active' : 'Connecting…'} · {liveBuses.length} bus{liveBuses.length !== 1 ? 'es' : ''} live
        </Text>
      </View>
      {!!error && <Text style={{ color: colors.critical, fontSize: 13, marginTop: 8 }}>{error}</Text>}

      <View style={[card, { marginTop: 16 }]}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Buses near you</Text>
        {locationBlocked ? (
          <TouchableOpacity onPress={() => Linking.openSettings()}>
            <Text style={{ fontSize: 13, color: colors.critical }}>
              Location is off. Tap to open settings and allow it, then come back.
            </Text>
          </TouchableOpacity>
        ) : !position ? (
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Finding your location…</Text>
        ) : nearby.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.textMuted }}>No buses are live right now.</Text>
        ) : (
          nearby.map((b, i) => (
            <TouchableOpacity
              key={b.id}
              onPress={() => openOnMap(b.id)}
              style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border,
              }}
            >
              <View style={{ flexShrink: 1, paddingRight: 8, flexDirection: 'row', alignItems: 'center' }}>
                <IconBus size={16} color={colors.accent} style={{ marginRight: 8 }} />
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }} numberOfLines={1}>{b.name}</Text>
                  {!!b.routeName && <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>{b.routeName}</Text>}
                </View>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.accent }}>{formatDistance(b.distanceM)}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 20, marginBottom: 10 }}>All buses</Text>
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bgPage }}
      contentContainerStyle={{ padding: 16 }}
      data={buses}
      keyExtractor={(b) => b.id}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      ListEmptyComponent={<Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 12 }}>No buses registered yet.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          disabled={!item.isLive || item.latitude == null}
          onPress={() => openOnMap(item.id)}
          style={[card, { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
        >
          <View style={{ flexShrink: 1, paddingRight: 8, flexDirection: 'row', alignItems: 'center' }}>
            <IconBus size={18} color={item.isLive ? colors.accent : colors.textMuted} style={{ marginRight: 10 }} />
            <View>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                {[item.routeName, item.identifier].filter(Boolean).join(' · ') || 'No route assigned'}
              </Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: item.isLive ? colors.badgeSuccessBg : colors.bgPage }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: item.isLive ? colors.badgeSuccessText : colors.textMuted }}>
              {item.isLive ? 'Live' : 'Offline'}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}