import { View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { IconBus } from './Icons';

export default function LogoMark({ size = 30 }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.27, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
      <IconBus size={size * 0.58} color="#FFFFFF" />
    </View>
  );
}