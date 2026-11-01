// mobile/src/screens/PlaceholderScreen.js
import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { IconClock } from '../components/Icons';

export default function PlaceholderScreen({ title }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPage, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <IconClock size={32} color={colors.textMuted} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>{title}</Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 8, textAlign: 'center' }}>
        This screen is coming in the next update.
      </Text>
    </View>
  );
}