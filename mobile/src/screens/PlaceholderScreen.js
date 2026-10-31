// mobile/src/screens/PlaceholderScreen.js
import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function PlaceholderScreen({ title }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bgPage, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>{title}</Text>
      <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>Coming in the next batch</Text>
    </View>
  );
}