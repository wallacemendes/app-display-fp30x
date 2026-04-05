/**
 * Typography system — T026
 *
 * Constitution v2.0.1, Principle III:
 * - LCD/display typeface (Orbitron) for BPM, time sig, tone names
 * - Sans-serif (system font) for body text and labels
 * - Orbitron bundled at assets/fonts/Orbitron-Regular.ttf + Orbitron-Bold.ttf
 */

import {Platform, type TextStyle} from 'react-native';

const fontDisplay = 'Orbitron-Regular';
const fontDisplayBold = 'Orbitron-Bold';
const fontBody = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  /** LCD display — large BPM, main tone name */
  displayLg: {
    fontFamily: fontDisplayBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 1,
  } as TextStyle,

  /** LCD display — medium values (volume, beat) */
  displayMd: {
    fontFamily: fontDisplay,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.5,
  } as TextStyle,

  /** LCD display — small labels (category name, status values) */
  displaySm: {
    fontFamily: fontDisplay,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.5,
  } as TextStyle,

  /** LCD display — tiny (badges, metadata) */
  displayXs: {
    fontFamily: fontDisplay,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
  } as TextStyle,

  /** Body — section headers */
  headingLg: {
    fontFamily: fontBody,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  } as TextStyle,

  /** Body — card titles */
  headingSm: {
    fontFamily: fontBody,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  } as TextStyle,

  /** Body — standard text */
  body: {
    fontFamily: fontBody,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,

  /** Body — small text */
  bodySmall: {
    fontFamily: fontBody,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  } as TextStyle,

  /** Body — labels, buttons */
  label: {
    fontFamily: fontBody,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
} as const;

export const fontFamilies = {
  display: fontDisplay,
  displayBold: fontDisplayBold,
  body: fontBody,
} as const;
