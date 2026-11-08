// mobile/src/components/DrawerMenu.js
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LogoMark from './LogoMark';
import ThemeSwitcher from './ThemeSwitcher';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';
import { useNotifications } from '../context/NotificationsContext';
import { navigationRef, goToTab, goToScreen } from '../navigation/navigationRef';
import { IconHome, IconBus, IconMap, IconClock, IconRoute, IconBell, IconSettings, IconUser, IconLogout, IconShield } from './Icons';

const ITEMS = [
  { label: 'Home', Icon: IconHome, route: 'Home', tab: true },
  { label: 'Buses', Icon: IconBus, route: 'Buses', tab: true },
  { label: 'Live Map', Icon: IconMap, route: 'Live Map', tab: true },
  { label: 'History', Icon: IconClock, route: 'History', tab: true },
  { label: 'Routes', Icon: IconRoute, route: 'Routes' },
  { label: 'Alerts', Icon: IconBell, route: 'Alerts', badge: true },
  { label: 'Settings', Icon: IconSettings, route: 'Settings' },
  { label: 'Profile', Icon: IconUser, route: 'Profile' },
];

// Only shown to signed-in admins
const ADMIN_ITEM = { label: 'Admin Panel', Icon: IconShield, route: 'AdminPanel' };

const PANEL_WIDTH = Math.min(310, Dimensions.get('window').width * 0.82);

export default function DrawerMenu() {
  const { user, logout, isGuest, isAdmin } = useAuth();
  const { colors } = useTheme();
  const { isOpen, closeDrawer } = useDrawer();
  const { unreadCount } = useNotifications();
  const insets = useSafeAreaInsets();

  const progress = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCurrent(navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : null);
      setVisible(true);
      Animated.timing(progress, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(progress, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }
  }, [isOpen]);

  if (!user) return null;

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-PANEL_WIDTH, 0] });
  const backdrop = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });

  function go(item) {
    closeDrawer();
    if (item.tab) goToTab(item.route);
    else goToScreen(item.route);
  }

  async function handleLogout() {
    closeDrawer();
    await logout();
  }

  const menuItems = [...ITEMS];
  if (isAdmin) {
    menuItems.splice(5, 0, ADMIN_ITEM);
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={closeDrawer}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: backdrop }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} accessibilityLabel="Close menu" />

        <Animated.View style={{
          position: 'absolute', top: 0, bottom: 0, left: 0, width: PANEL_WIDTH,
          backgroundColor: colors.bgSurface, transform: [{ translateX }]
        }}>
          {/* Header */}
          <View style={{
            backgroundColor: colors.bgSidebar, paddingTop: insets.top + 16, paddingBottom: 16, paddingHorizontal: 16
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <LogoMark size={34} />
              <Text style={{ marginLeft: 10, fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
                My Campus Ride
              </Text>
            </View>

            {isGuest ? (
              <View style={{
                marginTop: 14, flexDirection: 'row', alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 8
              }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <Text style={{ color: '#fff', fontSize: 14 }}>👤</Text>
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>Guest</Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Browsing without an account</Text>
                </View>
                <TouchableOpacity onPress={() => { closeDrawer(); goToScreen('Login'); }}>
                  <Text style={{ fontSize: 12, color: '#79B37C', fontWeight: '600' }}>Sign in</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={{ marginTop: 14, fontSize: 15, fontWeight: '600', color: '#FFFFFF' }} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 }} numberOfLines={1}>
                  {user.email}
                </Text>
                {isAdmin && (
                  <View style={{
                    marginTop: 6, alignSelf: 'flex-start', backgroundColor: '#79B37C',
                    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>ADMIN</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Menu Items */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 10 }}>
            {menuItems.map((item) => {
              const active = current === item.route;
              const ItemIcon = item.Icon;
              return (
                <TouchableOpacity
                  key={item.route}
                  onPress={() => go(item)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12,
                    borderRadius: 12, marginBottom: 2,
                    backgroundColor: active ? colors.accent + '24' : 'transparent'
                  }}
                >
                  <ItemIcon size={22} color={active ? colors.accent : colors.textSecondary} />
                  <Text style={{
                    flex: 1, marginLeft: 14, fontSize: 15,
                    fontWeight: active ? '700' : '500',
                    color: active ? colors.accent : colors.textPrimary
                  }}>
                    {item.label}
                  </Text>
                  {item.badge && unreadCount > 0 && (
                    <View style={{
                      minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.critical,
                      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5
                    }}>
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={{
            padding: 14, paddingBottom: insets.bottom + 14, borderTopWidth: 1, borderTopColor: colors.border
          }}>
            <ThemeSwitcher />
            {!isGuest && (
              <TouchableOpacity onPress={handleLogout} style={{
                flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingVertical: 6
              }}>
                <IconLogout size={22} color={colors.critical} />
                <Text style={{ marginLeft: 14, fontSize: 15, fontWeight: '600', color: colors.critical }}>
                  Log out
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}