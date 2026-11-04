import { useState } from 'react';
import { Text, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../lib/apiClient';
import AuthLayout from '../components/AuthLayout';
import AuthField from '../components/AuthField';
import { useTheme } from '../context/ThemeContext';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    const trimmedName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (trimmedName.length < 2) return setError('Enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('The password must be at least 8 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');

    setError('');
    setBusy(true);
    try {
      await apiClient.post('/auth/register', { name: trimmedName, email: cleanEmail, password });
      setDone(true);
    } catch (err) {
      setError(
        err.response
          ? err.response.data?.message || 'Could not create the account.'
          : 'Cannot reach the server. Check your connection and try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Account created" subtitle="Your account is ready.">
        <View style={{ backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 14, color: colors.textPrimary, lineHeight: 20 }}>
            You can sign in now with {email.trim().toLowerCase()}.
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={{ backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Go to sign in</Text>
        </TouchableOpacity>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create account" subtitle="Track the campus buses in real time">
      <AuthField label="Full name" value={name} onChangeText={setName} placeholder="Your name" maxLength={60} />
      <AuthField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <AuthField label="Password" value={password} onChangeText={setPassword} secure placeholder="At least 8 characters" />
      <AuthField label="Confirm password" value={confirm} onChangeText={setConfirm} secure placeholder="Repeat the password" onSubmitEditing={submit} />

      {!!error && <Text style={{ color: colors.critical, fontSize: 13, marginBottom: 10 }}>{error}</Text>}

      <TouchableOpacity
        onPress={submit}
        disabled={busy}
        style={{ backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: busy ? 0.7 : 1 }}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Create account</Text>}
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 22 }}>
        <Text style={{ fontSize: 13.5, color: colors.textSecondary }}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={{ fontSize: 13.5, fontWeight: '700', color: colors.accent }}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}