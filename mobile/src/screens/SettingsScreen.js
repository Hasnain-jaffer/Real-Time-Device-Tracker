// mobile/src/screens/SettingsScreen.js
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import LogoMark from '../components/LogoMark';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API_ORIGIN } from '../config';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { isGuest, isAdmin, user } = useAuth();
  const version = Constants.expoConfig?.version || '1.0.0';

  const card = {
    backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1,
    borderRadius: 14, padding: 16, marginBottom: 14,
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPage }} contentContainerStyle={{ padding: 16 }}>

      {/* Appearance */}
      <View style={card}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Appearance</Text>
        <Text style={{ fontSize: 12.5, color: colors.textMuted, marginTop: 2, marginBottom: 12 }}>
          Choose how My Campus Ride looks. "System" follows your phone's setting.
        </Text>
        <ThemeSwitcher />
      </View>

      {/* Account */}
      {isGuest ? (
        <View style={card}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Account</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16, lineHeight: 19 }}>
            You're using the app as a guest. Signing in is optional.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={{ backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Sign in</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={card}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Account</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent,
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                {user?.name?.[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{user?.name}</Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>{user?.email}</Text>
            </View>
          </View>

          {isAdmin && (
            <TouchableOpacity
              onPress={() => navigation.navigate('AdminPanel')}
              style={{
                borderWidth: 1, borderColor: colors.accent, borderRadius: 12,
                paddingVertical: 10, alignItems: 'center', marginBottom: 8
              }}
            >
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600' }}>Open Admin Panel</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={{
              borderWidth: 1, borderColor: colors.border, borderRadius: 12,
              paddingVertical: 10, alignItems: 'center'
            }}
          >
            <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* About */}
      <View style={card}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LogoMark size={40} />
          <View style={{ marginLeft: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>My Campus Ride</Text>
            <Text style={{ fontSize: 12.5, color: colors.textMuted }}>Version {version}</Text>
          </View>
        </View>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 12, lineHeight: 19 }}>
          Real-time university bus tracking with live locations, stop alerts and schedule delays.
          {'\n'}{'\n'}
          Final Year Project, Sindh Agriculture University, Tandojam.
        </Text>
      </View>

      {__DEV__ && (
        <View style={[card, { opacity: 0.7 }]}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>Developer Info</Text>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>Developer: Harry Kaimi</Text>
        </View>
      )}
    </ScrollView>
  );
}