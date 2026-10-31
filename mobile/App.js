// mobile/App.js
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { LiveBusesProvider } from './src/context/LiveBusesContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { LocationProvider } from './src/context/LocationContext';
import RootNavigator from './src/navigation/RootNavigator';
import InAppBanner from './src/components/InAppBanner';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <LiveBusesProvider>
              <NotificationsProvider>
                <LocationProvider>
                  <RootNavigator />
                  <InAppBanner />
                  <StatusBar style="auto" />
                </LocationProvider>
              </NotificationsProvider>
            </LiveBusesProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}