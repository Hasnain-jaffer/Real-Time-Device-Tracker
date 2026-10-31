// mobile/src/screens/ProfileScreen.js
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_ORIGIN } from '../config';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPage, padding: 16 }}>
      <View style={{ backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 18 }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
        </View>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>{user?.name}</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{user?.email}</Text>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6, textTransform: 'capitalize' }}>Role: {user?.role}</Text>
      </View>

      <TouchableOpacity
        onPress={logout}
        style={{ marginTop: 16, borderWidth: 1, borderColor: colors.critical, borderRadius: 12, paddingVertical: 13, alignItems: 'center' }}
      >
        <Text style={{ color: colors.critical, fontSize: 15, fontWeight: '600' }}>Log out</Text>
      </TouchableOpacity>

      <Text style={{ color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 20 }}>Server: {API_ORIGIN}</Text>
    </View>
  );
}