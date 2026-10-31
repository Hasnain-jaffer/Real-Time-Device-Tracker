// mobile/src/screens/LoginScreen.js
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { IconBus } from '../components/Icons';

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      setError(
        err.response
          ? err.response.data?.message || 'Login failed.'
          : 'Cannot reach the server. Check your connection and try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  const input = {
    backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, marginBottom: 12,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPage }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <IconBus size={28} color="#FFFFFF" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.textPrimary }}>RoutePulse</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>Track your campus bus in real time</Text>
        </View>

        <TextInput
          style={input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
        />

        {!!error && <Text style={{ color: colors.critical, fontSize: 13, marginBottom: 10 }}>{error}</Text>}

        <TouchableOpacity
          onPress={handleLogin}
          disabled={busy}
          style={{ backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: busy ? 0.7 : 1 }}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Sign in</Text>}
        </TouchableOpacity>

        {busy && (
          <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 12 }}>
            This can take up to a minute if the server was asleep.
          </Text>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}