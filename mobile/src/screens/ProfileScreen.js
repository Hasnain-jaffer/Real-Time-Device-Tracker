// mobile/src/screens/ProfileScreen.js
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../lib/apiClient';
import { IconUser, IconLock, IconEdit, IconChevronRight, IconLogout } from '../components/Icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, mode, setThemeMode } = useTheme();

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveName() {
    if (!name.trim()) return;
    setSavingName(true);
    try {
      await apiClient.patch('/profile', { name: name.trim() });
      // AuthContext doesn't have updateUser, so we rely on next login or manual refresh
      Alert.alert('Success', 'Name updated. It will show on your next login.');
      setEditingName(false);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not update name.');
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Fill in all password fields.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      await apiClient.post('/profile/change-password', { currentPassword, newPassword });
      Alert.alert('Success', 'Password changed successfully.');
      setShowPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not change password.');
    } finally {
      setSavingPassword(false);
    }
  }

  const card = { backgroundColor: colors.bgSurface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 };
  const input = { backgroundColor: colors.bgPage, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textPrimary, marginTop: 8 };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bgPage }} contentContainerStyle={{ padding: 16 }}>
      {/* Avatar & Basic Info */}
      <View style={[card, { alignItems: 'center', paddingVertical: 24 }]}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '700' }}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>{user?.name}</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{user?.email}</Text>
        <View style={{ marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.badgeSuccessBg }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.badgeSuccessText, textTransform: 'capitalize' }}>{user?.role}</Text>
        </View>
      </View>

      {/* Edit Name */}
      <View style={card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconUser size={18} color={colors.accent} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginLeft: 10 }}>Display Name</Text>
          </View>
          <TouchableOpacity onPress={() => setEditingName(!editingName)}>
            <IconEdit size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        {editingName ? (
          <View style={{ marginTop: 12 }}>
            <TextInput style={input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.textMuted} />
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity
                onPress={handleSaveName}
                disabled={savingName}
                style={{ flex: 1, backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginRight: 8, opacity: savingName ? 0.7 : 1 }}
              >
                {savingName ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Save</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setEditingName(false); setName(user?.name || ''); }}
                style={{ flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: '600', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8 }}>{user?.name}</Text>
        )}
      </View>

      {/* Change Password */}
      <View style={card}>
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconLock size={18} color={colors.accent} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginLeft: 10 }}>Change Password</Text>
          </View>
          <IconChevronRight size={16} color={colors.textMuted} style={{ transform: [{ rotate: showPassword ? '90deg' : '0deg' }] }} />
        </TouchableOpacity>

        {showPassword && (
          <View style={{ marginTop: 12 }}>
            <TextInput style={input} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current password" placeholderTextColor={colors.textMuted} secureTextEntry />
            <TextInput style={input} value={newPassword} onChangeText={setNewPassword} placeholder="New password (min 8 chars)" placeholderTextColor={colors.textMuted} secureTextEntry />
            <TextInput style={input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" placeholderTextColor={colors.textMuted} secureTextEntry />
            <TouchableOpacity
              onPress={handleChangePassword}
              disabled={savingPassword}
              style={{ marginTop: 12, backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center', opacity: savingPassword ? 0.7 : 1 }}
            >
              {savingPassword ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Theme Preference */}
      <View style={card}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>Appearance</Text>
        <View style={{ flexDirection: 'row', backgroundColor: colors.bgPage, borderRadius: 10, padding: 4 }}>
          {['light', 'dark', 'system'].map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setThemeMode(m)}
              style={{ flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: mode === m ? colors.accent : 'transparent' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: mode === m ? '#fff' : colors.textSecondary, textTransform: 'capitalize' }}>
                {m === 'system' ? 'Auto' : m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        onPress={logout}
        style={[card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderColor: colors.critical }]}
      >
        <IconLogout size={18} color={colors.critical} />
        <Text style={{ color: colors.critical, fontSize: 15, fontWeight: '600', marginLeft: 8 }}>Log out</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 16, marginBottom: 24 }}>
        RoutePulse v1.0.0{'\n'}My Campus Ride - Final Year Project
      </Text>
    </ScrollView>
  );
}