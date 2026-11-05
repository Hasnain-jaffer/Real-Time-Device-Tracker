// mobile/App.js
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BackHandler, Alert } from 'react-native';
import { useEffect } from 'react';
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
import * as SystemUI from 'expo-system-ui';

function ThemedStatusBar() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  return <StatusBar style={user || isDark ? 'light' : 'dark'} />;
}

function ThemedRootBackground() {
  const { colors } = useTheme();
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bgPage);
  }, [colors.bgPage]);
  return null;
}

// FIX: Handle Android back button to exit app properly
function useBackHandler() {
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Let React Navigation handle back first
      // If we're on root screen, this will exit the app
      return false;
    });

    return () => backHandler.remove();
  }, []);
}

export default function App() {
  useBackHandler();

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
                    <ThemedRootBackground />
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