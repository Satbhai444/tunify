export const colors = {
  // Core
  background: '#0e0e0e',
  surface: '#0e0e0e',
  surfaceContainer: '#1a1a1a',
  surfaceContainerLow: '#131313',
  surfaceContainerHigh: '#20201f',
  surfaceContainerHighest: '#262626',
  surfaceContainerLowest: '#000000',
  surfaceBright: '#2c2c2c',
  surfaceVariant: '#262626',

  // Primary
  primary: '#72fe8f',
  primaryContainer: '#1cb853',
  primaryDim: '#63ef82',
  onPrimary: '#005f26',
  onPrimaryContainer: '#002a0c',

  // Secondary
  secondary: '#7cfbb5',
  secondaryContainer: '#006d42',
  onSecondary: '#005e39',

  // Tertiary
  tertiary: '#88ebff',
  tertiaryContainer: '#0fe3ff',

  // Text
  onSurface: '#ffffff',
  onSurfaceVariant: '#adaaaa',
  onBackground: '#ffffff',

  // Utility
  outline: '#767575',
  outlineVariant: '#484847',
  error: '#ff7351',
  errorContainer: '#b92902',
  onError: '#450900',

  // Inverse
  inverseSurface: '#fcf9f8',
  inverseOnSurface: '#565555',
  inversePrimary: '#006e2d',

  // Transparent helpers
  primaryAlpha10: 'rgba(114, 254, 143, 0.1)',
  primaryAlpha20: 'rgba(114, 254, 143, 0.2)',
  surfaceAlpha70: 'rgba(14, 14, 14, 0.7)',
  blackAlpha60: 'rgba(0, 0, 0, 0.6)',
} as const;

export type ColorName = keyof typeof colors;
