/**
 * App Settings Zustand Store.
 *
 * T023: Persists minimal app-level settings in MMKV.
 * - Theme preference: system/light/dark (Constitution III: System-Adaptive)
 * - Last viewed tone category for restoring UI state
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ToneCategory = 'piano' | 'epiano_keys_organ' | 'other' | 'drums';

export interface AppSettingsState {
  /** User's theme override (default: system) */
  themePreference: ThemePreference;
  /** Last viewed built-in tone category */
  lastUsedCategory: ToneCategory;
}

export interface AppSettingsActions {
  /** Set theme preference */
  setThemePreference: (pref: ThemePreference) => void;
  /** Set last used tone category */
  setLastUsedCategory: (category: ToneCategory) => void;
}

export const useAppSettingsStore = create<
  AppSettingsState & AppSettingsActions
>()(
  persist(
    (set) => ({
      themePreference: 'system',
      lastUsedCategory: 'piano',

      setThemePreference: (pref) =>
        set({themePreference: pref}),

      setLastUsedCategory: (category) =>
        set({lastUsedCategory: category}),
    }),
    {
      name: 'app-settings-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
