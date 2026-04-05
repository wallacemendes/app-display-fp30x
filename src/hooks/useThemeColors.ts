/**
 * Shared theme hook — resolves system/manual theme preference to colors.
 *
 * Extracted to avoid duplicating the isDark logic across every component.
 * Uses useColorScheme + appSettingsStore.themePreference.
 */

import {useColorScheme} from 'react-native';
import {useAppSettingsStore} from '../store/appSettingsStore';
import {darkColors, lightColors, type ThemeColors} from '../theme/colors';

export function useThemeColors(): ThemeColors {
  const systemScheme = useColorScheme();
  const themePreference = useAppSettingsStore(s => s.themePreference);
  const isDark =
    themePreference === 'dark' ||
    (themePreference === 'system' && systemScheme === 'dark');
  return isDark ? darkColors : lightColors;
}

export function useIsDark(): boolean {
  const systemScheme = useColorScheme();
  const themePreference = useAppSettingsStore(s => s.themePreference);
  return (
    themePreference === 'dark' ||
    (themePreference === 'system' && systemScheme === 'dark')
  );
}
