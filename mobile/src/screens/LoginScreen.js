// mobile/src/screens/LoginScreen.js
import { useState } from 'react';
import { Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthLayout from '../components/AuthLayout';
import AuthField from '../components/AuthField';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen() {
  const navigation = useNavigation();
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
      // This screen unmounts automatically once the user is no longer a guest
    } catch (err) {
      setError(
        err.response
          ? err.response.data?.message || 'Sign in failed.'
          : 'Cannot reach the server. Check your connection and try again.'
      );
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="My Campus Ride" subtitle="Sign in to your account">
      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <AuthField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secure
        placeholder="Your password"
        onSubmitEditing={handleLogin}
      />

      {!!error && <Text style={{ color: colors.critical, fontSize: 13, marginBottom: 10 }}>{error}</Text>}

      <TouchableOpacity
        onPress={handleLogin}
        disabled={busy}
        style={{
          backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14,
          alignItems: 'center', opacity: busy ? 0.7 : 1
        }}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Sign in</Text>}
      </TouchableOpacity>

      {busy && (
        <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 12 }}>
          This can take up to a minute if the server was asleep.
        </Text>
      )}

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ alignItems: 'center', marginTop: 24, paddingVertical: 12 }}
      >
        <Text style={{ fontSize: 14, color: colors.textSecondary }}>← Continue as guest</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}