// mobile/src/screens/HomeScreen.js
import { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Linking, TextInput, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useLiveBuses } from '../context/LiveBusesContext';
import { useUserLocation } from '../context/LocationContext';
import { useNotifications } from '../context/NotificationsContext';
import apiClient from '../lib/apiClient';
import { haversineMeters, formatDistance } from '../utils/geo';
import { IconBus, IconSearch, IconBell, IconClock, IconShield, IconCheckCircle, IconChevronRight, IconMapPin } from '../components/Icons';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { isConnected } = useSocket();
  const { buses, liveBuses, error, refresh } = useLiveBuses();
  const { position, status } = useUserLocation();
  const { unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [focusedBus, setFocusedBus] = useState(null);

  const onlineCount = liveBuses.length;
  const totalBuses = buses.length;

  const nearby = useMemo(() => {
    if (!position) return [];
    return liveBuses
      .map((b) => ({ ...b, distanceM: haversineMeters(position.latitude, position.longitude, b.latitude, b.longitude) }))
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, 3);
  }, [liveBuses, position]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const q = query.toLowerCase();
    const results = buses.filter(
      (d) => d.name?.toLowerCase().includes(q) || d.identifier?.toLowerCase().includes(q)
    );
    setSearchResults(results);
  }, [query, buses]);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const openOnMap = (busId) => navigation.navigate('Live Map', { busId });

  const cardShadow = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  };

  const card = {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    ...cardShadow,
  };

  const locationBlocked = status === 'denied' || status === 'services-off' || status === 'error';

  const StatItem = ({ icon: Icon, label, value, iconBg, iconColor }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Icon size={18} color={iconColor} />
      </View>
      <View>
        <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '500' }}>{label}</Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 1 }}>{value}</Text>
      </View>
    </View>
  );

  const header = (
    <View>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>
            Welcome back, {user?.name?.split(' ')[0] || 'there'}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
            {onlineCount} bus{onlineCount !== 1 ? 'es' : ''} live · {isConnected ? 'All systems normal' : 'Reconnecting…'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Alerts')}
          style={{
            width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgSurface,
            borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
            ...cardShadow,
          }}
        >
          <IconBell size={18} color={colors.textSecondary} />
          {unreadCount > 0 && (
            <View style={{
              position: 'absolute', top: -4, right: -4, backgroundColor: colors.badgeEtaBg,
              borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
            }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.badgeEtaText }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={{ marginBottom: 16 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface,
          borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12,
          ...cardShadow,
        }}>
          <IconSearch size={16} color={colors.textMuted} />
          <TextInput
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14, color: colors.textPrimary }}
            placeholder="Search buses, routes, stops…"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        {searchResults.length > 0 && (
          <View style={{
            backgroundColor: colors.bgSurface, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
            marginTop: 8, overflow: 'hidden', ...cardShadow,
          }}>
            {searchResults.slice(0, 5).map((d) => (
              <TouchableOpacity
                key={d.id}
                onPress={() => { setFocusedBus(d); setQuery(''); setSearchResults([]); }}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
              >
                <Text style={{ fontSize: 14, color: colors.textPrimary }}>{d.name}</Text>
                <Text style={{ fontSize: 12, color: d.isLive ? colors.accent : colors.textMuted }}>
                  {d.isLive ? 'Live' : 'Offline'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Stats Strip */}
      <View style={[card, { flexDirection: 'row', padding: 16, marginBottom: 16 }]}>
        <StatItem
          icon={IconBus}
          label="Registered buses"
          value={totalBuses}
          iconBg={colors.accentBg}
          iconColor={colors.accent}
        />
        <StatItem
          icon={IconClock}
          label="Online now"
          value={`${onlineCount}/${totalBuses || 0}`}
          iconBg={colors.badgeEtaBg}
          iconColor={colors.badgeEtaText}
        />
        <StatItem
          icon={IconShield}
          label="Service status"
          value={isConnected ? 'Operational' : 'Degraded'}
          iconBg={isConnected ? colors.accentBg : 'rgba(185,74,58,0.1)'}
          iconColor={isConnected ? colors.accent : colors.critical}
        />
      </View>

      {/* Next Bus Card */}
      <View style={[card, { marginBottom: 16 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
            Your next bus
          </Text>
          {focusedBus?.isLive && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.badgeSuccessBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.badgeSuccessText, marginRight: 4 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.badgeSuccessText }}>Live</Text>
            </View>
          )}
        </View>

        {focusedBus ? (
          <>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>{focusedBus.name}</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
              {focusedBus.identifier || 'No identifier'}
              {focusedBus.updatedAt ? ` · Updated ${new Date(focusedBus.updatedAt).toLocaleTimeString()}` : ''}
            </Text>
            <TouchableOpacity
              onPress={() => openOnMap(focusedBus.id)}
              style={{
                backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12,
                alignItems: 'center', marginTop: 16, flexDirection: 'row', justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Open live tracking</Text>
              <IconChevronRight size={16} color="#fff" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.bgPage, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <IconBus size={24} color={colors.textMuted} />
            </View>
            <Text style={{ fontSize: 14, color: colors.textMuted }}>No buses registered yet</Text>
          </View>
        )}
      </View>

      {/* Live Right Now */}
      <View style={[card, { marginBottom: 16 }]}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Live right now
        </Text>
        {liveBuses.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.bgPage, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <IconBus size={24} color={colors.textMuted} />
            </View>
            <Text style={{ fontSize: 14, color: colors.textMuted }}>No buses live right now</Text>
          </View>
        ) : (
          liveBuses.slice(0, 5).map((b, i) => (
            <TouchableOpacity
              key={b.id}
              onPress={() => setFocusedBus(b)}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingVertical: 10, paddingHorizontal: 8,
                borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border,
                borderRadius: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.badgeSuccessBg, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <IconBus size={14} color={colors.badgeSuccessText} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{b.name}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accent }}>Live</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Buses Near You */}
      <View style={[card, { marginBottom: 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <IconMapPin size={16} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
            Buses near you
          </Text>
        </View>
        {locationBlocked ? (
          <TouchableOpacity onPress={() => Linking.openSettings()}>
            <Text style={{ fontSize: 13, color: colors.critical }}>
              Location is off. Tap to open settings and allow it, then come back.
            </Text>
          </TouchableOpacity>
        ) : !position ? (
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Finding your location…</Text>
        ) : nearby.length === 0 ? (
          <Text style={{ fontSize: 13, color: colors.textMuted }}>No buses currently online nearby.</Text>
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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

      {/* Service Alerts */}
      <View style={[card, { marginBottom: 16 }]}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Service alerts
        </Text>
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.badgeSuccessBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <IconCheckCircle size={24} color={colors.badgeSuccessText} />
          </View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted }}>No active alerts</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Everything is running smoothly</Text>
        </View>
      </View>

      {/* All Buses Section */}
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 8, marginBottom: 12 }}>All buses</Text>
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