/**
 * System-adaptive high-contrast color palette.
 *
 * Constitution III: System-Adaptive High-Contrast UI
 * - Dark mode: Absolute black #000000 background
 * - Light mode: Pure white #FFFFFF background
 * - WCAG AA contrast ratios MUST be met in both modes
 */

export const palette = {
  // Core backgrounds
  black: '#000000',
  white: '#FFFFFF',

  // Accent — Roland-inspired red (high contrast in both modes)
  accent: '#E53935',
  accentLight: '#FF6F60',
  accentDark: '#AB000D',

  // Neutrals — Dark mode
  gray900: '#121212',
  gray800: '#1E1E1E',
  gray700: '#2C2C2C',
  gray600: '#3D3D3D',
  gray500: '#616161',
  gray400: '#9E9E9E',
  gray300: '#BDBDBD',
  gray200: '#E0E0E0',
  gray100: '#F5F5F5',

  // Semantic
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',

  // Category accents
  categoryPiano: '#42A5F5',
  categoryEPiano: '#AB47BC',
  categoryOther: '#26A69A',
  categoryDrums: '#EF5350',
  categoryGM2: '#FFA726',
} as const;

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  accent: string;
  accentText: string;
  tabBar: string;
  tabBarInactive: string;
  tabBarActive: string;
  statusConnected: string;
  statusDisconnected: string;
  statusScanning: string;
  cardBackground: string;
  cardBackgroundActive: string;
  pillBackground: string;
  pillBackgroundActive: string;
  pillText: string;
  pillTextActive: string;
  favoriteIcon: string;
}

export const darkColors: ThemeColors = {
  background: palette.black,
  surface: palette.gray900,
  surfaceElevated: palette.gray800,
  text: palette.white,
  textSecondary: palette.gray300,
  textTertiary: palette.gray500,
  border: palette.gray700,
  accent: palette.accent,
  accentText: palette.white,
  tabBar: palette.gray900,
  tabBarInactive: palette.gray500,
  tabBarActive: palette.accent,
  statusConnected: palette.success,
  statusDisconnected: palette.error,
  statusScanning: palette.warning,
  cardBackground: palette.gray800,
  cardBackgroundActive: palette.accent,
  pillBackground: palette.gray700,
  pillBackgroundActive: palette.accent,
  pillText: palette.gray300,
  pillTextActive: palette.white,
  favoriteIcon: palette.warning,
};

export const lightColors: ThemeColors = {
  background: palette.white,
  surface: palette.gray100,
  surfaceElevated: palette.white,
  text: palette.black,
  textSecondary: palette.gray600,
  textTertiary: palette.gray400,
  border: palette.gray200,
  accent: palette.accentDark,
  accentText: palette.white,
  tabBar: palette.white,
  tabBarInactive: palette.gray400,
  tabBarActive: palette.accentDark,
  statusConnected: palette.success,
  statusDisconnected: palette.error,
  statusScanning: palette.warning,
  cardBackground: palette.gray100,
  cardBackgroundActive: palette.accentDark,
  pillBackground: palette.gray200,
  pillBackgroundActive: palette.accentDark,
  pillText: palette.gray600,
  pillTextActive: palette.white,
  favoriteIcon: palette.warning,
};
