// mobile/src/components/DrawerContent.js
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { IconBus, IconHome, IconMap, IconRoute, IconBell, IconClock, IconSettings, IconUser, IconLogout, IconMoon, IconSun } from './Icons';

const MENU_ITEMS = [
  { label: 'Home', icon: 'home', route: 'Home' },
  { label: 'Buses', icon: 'bus', route: 'Buses' },
  { label: 'Live Map', icon: 'map', route: 'Live Map' },
  { label: 'Routes', icon: 'route', route: 'Routes' },
  { label: 'History', icon: 'clock', route: 'History' },
  { label: 'Alerts', icon: 'bell', route: 'Alerts', badge: true },
];

const ICONS = {
  home: IconHome,
  bus: IconBus,
  map: IconMap,
  route: IconRoute,
  bell: IconBell,
  clock: IconClock,
  settings: IconSettings,
  user: IconUser,
  logout: IconLogout,
  moon: IconMoon,
  sun: IconSun,
};

export default function DrawerContent(props) {
  const { colors, isDark, mode, setThemeMode } = useTheme();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const insets = useSafeAreaInsets();

  const handleNavigate = (routeName) => {
    props.navigation.navigate(routeName);
    props.navigation.closeDrawer();
  };

  const themeLabel = mode === 'system' ? 'System' : mode === 'dark' ? 'Dark' : 'Light';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgSidebar }}>
      {/* Header with logo */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <IconBus size={22} color="#FFFFFF" />
          </View>
          <View>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>RoutePulse</Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Campus Bus Tracking</Text>
          </View>
        </View>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 8 }}>
        {MENU_ITEMS.map((item) => {
          const IconComponent = ICONS[item.icon];
          const isActive = props.state.routeNames[props.state.index] === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              onPress={() => handleNavigate(item.route)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 12,
                backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderLeftWidth: 3,
                borderLeftColor: isActive ? colors.accent : 'transparent',
              }}
            >
              <IconComponent size={20} color={isActive ? colors.accent : 'rgba(255,255,255,0.7)'} />
              <Text style={{ color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: isActive ? '600' : '400', marginLeft: 16, flex: 1 }}>
                {item.label}
              </Text>
              {item.badge && unreadCount > 0 && (
                <View style={{ backgroundColor: colors.critical, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Theme Section */}
        <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', paddingHorizontal: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Appearance
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 }}>
            <IconSun size={18} color="rgba(255,255,255,0.7)" />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginLeft: 16, flex: 1 }}>Theme</Text>
            <TouchableOpacity
              onPress={() => setThemeMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light')}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <IconMoon size={14} color="rgba(255,255,255,0.7)" style={{ marginRight: 6 }} />
              <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '500' }}>{themeLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </DrawerContentScrollView>

      {/* Bottom: Profile & Logout */}
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingBottom: insets.bottom + 16 }}>
        <TouchableOpacity
          onPress={() => handleNavigate('Profile')}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }} numberOfLines={1}>{user?.name || 'User'}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} numberOfLines={1}>{user?.email}</Text>
          </View>
          <IconUser size={18} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={logout}
          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
        >
          <IconLogout size={18} color={colors.critical} />
          <Text style={{ color: colors.critical, fontSize: 14, fontWeight: '500', marginLeft: 12 }}>Log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}