// mobile/src/screens/LiveMapScreen.js
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import LeafletMap from '../components/LeafletMap';
import { useLiveBuses } from '../context/LiveBusesContext';
import { useUserLocation } from '../context/LocationContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { haversineMeters, formatDistance, estimateEtaMinutes, formatEta, timeAgo } from '../utils/geo';
import { IconBus } from '../components/Icons';

function Metric({ label, value, colors }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 11, color: colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

export default function LiveMapScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { liveBuses, loading } = useLiveBuses();
  const { position, status } = useUserLocation();
  const { isConnected } = useSocket();

  const [selectedId, setSelectedId] = useState(null);
  const [focus, setFocus] = useState({ target: null, id: null, nonce: 0 });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  function focusOn(target, id = null) {
    setFocus((f) => ({ target, id, nonce: f.nonce + 1 }));
  }

  function selectBus(id) {
    setSelectedId(id);
    focusOn('bus', id);
  }

  // Opened from the Home screen for a specific bus
  const incomingBusId = route.params?.busId;
  useEffect(() => {
    if (incomingBusId) {
      selectBus(incomingBusId);
      navigation.setParams({ busId: undefined });
    }
  }, [incomingBusId]);

  const selected = liveBuses.find((b) => b.id === selectedId) || liveBuses[0] || null;
  const distanceM =
    selected && position ? haversineMeters(position.latitude, position.longitude, selected.latitude, selected.longitude) : null;
  const etaMin = distanceM != null ? estimateEtaMinutes(distanceM, selected.speedKmh) : null;
  const locationOff = status !== 'granted';

  const overlay = {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <LeafletMap buses={liveBuses} user={position} selectedId={selected?.id} isDark={isDark} focus={focus} onSelect={selectBus} />

      {/* status chip */}
      <View style={[overlay, { position: 'absolute', top: 12, left: 12, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center' }]}>
        <View style={{ width: 8, height: 8, borderRadius: 4, marginRight: 6, backgroundColor: isConnected ? colors.accent : colors.critical }} />
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary }}>
          {isConnected ? `${liveBuses.length} bus${liveBuses.length !== 1 ? 'es' : ''} live` : 'Reconnecting…'}
        </Text>
      </View>

      {/* bottom sheet */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12 }}>
        {liveBuses.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
            {liveBuses.map((b) => {
              const active = b.id === selected?.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => selectBus(b.id)}
                  style={{
                    marginRight: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? colors.accent : colors.bgSurface,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <IconBus size={14} color={active ? '#FFFFFF' : colors.textPrimary} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : colors.textPrimary }}>{b.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {locationOff && (
          <TouchableOpacity onPress={() => Linking.openSettings()} style={[overlay, { padding: 10, marginBottom: 8 }]}>
            <Text style={{ fontSize: 12, color: colors.critical }}>
              Location is off, so distance and ETA are unavailable. Tap to open settings.
            </Text>
          </TouchableOpacity>
        )}

        <View style={[overlay, { padding: 14 }]}>
          {selected ? (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexShrink: 1, paddingRight: 8, flexDirection: 'row', alignItems: 'center' }}>
                  <IconBus size={20} color={colors.accent} style={{ marginRight: 8 }} />
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{selected.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                      {[selected.routeName, selected.identifier].filter(Boolean).join(' · ') || 'No route assigned'}
                    </Text>
                  </View>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.badgeSuccessBg }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.badgeSuccessText }}>Live</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <Metric colors={colors} label="Distance from you" value={formatDistance(distanceM)} />
                <Metric colors={colors} label="ETA to you" value={distanceM == null ? '—' : etaMin == null ? 'Stopped' : formatEta(etaMin)} />
                <Metric colors={colors} label="Speed" value={selected.speedKmh != null ? `${Math.round(selected.speedKmh)} km/h` : '—'} />
              </View>

              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 10 }}>
                Updated {timeAgo(selected.updatedAt, now)} · ETA is a rough estimate from the bus's current speed.
              </Text>

              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <TouchableOpacity
                  onPress={() => focusOn('bus', selected.id)}
                  style={{ flex: 1, backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginRight: 8 }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Center on bus</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => focusOn('user')}
                  disabled={!position}
                  style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center', opacity: position ? 1 : 0.5 }}
                >
                  <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13 }}>My location</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <IconBus size={32} color={colors.textMuted} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 8 }}>
                {loading ? 'Loading buses…' : 'No buses are live right now'}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>They appear here the moment they start moving.</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}