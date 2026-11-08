// mobile/src/screens/AdminPanelScreen.js
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../lib/apiClient';

export default function AdminPanelScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const { data } = await apiClient.get('/admin/overview');
      setStats(data);
    } catch (err) {
      console.log('Admin stats error:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (user?.role !== 'admin') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPage }}>
        <Text style={{ fontSize: 16, color: colors.textSecondary }}>Admin access required</Text>
      </View>
    );
  }

  const card = {
    backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1,
    borderRadius: 14, padding: 16, marginBottom: 14,
  };

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.bgPage }} 
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>
        Admin Panel
      </Text>

      {stats && (
        <>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={[card, { flex: 1, marginBottom: 0 }]}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.accent }}>
                {stats.totalUsers || 0}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>Total Users</Text>
            </View>
            <View style={[card, { flex: 1, marginBottom: 0 }]}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.accent }}>
                {stats.totalDevices || 0}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>Buses</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <View style={[card, { flex: 1, marginBottom: 0 }]}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.badgeSuccessText }}>
                {stats.onlineDevices || 0}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>Online Now</Text>
            </View>
            <View style={[card, { flex: 1, marginBottom: 0 }]}>
              <Text style={{ fontSize: 24, fontWeight: '700', color: colors.accentEta }}>
                {stats.totalGeofences || 0}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>Bus Stops</Text>
            </View>
          </View>
        </>
      )}

      <View style={card}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 }}>
          Quick Actions
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
          Full admin features (user management, device configuration, schedule editing) are available on the web dashboard. 
          Mobile admin panel is for monitoring only.
        </Text>
      </View>
    </ScrollView>
  );
}