// mobile/src/components/InAppBanner.js
import { useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../context/NotificationsContext';
import { useTheme } from '../context/ThemeContext';
import { navigationRef } from '../navigation/navigationRef';
import { notificationMeta } from '../utils/notificationMeta';
import { NotificationIcon } from './Icons';

export default function InAppBanner() {
  const { latest } = useNotifications();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-220)).current;
  const hideTimer = useRef(null);
  const [shown, setShown] = useState(null);

  function hide() {
    clearTimeout(hideTimer.current);
    Animated.timing(translateY, { toValue: -220, duration: 220, useNativeDriver: true }).start(() => setShown(null));
  }

  useEffect(() => {
    if (!latest) return;
    if (navigationRef.isReady() && navigationRef.getCurrentRoute()?.name === 'Alerts') return;
    clearTimeout(hideTimer.current);
    setShown(latest);
    translateY.setValue(-220);
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
    hideTimer.current = setTimeout(hide, 5000);
  }, [latest]);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  if (!shown) return null;
  const meta = notificationMeta(shown.type, colors);

  return (
    <Animated.View
      style={{
        position: 'absolute', top: insets.top + 8, left: 12, right: 12, zIndex: 100, elevation: 10,
        transform: [{ translateY }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          hide();
          if (navigationRef.isReady()) navigationRef.navigate('Alerts');
        }}
        style={{
          flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface, borderRadius: 14, padding: 12,
          borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: meta.color,
          shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
        }}
      >
        <View style={{ marginRight: 10 }}>
          <NotificationIcon type={shown.type} size={22} color={meta.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }} numberOfLines={1}>{shown.title}</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={2}>{shown.message}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}