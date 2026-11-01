// mobile/src/components/DrawerContent.js
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { IconBus, IconHome, IconMap, IconRoute, IconBell, IconClock, IconSettings, IconUser, IconLogout, IconMoon, IconSun, IconLogo } from './Icons';

const MENU_ITEMS = [
  { label: 'Dashboard', icon: 'home', route: 'Home' },
  { label: 'Devices', icon: 'bus', route: 'Buses' },
  { label: 'Live tracking', icon: 'map', route: 'Live Map' },
  { label: 'History', icon: 'clock', route: 'History' },
  { label: 'Settings', icon: 'settings', route: 'Settings' },
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
  logo: IconLogo,
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
      <View style={{ 
        paddingTop: insets.top + 20, 
        paddingHorizontal: 20, 
        paddingBottom: 20, 
        borderBottomWidth: 1, 
        borderBottomColor: 'rgba(255,255,255,0.08)' 
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ 
            width: 36, height: 36, borderRadius: 10, 
            backgroundColor: colors.accent, 
            alignItems: 'center', justifyContent: 'center', marginRight: 12 
          }}>
            <IconLogo size={20} color="#FFFFFF" />
          </View>
          <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }}>
            My Campus Ride
          </Text>
        </View>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 12 }}>
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
                marginHorizontal: 12,
                borderRadius: 12,
                backgroundColor: isActive ? colors.navActiveBg : 'transparent',
              }}
            >
              {isActive && (
                <View style={{
                  position: 'absolute', left: 0, top: '50%', marginTop: -10,
                  width: 3, height: 20, borderRadius: 2, backgroundColor: colors.accent,
                }} />
              )}
              <IconComponent 
                size={20} 
                color={isActive ? colors.accent : colors.navInactive} 
                style={{ marginLeft: 8 }}
              />
              <Text style={{ 
                color: isActive ? '#FFFFFF' : colors.navInactive, 
                fontSize: 14, 
                fontWeight: isActive ? '600' : '500', 
                marginLeft: 14, 
                flex: 1 
              }}>
                {item.label}
              </Text>
              {item.badge && unreadCount > 0 && (
                <View style={{ 
                  backgroundColor: colors.badgeEtaBg, 
                  borderRadius: 10, minWidth: 20, height: 20, 
                  alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 
                }}>
                  <Text style={{ color: colors.badgeEtaText, fontSize: 11, fontWeight: '700' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Theme Toggle */}
        <View style={{ 
          marginTop: 20, 
          marginHorizontal: 12,
          paddingTop: 16, 
          borderTopWidth: 1, 
          borderTopColor: 'rgba(255,255,255,0.08)' 
        }}>
          <TouchableOpacity
            onPress={() => setThemeMode(mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 12,
            }}
          >
            {isDark ? (
              <IconMoon size={18} color={colors.navInactive} />
            ) : (
              <IconSun size={18} color={colors.navInactive} />
            )}
            <Text style={{ color: colors.navInactive, fontSize: 14, marginLeft: 14, flex: 1 }}>
              {themeLabel} mode
            </Text>
            <View style={{
              width: 40, height: 22, borderRadius: 11,
              backgroundColor: isDark ? colors.accent : 'rgba(255,255,255,0.2)',
              justifyContent: 'center',
              paddingHorizontal: 2,
            }}>
              <View style={{
                width: 18, height: 18, borderRadius: 9,
                backgroundColor: '#fff',
                alignSelf: isDark ? 'flex-end' : 'flex-start',
              }} />
            </View>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>

      {/* Bottom: User & Logout */}
      <View style={{ 
        padding: 16, 
        borderTopWidth: 1, 
        borderTopColor: 'rgba(255,255,255,0.08)', 
        paddingBottom: insets.bottom + 16 
      }}>
        <TouchableOpacity
          onPress={() => handleNavigate('Profile')}
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            marginBottom: 8,
          }}
        >
          <View style={{ 
            width: 36, height: 36, borderRadius: 18, 
            backgroundColor: colors.accent, 
            alignItems: 'center', justifyContent: 'center' 
          }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
              {user?.name || 'User'}
            </Text>
            <Text style={{ color: colors.navInactive, fontSize: 12, textTransform: 'capitalize' }} numberOfLines={1}>
              {user?.role || 'user'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={logout}
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <IconLogout size={18} color={colors.critical} />
          <Text style={{ color: colors.critical, fontSize: 14, fontWeight: '500', marginLeft: 14 }}>
            Log out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}