// mobile/src/screens/LiveMapScreen.js
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Linking, ScrollView } from 'react-native';
import LeafletMap from '../components/LeafletMap';
import { useLiveBuses } from '../context/LiveBusesContext';
import { useUserLocation } from '../context/LocationContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { haversineMeters, formatDistance, estimateEtaMinutes, formatEta } from '../utils/geo';
import { IconBus, IconSignal } from '../components/Icons';

function Metric({ label, value, colors }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 9.5, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 1 }}>{value}</Text>
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

  function focusOn(target, id = null) {
    setFocus((f) => ({ target, id, nonce: f.nonce + 1 }));
  }

  function selectBus(id) {
    setSelectedId(id);
    focusOn('bus', id);
  }

  // A screen can deep-link here with ?busId=
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
  const locationOff = status === 'denied' || status === 'services-off';
  const locationLoading = status === 'undetermined';

  const overlay = {
    backgroundColor: colors.bgSurface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <LeafletMap
        buses={liveBuses}
        user={position}
        selectedId={selected?.id}
        isDark={isDark}
        focus={focus}
        onSelect={selectBus}
        topOffset={42}  // pushes below the status chip
      />

      {/* Status Chip */}
      <View
        style={[
          overlay,
          {
            position: "absolute",
            top: 12,
            left: 12,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
          },
        ]}
      >
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            marginRight: 6,
            backgroundColor: isConnected ? colors.accent : colors.critical,
          }}
        />
        <Text
          style={{ fontSize: 12, fontWeight: "600", color: colors.textPrimary }}
        >
          {isConnected
            ? `${liveBuses.length} bus${liveBuses.length !== 1 ? "es" : ""} live`
            : "Reconnecting…"}
        </Text>
      </View>

      {/* Bottom Sheet */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 12,
        }}
      >
        {/* Location Off Warning */}
        {locationOff && (
          <TouchableOpacity
            onPress={() => Linking.openSettings()}
            style={[overlay, { padding: 10, marginBottom: 8 }]}
          >
            <Text style={{ fontSize: 12, color: colors.critical }}>
              {status === "denied"
                ? "Location permission denied. Tap to open settings and enable it."
                : "Location services are off. Tap to open settings."}
            </Text>
          </TouchableOpacity>
        )}

        {/* Slim Bus Chip Strip — only when 2+ buses */}
        {liveBuses.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 8, flexGrow: 0 }}
            contentContainerStyle={{ gap: 6, paddingHorizontal: 2 }}
          >
            {liveBuses.map((b) => {
              const isSel = b.id === selected?.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => selectBus(b.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: isSel ? colors.accent : colors.bgSurface,
                    borderWidth: 1,
                    borderColor: isSel ? colors.accent : colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      marginRight: 6,
                      backgroundColor: isSel ? "#fff" : colors.accent,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: isSel ? "#fff" : colors.textPrimary,
                    }}
                    numberOfLines={1}
                  >
                    {b.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Compact Selected Bus Card */}
        <View style={[overlay, { padding: 12 }]}>
          {selected ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    backgroundColor: colors.accentBg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <IconBus size={15} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14.5,
                      fontWeight: "700",
                      color: colors.textPrimary,
                    }}
                    numberOfLines={1}
                  >
                    {selected.name}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 1,
                    }}
                  >
                    {selected.identifier && (
                      <Text
                        style={{
                          fontSize: 10.5,
                          color: colors.textMuted,
                          marginRight: 8,
                        }}
                        numberOfLines={1}
                      >
                        {selected.identifier}
                      </Text>
                    )}
                    <IconSignal
                      size={10}
                      color={colors.textMuted}
                      style={{ marginRight: 3 }}
                    />
                    <Text
                      style={{ fontSize: 10.5, color: colors.textSecondary }}
                    >
                      {selected.speedKmh != null
                        ? `${selected.speedKmh.toFixed(0)} km/h`
                        : "Speed unavailable"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: "row", marginBottom: 10 }}>
                <Metric
                  colors={colors}
                  label="Distance"
                  value={formatDistance(distanceM)}
                />
                <Metric
                  colors={colors}
                  label="ETA"
                  value={
                    distanceM == null
                      ? "—"
                      : etaMin == null
                        ? "Stopped"
                        : formatEta(etaMin)
                  }
                />
              </View>

              <View style={{ flexDirection: "row" }}>
                <TouchableOpacity
                  onPress={() => focusOn("bus", selected.id)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.accent,
                    borderRadius: 9,
                    paddingVertical: 8,
                    alignItems: "center",
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontWeight: "600", fontSize: 12.5 }}
                  >
                    Center on bus
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => focusOn("user")}
                  disabled={!position}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 9,
                    paddingVertical: 8,
                    alignItems: "center",
                    opacity: position ? 1 : 0.5,
                  }}
                >
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontWeight: "600",
                      fontSize: 12.5,
                    }}
                  >
                    My location
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <IconBus size={28} color={colors.textMuted} />
              <Text
                style={{
                  fontSize: 13.5,
                  fontWeight: "600",
                  color: colors.textPrimary,
                  marginTop: 6,
                }}
              >
                {loading ? "Loading buses…" : "No buses are live right now"}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}