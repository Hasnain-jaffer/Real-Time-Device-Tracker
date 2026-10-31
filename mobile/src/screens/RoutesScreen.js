// mobile/src/screens/RoutesScreen.js
import { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../lib/apiClient';
import { useTheme } from '../context/ThemeContext';
import { useLiveBuses } from '../context/LiveBusesContext';
import { IconBus, IconSparkle, IconClose, IconMapPin, IconArrowRight } from '../components/Icons';

function Group({ title, colors, children }) {
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={{ fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5, color: colors.textMuted, marginBottom: 2 }}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

export default function RoutesScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { routes, buses, loading, error, refresh } = useLiveBuses();

  const [query, setQuery] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const routeRows = useMemo(
    () =>
      routes
        .filter((r) => r.isActive !== false)
        .map((r) => {
          const onRoute = buses.filter((b) => b.routeId === r._id);
          return { ...r, busCount: onRoute.length, liveCount: onRoute.filter((b) => b.isLive).length };
        }),
    [routes, buses]
  );

  const openRoute = (routeId, routeName) => navigation.navigate('RouteDetail', { routeId, routeName });

  function openBus(result) {
    const live = buses.find((b) => b.id === result._id);
    if (live?.isLive && live.latitude != null) {
      navigation.navigate('Live Map', { busId: result._id });
    } else if (result.routeId) {
      openRoute(result.routeId, routes.find((r) => r._id === result.routeId)?.name);
    }
  }

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    Keyboard.dismiss();
    setAiBusy(true);
    try {
      const { data } = await apiClient.post('/ai/search', { query: q });
      setAiResult(data);
    } catch (err) {
      setAiResult({ error: err.response?.data?.message || 'Search failed. Check your connection and try again.' });
    } finally {
      setAiBusy(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const card = { backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14 };
  const linkText = { fontSize: 14, color: colors.accent, paddingVertical: 6 };

  const header = (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          maxLength={200}
          placeholder="Ask: which bus goes to the hospital?"
          placeholderTextColor={colors.textMuted}
          style={{
            flex: 1, backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1, borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: colors.textPrimary,
          }}
        />
        <TouchableOpacity
          onPress={handleSearch}
          disabled={aiBusy || !query.trim()}
          style={{
            marginLeft: 8, backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
            opacity: aiBusy || !query.trim() ? 0.6 : 1, minWidth: 70, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
          }}
        >
          {aiBusy ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <IconSparkle size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Ask</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {!!error && <Text style={{ color: colors.critical, fontSize: 13, marginTop: 10 }}>{error}</Text>}

      {aiResult && (
        <View style={[card, { marginTop: 12 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {aiResult.source === 'ai' && !aiResult.error && (
                <IconSparkle size={12} color={colors.accent} style={{ marginRight: 4 }} />
              )}
              <Text style={{ fontSize: 11, color: colors.textMuted }}>
                {aiResult.error ? 'Search unavailable' : aiResult.source === 'ai' ? 'AI match' : 'Text match (AI unavailable)'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setAiResult(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <IconClose size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {aiResult.error ? (
            <Text style={{ fontSize: 13, color: colors.critical, marginTop: 6 }}>{aiResult.error}</Text>
          ) : !aiResult.routes?.length && !aiResult.stops?.length && !aiResult.buses?.length ? (
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6 }}>No matching routes, stops or buses found.</Text>
          ) : (
            <>
              {aiResult.routes?.length > 0 && (
                <Group title="Routes" colors={colors}>
                  {aiResult.routes.map((r) => (
                    <TouchableOpacity key={r._id} onPress={() => openRoute(r._id, r.name)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <IconArrowRight size={12} color={colors.accent} style={{ marginRight: 6 }} />
                      <Text style={linkText}>{r.name}</Text>
                    </TouchableOpacity>
                  ))}
                </Group>
              )}
              {aiResult.stops?.length > 0 && (
                <Group title="Stops" colors={colors}>
                  {aiResult.stops.map((s) => (
                    <TouchableOpacity key={s._id} onPress={() => openRoute(s.routeId, s.routeName)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <IconMapPin size={12} color={colors.accent} style={{ marginRight: 6 }} />
                      <Text style={linkText}>
                        {s.name} <Text style={{ color: colors.textMuted }}>· {s.routeName}</Text>
                      </Text>
                    </TouchableOpacity>
                  ))}
                </Group>
              )}
              {aiResult.buses?.length > 0 && (
                <Group title="Buses" colors={colors}>
                  {aiResult.buses.map((b) => (
                    <TouchableOpacity key={b._id} onPress={() => openBus(b)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <IconBus size={12} color={colors.accent} style={{ marginRight: 6 }} />
                      <Text style={linkText}>
                        {b.name}{' '}
                        <Text style={{ color: colors.textMuted }}>· {buses.find((x) => x.id === b._id)?.isLive ? 'Live' : 'Offline'}</Text>
                      </Text>
                    </TouchableOpacity>
                  ))}
                </Group>
              )}
            </>
          )}
        </View>
      )}

      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 20, marginBottom: 10 }}>All routes</Text>
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bgPage }}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
      data={routeRows}
      keyExtractor={(r) => r._id}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      ListEmptyComponent={
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 12 }}>
          {loading ? 'Loading routes…' : 'No routes have been created yet.'}
        </Text>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => openRoute(item._id, item.name)}
          style={[card, { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
        >
          <View style={{ flexShrink: 1, paddingRight: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{item.name}</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              {item.busCount} bus{item.busCount !== 1 ? 'es' : ''} assigned
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {item.liveCount > 0 && (
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.badgeSuccessBg, marginRight: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.badgeSuccessText }}>{item.liveCount} live</Text>
              </View>
            )}
            <IconArrowRight size={16} color={colors.textMuted} />
          </View>
        </TouchableOpacity>
      )}
    />
  );
}