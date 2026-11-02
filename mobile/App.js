import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { LiveBusesProvider } from './src/context/LiveBusesContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { LocationProvider } from './src/context/LocationContext';
import { DrawerProvider } from './src/context/DrawerContext';
import RootNavigator from './src/navigation/RootNavigator';
import DrawerMenu from './src/components/DrawerMenu';
import InAppBanner from './src/components/InAppBanner';

function ThemedStatusBar() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  // Signed in: the header is dark green, so the icons are light. Login follows the page colour.
  return <StatusBar style={user || isDark ? 'light' : 'dark'} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <LiveBusesProvider>
              <NotificationsProvider>
                <LocationProvider>
                  <DrawerProvider>
                    <RootNavigator />
                    <DrawerMenu />
                    <InAppBanner />
                    <ThemedStatusBar />
                  </DrawerProvider>
                </LocationProvider>
              </NotificationsProvider>
            </LiveBusesProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}