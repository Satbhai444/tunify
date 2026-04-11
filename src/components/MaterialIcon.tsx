import { MaterialIcons } from '@expo/vector-icons';
import { ViewStyle, StyleProp } from 'react-native';
import { colors } from '../theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface MaterialIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function MaterialIcon({ name, size = 24, color = colors.onSurface, style }: MaterialIconProps) {
  return <MaterialIcons name={name} size={size} color={color} style={style as any} />;
}
