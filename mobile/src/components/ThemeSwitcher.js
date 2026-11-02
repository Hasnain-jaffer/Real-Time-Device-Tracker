import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { IconSun, IconMoon, IconSmartphone } from './Icons';

const OPTIONS = [
  { key: 'light', label: 'Light', Icon: IconSun },
  { key: 'dark', label: 'Dark', Icon: IconMoon },
  { key: 'system', label: 'System', Icon: IconSmartphone },
];

export default function ThemeSwitcher() {
  const { colors, mode, setMode } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.bgPage, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 3 }}>
      {OPTIONS.map(({ key, label, Icon }) => {
        const active = mode === key;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => setMode(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 9, backgroundColor: active ? colors.accent : 'transparent' }}
          >
            <Icon size={15} color={active ? '#FFFFFF' : colors.textSecondary} />
            <Text style={{ marginLeft: 5, fontSize: 12.5, fontWeight: '600', color: active ? '#FFFFFF' : colors.textSecondary }}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}