// mobile/src/screens/BusesScreen.js
import { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLiveBuses } from '../context/LiveBusesContext';
import { IconBus, IconSearch } from '../components/Icons';

export default function BusesScreen({ navigation }) {
  const { colors } = useTheme();
  const { buses, liveBuses } = useLiveBuses();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'online' | 'offline'

  const filtered = useMemo(() => {
    return buses.filter((d) => {
      const matchesSearch =
        d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.identifier?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'online' && d.isLive) ||
        (statusFilter === 'offline' && !d.isLive);
      return matchesSearch && matchesStatus;
    });
  }, [buses, search, statusFilter]);

  const onlineCount = buses.filter((d) => d.isLive).length;

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
    borderRadius: 14,
    padding: 16,
    ...cardShadow,
  };

  const filterOptions = [
    { key: 'all', label: 'All', dot: null },
    { key: 'online', label: 'Online', dot: colors.accent },
    { key: 'offline', label: 'Offline', dot: colors.textMuted },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
      {/* Header */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>Devices</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
          {buses.length} registered · {onlineCount} online right now
        </Text>
      </View>

      {/* Search + Filters */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface,
          borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12,
          ...cardShadow,
        }}>
          <IconSearch size={16} color={colors.textMuted} />
          <TextInput
            style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14, color: colors.textPrimary }}
            placeholder="Search by name or route…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              onPress={() => setStatusFilter(option.key)}
              style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
                backgroundColor: statusFilter === option.key ? colors.accent : colors.bgSurface,
                borderWidth: statusFilter === option.key ? 0 : 1,
                borderColor: colors.border,
                ...cardShadow,
              }}
            >
              {option.dot && (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: option.dot, marginRight: 6 }} />
              )}
              <Text style={{
                fontSize: 12, fontWeight: '600',
                color: statusFilter === option.key ? '#fff' : colors.textSecondary,
              }}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bus List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[card, { marginBottom: 10, flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => item.isLive && navigation.navigate('Live Map', { busId: item.id })}
          >
            <View style={{
              width: 48, height: 48, borderRadius: 12,
              backgroundColor: item.isLive ? colors.accentBg : colors.bgPage,
              alignItems: 'center', justifyContent: 'center', marginRight: 12,
            }}>
              <IconBus size={22} color={item.isLive ? colors.accent : colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                {item.identifier || 'No identifier'}
                {item.lastSeenAt ? ` · Last seen ${new Date(item.lastSeenAt).toLocaleTimeString()}` : ''}
              </Text>
            </View>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
              backgroundColor: item.isLive ? colors.badgeSuccessBg : colors.bgPage,
            }}>
              <View style={{
                width: 6, height: 6, borderRadius: 3, marginRight: 4,
                backgroundColor: item.isLive ? colors.badgeSuccessText : colors.textMuted,
              }} />
              <Text style={{
                fontSize: 11, fontWeight: '600',
                color: item.isLive ? colors.badgeSuccessText : colors.textMuted,
              }}>
                {item.isLive ? 'Online' : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <IconBus size={48} color={colors.textMuted} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textSecondary, marginTop: 16 }}>
              {search ? 'No devices match your search' : 'No buses registered yet'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>
              {search ? 'Try adjusting your filters' : 'Get started by registering your first bus'}
            </Text>
          </View>
        }
      />
    </View>
  );
}