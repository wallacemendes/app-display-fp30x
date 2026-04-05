import {Platform, type TextStyle} from 'react-native';

/**
 * Typography system.
 *
 * Uses system fonts for maximum performance and native feel.
 * SF Pro on iOS, Roboto on Android.
 */

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const fontFamilyMono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const typography = {
  /** 28px — Screen titles */
  h1: {
    fontFamily,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: 0.36,
  } as TextStyle,

  /** 22px — Section headers */
  h2: {
    fontFamily,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: 0.35,
  } as TextStyle,

  /** 18px — Card titles, category names */
  h3: {
    fontFamily,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,

  /** 16px — Body text */
  body: {
    fontFamily,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    letterSpacing: -0.32,
  } as TextStyle,

  /** 14px — Tone card names, secondary info */
  bodySmall: {
    fontFamily,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.15,
  } as TextStyle,

  /** 12px — Pill labels, badges, metadata */
  caption: {
    fontFamily,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0,
  } as TextStyle,

  /** 10px — Fine print */
  micro: {
    fontFamily,
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
    letterSpacing: 0.1,
  } as TextStyle,

  /** 14px monospace — MIDI debug display */
  mono: {
    fontFamily: fontFamilyMono,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0,
  } as TextStyle,
} as const;
