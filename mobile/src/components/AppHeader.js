// mobile/src/components/AppHeader.js
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LogoMark from './LogoMark';
import { useTheme } from '../context/ThemeContext';
import { useDrawer } from '../context/DrawerContext';
import { useNotifications } from '../context/NotificationsContext';
import { IconBell, IconMenu, IconChevronLeft } from './Icons';

const APP_NAME = 'My Campus Ride';

export default function AppHeader({ navigation, route, options, back }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { openDrawer } = useDrawer();
  const { unreadCount } = useNotifications();

  // MainTabs is the app's root screen, so it never shows a back button
  const isRoot = route.name === 'MainTabs';
  const showBack = !!back && !isRoot;
  const title = isRoot ? APP_NAME : options?.title || route.name;
  const hit = { top: 8, bottom: 8, left: 8, right: 8 };

  return (
    <View style={{ backgroundColor: colors.bgSidebar, paddingTop: insets.top }}>
      <View style={{ height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
        {showBack ? (
          <TouchableOpacity onPress={navigation.goBack} hitSlop={hit} accessibilityLabel="Go back" style={{ marginRight: 8 }}>
            <IconChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ marginRight: 10 }}>
            <LogoMark size={30} />
          </View>
        )}

        <Text numberOfLines={1} style={{ flex: 1, fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
          {title}
        </Text>

        <TouchableOpacity onPress={() => navigation.navigate('Alerts')} hitSlop={hit} accessibilityLabel="Alerts" style={{ marginRight: 18 }}>
          <IconBell size={22} color="#FFFFFF" />
          {unreadCount > 0 && (
            <View style={{ position: 'absolute', top: -5, right: -8, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: colors.critical, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={openDrawer} hitSlop={hit} accessibilityLabel="Open menu">
          <IconMenu size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}