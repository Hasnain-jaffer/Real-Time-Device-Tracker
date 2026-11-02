import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import apiClient from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function Message({ msg, colors }) {
  if (!msg) return null;
  return (
    <Text style={{ fontSize: 13, marginTop: 10, color: msg.ok ? colors.badgeSuccessText : colors.critical }}>{msg.text}</Text>
  );
}

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { colors } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  const [deleting, setDeleting] = useState(false);

  const card = {
    backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: 1,
    borderRadius: 14, padding: 16, marginBottom: 14,
  };
  const heading = { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 };
  const label = { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 };
  const input = {
    backgroundColor: colors.bgPage, borderColor: colors.border, borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: colors.textPrimary, marginBottom: 12,
  };
  const button = (disabled) => ({
    backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center', opacity: disabled ? 0.6 : 1,
  });

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameMsg({ ok: false, text: 'Name cannot be empty.' });
      return;
    }
    setSavingName(true);
    setNameMsg(null);
    try {
      const { data } = await apiClient.patch('/profile', { name: trimmed });
      updateUser({ name: data.user.name });
      setNameMsg({ ok: true, text: 'Profile updated.' });
    } catch (err) {
      setNameMsg({ ok: false, text: err.response?.data?.message || 'Could not update your profile. Check your connection.' });
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword) {
      setPwMsg({ ok: false, text: 'Fill in both fields.' });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ ok: false, text: 'The new password must be at least 8 characters.' });
      return;
    }
    setSavingPw(true);
    setPwMsg(null);
    try {
      await apiClient.post('/profile/change-password', { currentPassword, newPassword });
      setPwMsg({ ok: true, text: 'Password changed. Signing you out so you can log in again…' });
      setTimeout(() => logout(), 1500);
    } catch (err) {
      setPwMsg({ ok: false, text: err.response?.data?.message || 'Could not change the password.' });
      setSavingPw(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await apiClient.delete('/profile');
      await logout();
    } catch (err) {
      setDeleting(false);
      Alert.alert('Could not delete the account', err.response?.data?.message || 'Check your connection and try again.');
    }
  }

  function confirmDelete() {
    Alert.alert('Delete your account?', 'This permanently deletes your account and cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: deleteAccount },
    ]);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bgPage }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        <View style={[card, { alignItems: 'center' }]}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '700' }}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 10 }}>{user?.name}</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{user?.email}</Text>
          <View style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.badgeSuccessBg }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.badgeSuccessText, textTransform: 'capitalize' }}>{user?.role}</Text>
          </View>
        </View>

        <View style={card}>
          <Text style={heading}>Basic info</Text>
          <Text style={label}>Full name</Text>
          <TextInput style={input} value={name} onChangeText={setName} maxLength={60} placeholder="Your name" placeholderTextColor={colors.textMuted} />
          <Text style={label}>Email</Text>
          <TextInput style={[input, { opacity: 0.6 }]} value={user?.email} editable={false} />
          <TouchableOpacity onPress={saveName} disabled={savingName} style={button(savingName)}>
            {savingName ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Save changes</Text>}
          </TouchableOpacity>
          <Message msg={nameMsg} colors={colors} />
        </View>

        <View style={card}>
          <Text style={heading}>Change password</Text>
          <Text style={label}>Current password</Text>
          <TextInput style={input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" placeholderTextColor={colors.textMuted} />
          <Text style={label}>New password (min. 8 characters)</Text>
          <TextInput style={input} value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" placeholderTextColor={colors.textMuted} />
          <TouchableOpacity onPress={changePassword} disabled={savingPw} style={button(savingPw)}>
            {savingPw ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Update password</Text>}
          </TouchableOpacity>
          <Message msg={pwMsg} colors={colors} />
        </View>

        <TouchableOpacity
          onPress={logout}
          style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgSurface, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 14 }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>Log out</Text>
        </TouchableOpacity>

        <View style={[card, { borderColor: colors.critical }]}>
          <Text style={[heading, { color: colors.critical, marginBottom: 6 }]}>Delete account</Text>
          <Text style={{ fontSize: 12.5, color: colors.textSecondary, marginBottom: 12 }}>
            Permanently removes your account. This cannot be undone.
          </Text>
          <TouchableOpacity onPress={confirmDelete} disabled={deleting} style={{ borderWidth: 1, borderColor: colors.critical, borderRadius: 12, paddingVertical: 12, alignItems: 'center', opacity: deleting ? 0.6 : 1 }}>
            {deleting ? <ActivityIndicator color={colors.critical} /> : <Text style={{ color: colors.critical, fontWeight: '600', fontSize: 14 }}>Delete my account</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}