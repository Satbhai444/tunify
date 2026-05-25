import { TextStyle } from 'react-native';

export const fonts = {
  headline: 'Lexend_700Bold',
  body: 'Lexend_400Regular',
  label: 'Lexend_600SemiBold',
} as const;

export const typography: Record<string, TextStyle> = {
  displayLg: {
    fontFamily: 'Lexend_800ExtraBold',
    fontSize: 56,
    letterSpacing: -1,
    lineHeight: 64,
  },
  displaySm: {
    fontFamily: 'Lexend_800ExtraBold',
    fontSize: 36,
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  headlineLg: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 32,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  headlineMd: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 24,
    letterSpacing: -0.2,
    lineHeight: 32,
  },
  headlineSm: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 20,
    letterSpacing: -0.1,
    lineHeight: 28,
  },
  titleLg: {
    fontFamily: 'Lexend_700Bold',
    fontSize: 18,
    letterSpacing: 0,
  },
  titleMd: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 16,
    letterSpacing: 0,
  },
  titleSm: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 14,
  },
  bodyLg: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  bodySm: {
    fontFamily: 'Lexend_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  labelLg: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  labelMd: {
    fontFamily: 'Lexend_500Medium',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  labelSm: {
    fontFamily: 'Lexend_600SemiBold',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
};
