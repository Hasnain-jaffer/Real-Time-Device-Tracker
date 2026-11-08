// mobile/src/navigation/RootNavigator.js
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { navigationRef } from './navigationRef';
import AppHeader from '../components/AppHeader';
import { IconHome, IconBus, IconMap, IconClock } from '../components/Icons';
import HomeScreen from '../screens/HomeScreen';
import BusesScreen from '../screens/BusesScreen';
import LiveMapScreen from '../screens/LiveMapScreen';
import HistoryScreen from '../screens/HistoryScreen';
import RoutesScreen from '../screens/RoutesScreen';
import RouteDetailScreen from '../screens/RouteDetailScreen';
import BusDetailScreen from '../screens/BusDetailScreen';
import AlertsScreen from '../screens/AlertsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import LoginScreen from '../screens/LoginScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = { Home: IconHome, Buses: IconBus, 'Live Map': IconMap, History: IconClock };

function Tabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.bgSurface, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => {
          const TabIcon = TAB_ICONS[route.name];
          return TabIcon ? <TabIcon size={size} color={color} /> : null;
        },
      })}
      lazy={false}
      unmountOnBlur={false}
      detachInactiveScreens={false}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Buses" component={BusesScreen} />
      <Tab.Screen name="Live Map" component={LiveMapScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
    </Tab.Navigator>
  );
}

function AppStack() {
  const { colors } = useTheme();
  const { isGuest, isAdmin } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        header: (props) => <AppHeader {...props} />,
        contentStyle: { backgroundColor: colors.bgPage },
        freezeOnBlur: false,
        detachPreviousScreen: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={Tabs} />
      <Stack.Screen name="Routes" component={RoutesScreen} options={{ title: 'Routes' }} />
      <Stack.Screen
        name="RouteDetail"
        component={RouteDetailScreen}
        options={({ route }) => ({ title: route.params?.routeName || 'Route' })}
      />
      <Stack.Screen
        name="BusDetail"
        component={BusDetailScreen}
        options={({ route }) => ({ title: route.params?.busName || 'Bus' })}
      />
      <Stack.Screen name="Alerts" component={AlertsScreen} options={{ title: 'Alerts' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />

      {/* Only registered for guests: the sign-in screen */}
      {isGuest && (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false, presentation: 'modal' }}
        />
      )}

      {/* Only registered for admins: the admin panel */}
      {isAdmin && (
        <Stack.Screen name="AdminPanel" component={AdminPanelScreen} options={{ title: 'Admin Panel' }} />
      )}
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isLoading } = useAuth();
  const { colors, isDark } = useTheme();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgPage }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.bgPage,
      card: colors.bgSurface,
      text: colors.textPrimary,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme} ref={navigationRef}>
      <AppStack />
    </NavigationContainer>
  );
}