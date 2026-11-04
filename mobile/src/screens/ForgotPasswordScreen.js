import { useState } from 'react';
import { Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../lib/apiClient';
import AuthLayout from '../components/AuthLayout';
import AuthField from '../components/AuthField';
import { useTheme } from '../context/ThemeContext';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    const cleanEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: cleanEmail });
      setSent(true);
    } catch (err) {
      setError(
        err.response
          ? err.response.data?.message || 'Could not send the reset link.'
          : 'Cannot reach the server. Check your connection and try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Reset password" subtitle="We'll email you a link to choose a new password.">
      {sent ? (
        <View style={{ backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 20 }}>
            If an account exists for {email.trim().toLowerCase()}, a reset link is on its way. Open it on this phone to choose a new password.
          </Text>
        </View>
      ) : (
        <>
          <AuthField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            onSubmitEditing={submit}
          />
          {!!error && <Text style={{ color: colors.critical, fontSize: 13, marginBottom: 10 }}>{error}</Text>}
          <TouchableOpacity
            onPress={submit}
            disabled={busy}
            style={{ backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: busy ? 0.7 : 1 }}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Send reset link</Text>}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', marginTop: 22 }}>
        <Text style={{ fontSize: 13.5, fontWeight: '700', color: colors.accent }}>Back to sign in</Text>
      </TouchableOpacity>
    </AuthLayout>
  );
}