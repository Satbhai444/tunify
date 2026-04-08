export const colors = {
  // Core
  background: '#0D0D1F',
  surface: '#16162E',
  surfaceContainer: '#1F1F3D',
  surfaceContainerLow: '#121229',
  surfaceContainerHigh: '#28284F',
  surfaceContainerHighest: '#333366',
  surfaceContainerLowest: '#050510',
  surfaceBright: '#3D3D7A',
  surfaceVariant: '#24244D',

  // Primary (Electric Purple)
  primary: '#7B61FF',
  primaryContainer: '#4F39CC',
  primaryDim: '#A594FF',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#E8E4FF',

  // Secondary
  secondary: '#88EBFF',
  secondaryContainer: '#004F5E',
  onSecondary: '#001F26',

  // Tertiary
  tertiary: '#C2D1FF',
  tertiaryContainer: '#2D3F75',

  // Text
  onSurface: '#FFFFFF',
  onSurfaceVariant: '#A5A5C7',
  onBackground: '#FFFFFF',

  // Utility
  outline: '#5C5C8A',
  outlineVariant: '#3D3D5C',
  error: '#FF5C5C',
  errorContainer: '#8B1A1A',
  onError: '#FFFFFF',

  // Inverse
  inverseSurface: '#E1E1F0',
  inverseOnSurface: '#121229',
  inversePrimary: '#7B61FF',

  // Transparent helpers (Glassmorphism)
  primaryAlpha10: 'rgba(123, 97, 255, 0.1)',
  primaryAlpha20: 'rgba(123, 97, 255, 0.2)',
  surfaceAlpha70: 'rgba(22, 22, 46, 0.7)',
  blackAlpha60: 'rgba(0, 0, 0, 0.6)',
  glassAlpha10: 'rgba(255, 255, 255, 0.1)',
  glassAlpha20: 'rgba(255, 255, 255, 0.18)',
} as const;

export type ColorName = keyof typeof colors;
