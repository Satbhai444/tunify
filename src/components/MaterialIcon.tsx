import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface MaterialIconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function MaterialIcon({ name, size = 24, color = colors.onSurface }: MaterialIconProps) {
  return <MaterialIcons name={name} size={size} color={color} />;
}
