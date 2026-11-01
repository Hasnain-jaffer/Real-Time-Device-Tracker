// mobile/src/screens/SettingsScreen.js
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationsContext';
import { IconSun, IconMoon, IconBell, IconInfo } from '../components/Icons';

export default function SettingsScreen() {
  const { colors, mode, setThemeMode, isDark } = useTheme();
  const { unreadCount } = useNotifications();

  const settings = [
    {
      icon: <IconSun size={20} color={colors.accent} />,
      title: 'Appearance',
      description: `Currently ${isDark ? 'Dark' : 'Light'} mode`,
      action: (
        <View style={{ flexDirection: 'row', backgroundColor: colors.bgPage, borderRadius: 8, padding: 2 }}>
          {['light', 'dark', 'system'].map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setThemeMode(m)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 6,
                backgroundColor: mode === m ? colors.accent : 'transparent',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: mode === m ? '#fff' : colors.textSecondary, textTransform: 'capitalize' }}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
    },
    {
      icon: <IconBell size={20} color={colors.accent} />,
      title: 'Notifications',
      description: unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up',
      action: (
        <TouchableOpacity onPress={() => {}} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '600' }}>View all</Text>
        </TouchableOpacity>
      ),
    },
    {
      icon: <IconInfo size={20} color={colors.accent} />,
      title: 'About',
      description: 'RoutePulse v1.0.0',
      action: null,
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPage }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>Settings</Text>

      {settings.map((item, i) => (
        <View
          key={item.title}
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
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.bgPage, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            {item.icon}
          </View>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{item.title}</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{item.description}</Text>
          </View>
          {item.action}
        </View>
      ))}

      <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 24 }}>
        RoutePulse - Final Year Project{'\n'}My Campus Ride
      </Text>
    </ScrollView>
  );
}