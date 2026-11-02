import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { navigationRef } from './navigationRef';
import AppHeader from '../components/AppHeader';
import { IconHome, IconBus, IconMap, IconClock } from '../components/Icons';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import BusesScreen from '../screens/BusesScreen';
import LiveMapScreen from '../screens/LiveMapScreen';
import RoutesScreen from '../screens/RoutesScreen';
import RouteDetailScreen from '../screens/RouteDetailScreen';
import BusDetailScreen from '../screens/BusDetailScreen';
import AlertsScreen from '../screens/AlertsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = { Home: IconHome, Buses: IconBus, 'Live Map': IconMap, History: IconClock };
const HistoryPlaceholder = () => <PlaceholderScreen title="History" />;

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
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Buses" component={BusesScreen} />
      <Tab.Screen name="Live Map" component={LiveMapScreen} />
      <Tab.Screen name="History" component={HistoryPlaceholder} />
    </Tab.Navigator>
  );
}

function AppStack() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        header: (props) => <AppHeader {...props} />,
        contentStyle: { backgroundColor: colors.bgPage },
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
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, isLoading } = useAuth();
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
      {user ? (
        <AppStack />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}