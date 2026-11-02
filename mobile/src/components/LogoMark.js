import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function LogoMark({ size = 30 }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size * 0.27, backgroundColor: colors.accent,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Ionicons name="bus" size={size * 0.6} color="#FFFFFF" />
    </View>
  );
}