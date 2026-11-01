// mobile/src/screens/LiveMapScreen.js
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, TextInput } from 'react-native';
import LeafletMap from '../components/LeafletMap';
import { useLiveBuses } from '../context/LiveBusesContext';
import { useUserLocation } from '../context/LocationContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { haversineMeters, formatDistance, estimateEtaMinutes, formatEta, timeAgo } from '../utils/geo';
import { IconBus, IconSearch, IconMapPin, IconSignal, IconCrosshair } from '../components/Icons';

function Metric({ label, value, colors }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
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
  const [query, setQuery] = useState('');

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

  const filteredBuses = query.trim()
    ? liveBuses.filter((b) => b.name?.toLowerCase().includes(query.toLowerCase()))
    : liveBuses;

  const cardShadow = {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  };

  const overlay = {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    ...cardShadow,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <LeafletMap buses={liveBuses} user={position} selectedId={selected?.id} isDark={isDark} focus={focus} onSelect={selectBus} />

      {/* Status Chip */}
      <View style={[overlay, { position: 'absolute', top: 12, left: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }]}>
        <View style={{ width: 8, height: 8, borderRadius: 4, marginRight: 6, backgroundColor: isConnected ? colors.accent : colors.critical }} />
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary }}>
          {isConnected ? `${liveBuses.length} bus${liveBuses.length !== 1 ? 'es' : ''} live` : 'Reconnecting…'}
        </Text>
      </View>

      {/* Bottom Sheet */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12 }}>
        {/* Tracked Buses Panel */}
        {liveBuses.length > 0 && (
          <View style={[overlay, { marginBottom: 8, padding: 12 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>Tracked buses</Text>
              <View style={{ backgroundColor: colors.bgPage, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>{liveBuses.length}</Text>
              </View>
            </View>
            
            <View style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgPage,
              borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8,
            }}>
              <IconSearch size={14} color={colors.textMuted} />
              <TextInput
                style={{ flex: 1, marginLeft: 6, fontSize: 13, color: colors.textPrimary }}
                placeholder="Search buses..."
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
              />
            </View>

            <ScrollView style={{ maxHeight: 120 }} showsVerticalScrollIndicator={false}>
              {filteredBuses.map((b) => {
                const isSelected = b.id === selected?.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => selectBus(b.id)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingVertical: 8, paddingHorizontal: 8, borderRadius: 8,
                      backgroundColor: isSelected ? colors.accentBg : 'transparent',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginRight: 8 }} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>{b.name}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      {b.updatedAt ? timeAgo(b.updatedAt, now) : '—'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Location Off Warning */}
        {locationOff && (
          <TouchableOpacity onPress={() => Linking.openSettings()} style={[overlay, { padding: 10, marginBottom: 8 }]}>
            <Text style={{ fontSize: 12, color: colors.critical }}>
              Location is off, so distance and ETA are unavailable. Tap to open settings.
            </Text>
          </TouchableOpacity>
        )}

        {/* Selected Bus Card */}
        <View style={[overlay, { padding: 14 }]}>
          {selected ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 8, backgroundColor: colors.accentBg,
                  alignItems: 'center', justifyContent: 'center', marginRight: 10,
                }}>
                  <IconBus size={16} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{selected.name}</Text>
                  {selected.identifier && (
                    <Text style={{ fontSize: 11, color: colors.textMuted }} numberOfLines={1}>{selected.identifier}</Text>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                <Metric colors={colors} label="Distance" value={formatDistance(distanceM)} />
                <Metric colors={colors} label="ETA" value={distanceM == null ? '—' : etaMin == null ? 'Stopped' : formatEta(etaMin)} />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <IconSignal size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                  {selected.speedKmh != null ? `${selected.speedKmh.toFixed(0)} km/h` : 'Speed unavailable'}
                </Text>
                <IconCrosshair size={12} color={colors.textMuted} style={{ marginLeft: 12, marginRight: 4 }} />
                <Text style={{ fontSize: 11, color: colors.textSecondary, fontFamily: 'monospace' }}>
                  {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row' }}>
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