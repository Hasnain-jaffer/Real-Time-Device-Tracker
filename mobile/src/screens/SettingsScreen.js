import { View, Text, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import LogoMark from '../components/LogoMark';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { useTheme } from '../context/ThemeContext';
import { API_ORIGIN } from '../config';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const version = Constants.expoConfig?.version || '1.0.0';

  const card = {
    backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1,
    borderRadius: 14, padding: 16, marginBottom: 14,
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPage }} contentContainerStyle={{ padding: 16 }}>
      <View style={card}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Appearance</Text>
        <Text style={{ fontSize: 12.5, color: colors.textMuted, marginTop: 2, marginBottom: 12 }}>
          Choose how RoutePulse looks. "System" follows your phone's setting.
        </Text>
        <ThemeSwitcher />
      </View>

      <View style={card}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LogoMark size={40} />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>RoutePulse</Text>
            <Text style={{ fontSize: 12.5, color: colors.textMuted }}>Version {version}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 12, lineHeight: 19 }}>
          Real-time university bus tracking with live locations, stop alerts and schedule delays.
          Final year project, Sindh Agriculture University, Tandojam.
        </Text>
        <Text style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 12 }}>Server: {API_ORIGIN}</Text>
      </View>
    </ScrollView>
  );
}