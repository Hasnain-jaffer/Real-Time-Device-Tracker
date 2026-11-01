// mobile/src/navigation/RootNavigator.js
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationsContext';
import DrawerContent from '../components/DrawerContent';
import { IconMenu, IconBell } from '../components/Icons';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import LiveMapScreen from '../screens/LiveMapScreen';
import RoutesScreen from '../screens/RoutesScreen';
import RouteDetailScreen from '../screens/RouteDetailScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import BusesScreen from '../screens/BusesScreen';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Home: 'home-outline',
  'Live Map': 'map-outline',
  Buses: 'bus-outline',
  Routes: 'trail-sign-outline',
  Alerts: 'notifications-outline',
  Profile: 'person-outline',
};

// Header right: notification bell
function HeaderRight({ navigation }) {
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
  return (
    <TouchableOpacity onPress={() => navigation.navigate('Alerts')} style={{ marginRight: 16, position: 'relative' }}>
      <IconBell size={22} color="#FFFFFF" />
      {unreadCount > 0 && (
        <View style={{ position: 'absolute', top: -4, right: -6, backgroundColor: colors.critical, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Header left: hamburger menu
function HeaderLeft({ navigation }) {
  return (
    <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ marginLeft: 16 }}>
      <IconMenu size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

function Tabs({ navigation }) {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.bgSidebar },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
        headerLeft: () => <HeaderLeft navigation={navigation} />,
        headerRight: () => <HeaderRight navigation={navigation} />,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.bgSurface, borderTopColor: colors.border },
        tabBarIcon: ({ color, size }) => <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Live Map" component={LiveMapScreen} />
      <Tab.Screen name="Buses" component={BusesScreen} />
      <Tab.Screen name="Routes" component={RoutesStack} options={{ headerShown: false }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RoutesStack({ navigation }) {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgSidebar },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
        headerLeft: () => <HeaderLeft navigation={navigation} />,
        headerRight: () => <HeaderRight navigation={navigation} />,
        contentStyle: { backgroundColor: colors.bgPage },
      }}
    >
      <Stack.Screen name="RoutesList" component={RoutesScreen} options={{ title: 'Routes' }} />
      <Stack.Screen
        name="RouteDetail"
        component={RouteDetailScreen}
        options={({ route }) => ({ title: route.params?.routeName || 'Route' })}
      />
    </Stack.Navigator>
  );
}

function MainDrawer() {
  const { colors } = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bgSidebar },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
        headerLeft: () => null,
        drawerType: 'front',
        drawerStyle: { width: 300 },
      }}
    >
      <Drawer.Screen name="MainTabs" component={Tabs} options={{ headerShown: false }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Drawer.Screen name="History" component={PlaceholderScreen} options={{ title: 'History' }} />
    </Drawer.Navigator>
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
    <NavigationContainer theme={navTheme}>
      {user ? (
        <MainDrawer />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}