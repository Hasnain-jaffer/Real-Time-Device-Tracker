import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { IconEye, IconEyeOff } from './Icons';

export default function AuthField({ label, value, onChangeText, secure = false, ...rest }) {
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(secure);

  return (
    <View style={{ marginBottom: 12 }}>
      {!!label && <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>{label}</Text>}
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSurface,
          borderColor: colors.border, borderWidth: 1, borderRadius: 12,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={hidden}
          placeholderTextColor={colors.textMuted}
          style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary }}
          {...rest}
        />
        {secure && (
          <TouchableOpacity
            onPress={() => setHidden((h) => !h)}
            style={{ paddingHorizontal: 12 }}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            {hidden ? <IconEye size={20} color={colors.textMuted} /> : <IconEyeOff size={20} color={colors.textMuted} />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}