// mobile/src/screens/AlertsScreen.js
import { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useNotifications } from '../context/NotificationsContext';
import { useTheme } from '../context/ThemeContext';
import { notificationMeta } from '../utils/notificationMeta';
import { timeAgo } from '../utils/geo';
import { NotificationIcon, IconBell } from '../components/Icons';

export default function AlertsScreen() {
  const { colors } = useTheme();
  const { items, unreadCount, loading, error, refresh, markRead, markAllRead } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const header = (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </Text>
        <TouchableOpacity onPress={markAllRead} disabled={unreadCount === 0} style={{ opacity: unreadCount === 0 ? 0.4 : 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.accent }}>Mark all as read</Text>
        </TouchableOpacity>
      </View>
      {!!error && <Text style={{ color: colors.critical, fontSize: 13, marginTop: 8 }}>{error}</Text>}
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bgPage }}
      contentContainerStyle={{ padding: 16 }}
      data={items}
      keyExtractor={(n) => n._id}
      ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <IconBell size={32} color={colors.textMuted} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 8 }}>
            {loading ? 'Loading alerts…' : 'No alerts yet'}
          </Text>
          {!loading && (
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2, textAlign: 'center' }}>
              Bus arrivals, departures and delays will appear here.
            </Text>
          )}
        </View>
      }
      renderItem={({ item }) => {
        const meta = notificationMeta(item.type, colors);
        return (
          <TouchableOpacity
            onPress={() => markRead(item._id)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row', backgroundColor: colors.bgSurface, borderRadius: 14, padding: 14, marginBottom: 10,
              borderWidth: 1, borderColor: item.isRead ? colors.border : meta.color,
              opacity: item.isRead ? 0.75 : 1,
            }}
          >
            <View style={{ marginRight: 12, marginTop: 2 }}>
              <NotificationIcon type={item.type} size={22} color={meta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: item.isRead ? '600' : '700', color: colors.textPrimary }}>{item.title}</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{item.message}</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 6 }}>{timeAgo(new Date(item.createdAt).getTime(), now)}</Text>
            </View>
            {!item.isRead && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: meta.color, marginTop: 4 }} />}
          </TouchableOpacity>
        );
      }}
    />
  );
}