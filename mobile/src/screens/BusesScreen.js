// mobile/src/screens/BusesScreen.js
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { IconBus, IconSearch } from '../components/Icons';

// Temporary mock data
const mockBuses = [
  { _id: '1', busNumber: 'BUS-001', routeName: 'Route A - North Campus', status: 'active', driverName: 'John Doe' },
  { _id: '2', busNumber: 'BUS-002', routeName: 'Route B - South Campus', status: 'delayed', driverName: 'Jane Smith' },
  { _id: '3', busNumber: 'BUS-003', routeName: 'Route C - East Campus', status: 'idle', driverName: 'Mike Johnson' },
];

export default function BusesScreen({ navigation }) {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(mockBuses);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(mockBuses);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        mockBuses.filter(
          (b) =>
            b.busNumber?.toLowerCase().includes(q) ||
            b.routeName?.toLowerCase().includes(q) ||
            b.driverName?.toLowerCase().includes(q)
        )
      );
    }
  }, [search]);

  const getStatusColor = (status) => {
    if (status === 'active') return colors.badgeSuccessBg;
    if (status === 'delayed') return colors.badgeWarningBg;
    return colors.badgeNeutralBg;
  };

  const getStatusText = (status) => {
    if (status === 'active') return colors.badgeSuccessText;
    if (status === 'delayed') return colors.badgeWarningText;
    return colors.badgeNeutralText;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
      {/* Search Bar */}
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.bgSurface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 12,
          }}
        >
          <IconSearch size={18} color={colors.textMuted} />
          <TextInput
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 10,
              fontSize: 15,
              color: colors.textPrimary,
            }}
            placeholder="Search buses..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Mock Status */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: colors.badgeSuccessBg,
            alignSelf: 'flex-start',
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.badgeSuccessText,
              marginRight: 6,
            }}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: colors.badgeSuccessText,
            }}
          >
            Demo Mode
          </Text>
        </View>
      </View>

      {/* Bus List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: colors.bgSurface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* Bus Icon */}
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: colors.accent + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <IconBus size={24} color={colors.accent} />
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                {item.busNumber}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                {item.routeName}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                Driver: {item.driverName}
              </Text>
            </View>

            {/* Status Badge */}
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: getStatusColor(item.status),
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: getStatusText(item.status),
                  textTransform: 'capitalize',
                }}
              >
                {item.status}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <IconBus size={48} color={colors.textMuted} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textSecondary, marginTop: 16 }}>
              {search ? 'No buses match your search' : 'No buses available'}
            </Text>
          </View>
        }
      />
    </View>
  );
}