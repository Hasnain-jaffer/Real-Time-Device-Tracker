import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLiveBuses } from '../context/LiveBusesContext';
import { timeAgo } from '../utils/geo';
import { IconBus, IconSearch, IconChevronRight } from '../components/Icons';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'offline', label: 'Offline' },
];

export default function BusesScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { buses, loading, error, refresh } = useLiveBuses();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const liveCount = buses.filter((b) => b.isLive).length;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return buses.filter((b) => {
      const matchesText =
        !q ||
        b.name.toLowerCase().includes(q) ||
        (b.identifier || '').toLowerCase().includes(q) ||
        (b.routeName || '').toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || (filter === 'live' ? b.isLive : !b.isLive);
      return matchesText && matchesFilter;
    });
  }, [buses, query, filter]);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const header = (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>Buses</Text>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
        {buses.length} registered · {liveCount} live right now
      </Text>

      <View style={{ position: 'relative', marginTop: 14 }}>
        <IconSearch size={16} color={colors.textMuted} style={{ position: 'absolute', left: 14, top: 14 }} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, route or identifier"
          placeholderTextColor={colors.textMuted}
          style={{
            backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1,
            borderRadius: 12, paddingHorizontal: 14, paddingLeft: 40, paddingVertical: 11, fontSize: 14, color: colors.textPrimary,
          }}
        />
      </View>

      <View style={{ flexDirection: 'row', marginTop: 10 }}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{
                marginRight: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
                borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accent : colors.bgSurface,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#FFFFFF' : colors.textSecondary }}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!!error && <Text style={{ color: colors.critical, fontSize: 13, marginTop: 10 }}>{error}</Text>}
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bgPage }}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
      data={list}
      keyExtractor={(b) => b.id}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', marginTop: 30 }}>
          <IconBus size={34} color={colors.textMuted} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 6 }}>
            {loading ? 'Loading buses…' : buses.length === 0 ? 'No buses registered yet' : 'No buses match your search'}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => navigation.navigate('BusDetail', { busId: item.id, busName: item.name })}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, borderRadius: 14, padding: 14,
            marginBottom: 10, borderWidth: 1, borderColor: item.isLive ? colors.accent + '88' : colors.border,
          }}
        >
          <View style={{ width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: item.isLive ? colors.accent + '24' : colors.bgPage }}>
            <IconBus size={22} color={item.isLive ? colors.accent : colors.textMuted} />
          </View>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{item.name}</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>
              {[item.routeName, item.identifier].filter(Boolean).join(' · ') || 'No route assigned'}
            </Text>
            <Text style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 2 }}>
              {item.isLive ? 'Reporting live' : item.updatedAt ? `Last seen ${timeAgo(item.updatedAt, now)}` : 'Never seen'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: item.isLive ? colors.badgeSuccessBg : colors.bgPage }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: item.isLive ? colors.badgeSuccessText : colors.textMuted }}>
                {item.isLive ? 'Live' : 'Offline'}
              </Text>
            </View>
            <IconChevronRight size={16} color={colors.textMuted} style={{ marginTop: 6 }} />
          </View>
        </TouchableOpacity>
      )}
    />
  );
}