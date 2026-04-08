import { TextStyle } from 'react-native';

export const fonts = {
  headline: 'PlusJakartaSans',
  body: 'Inter',
  label: 'Inter',
} as const;

export const typography: Record<string, TextStyle> = {
  displayLg: {
    fontFamily: fonts.headline,
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 64,
  },
  displaySm: {
    fontFamily: fonts.headline,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 44,
  },
  headlineLg: {
    fontFamily: fonts.headline,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 40,
  },
  headlineMd: {
    fontFamily: fonts.headline,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  headlineSm: {
    fontFamily: fonts.headline,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  titleLg: {
    fontFamily: fonts.headline,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  titleMd: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  titleSm: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '600',
  },
  bodyLg: {
    fontFamily: fonts.body,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySm: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  labelLg: {
    fontFamily: fonts.label,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelMd: {
    fontFamily: fonts.label,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  labelSm: {
    fontFamily: fonts.label,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
};
