/**
 * System-adaptive color palette — T025
 *
 * Constitution v2.0.1, Principle III:
 * - Dark mode: Absolute black #000000 background, glowing display-style text
 * - Light mode: Steel-grey background (brushed metal aesthetic)
 * - WCAG AA contrast ratios MUST be met in both modes
 */

export const palette = {
  // Core
  black: '#000000',
  white: '#FFFFFF',

  // Steel-grey scale (light mode backgrounds)
  steel50: '#F4F5F6',
  steel100: '#E8EAEC',
  steel200: '#D1D4D9',
  steel300: '#B0B5BC',
  steel400: '#8A919A',
  steel500: '#6B737E',
  steel600: '#565D66',
  steel700: '#464C53',
  steel800: '#3C4147',
  steel900: '#35393E',
  steel950: '#1A1C1F',

  // Dark mode neutrals
  gray900: '#0A0A0A',
  gray800: '#141414',
  gray700: '#1E1E1E',
  gray600: '#2A2A2A',
  gray500: '#3D3D3D',

  // Accent colors (WCAG AA validated)
  cyan: '#00BCD4',        // Category names
  orange: '#FF9800',      // Tone names
  green: '#4CAF50',       // Connected
  red: '#F44336',         // Disconnected / error
  grey: '#9E9E9E',        // Idle
  amber: '#FFC107',       // Scanning / warning
  blue: '#2196F3',        // Info / links
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;

  // Display-specific
  displayBackground: string;   // LCD screen background
  displayText: string;         // LCD text color
  categoryText: string;        // Cyan for category names
  toneText: string;            // Orange for tone names

  // Status
  statusConnected: string;
  statusDisconnected: string;
  statusIdle: string;
  statusScanning: string;

  // Controls
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  buttonBackground: string;
  buttonText: string;

  // Favorites
  favoriteActive: string;
}

export const darkColors: ThemeColors = {
  background: palette.black,
  surface: palette.gray900,
  surfaceElevated: palette.gray800,
  text: '#E0E0E0',
  textSecondary: '#9E9E9E',
  textMuted: '#616161',
  border: '#2A2A2A',
  displayBackground: '#0A0F0A',    // Very dark green-black LCD
  displayText: '#00FF88',          // Glowing green LCD text
  categoryText: palette.cyan,
  toneText: palette.orange,
  statusConnected: palette.green,
  statusDisconnected: palette.red,
  statusIdle: palette.grey,
  statusScanning: palette.amber,
  tabBarBackground: palette.gray900,
  tabBarActive: palette.cyan,
  tabBarInactive: '#616161',
  buttonBackground: '#1E1E1E',
  buttonText: '#E0E0E0',
  favoriteActive: palette.amber,
};

export const lightColors: ThemeColors = {
  background: palette.steel100,         // Steel-grey, not white
  surface: palette.steel50,
  surfaceElevated: palette.white,
  text: palette.steel950,
  textSecondary: palette.steel600,
  textMuted: palette.steel400,
  border: palette.steel200,
  displayBackground: palette.steel200,   // Brushed metal LCD area
  displayText: '#1A1C1F',               // Dark text on steel
  categoryText: '#00838F',              // Darker cyan for light mode contrast
  toneText: '#E65100',                  // Darker orange for light mode contrast
  statusConnected: '#2E7D32',           // Darker green
  statusDisconnected: '#C62828',        // Darker red
  statusIdle: palette.steel400,
  statusScanning: '#F57F17',            // Darker amber
  tabBarBackground: palette.steel200,
  tabBarActive: '#00838F',
  tabBarInactive: palette.steel500,
  buttonBackground: palette.steel300,
  buttonText: palette.steel950,
  favoriteActive: '#F57F17',
};
