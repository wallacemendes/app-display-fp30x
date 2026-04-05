/**
 * App Settings Zustand Store.
 *
 * T023: Persists app-level user preferences in MMKV.
 * - Theme preference: system/light/dark (Constitution III: System-Adaptive)
 * - Last viewed tone category index (DT1 category 0-8)
 * - Default preset for auto-apply on first connect
 * - Quick-tone slot assignments (3 slots)
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface AppSettingsState {
  /** User's theme override (default: system) */
  themePreference: ThemePreference;
  /** Last viewed tone category index (DT1 category 0-8). Default: 0 (Piano) */
  lastCategoryIndex: number;
  /** Default preset ID for auto-apply on first connect (null = none) */
  defaultPresetId: string | null;
  /** Quick-tone slot assignments (3 slots). Each is a tone ID or null. */
  quickToneSlots: [string | null, string | null, string | null];
}

export interface AppSettingsActions {
  /** Set theme preference */
  setThemePreference: (pref: ThemePreference) => void;
  /** Set last used tone category index (0-8) */
  setLastCategoryIndex: (index: number) => void;
  /** Set the default preset ID */
  setDefaultPresetId: (presetId: string | null) => void;
  /** Set a quick-tone slot (0-2) to a tone ID or null */
  setQuickToneSlot: (slot: 0 | 1 | 2, toneId: string | null) => void;
}

export const useAppSettingsStore = create<
  AppSettingsState & AppSettingsActions
>()(
  persist(
    (set) => ({
      themePreference: 'system',
      lastCategoryIndex: 0,
      defaultPresetId: null,
      quickToneSlots: [null, null, null] as [
        string | null,
        string | null,
        string | null,
      ],

      setThemePreference: (pref) => set({themePreference: pref}),

      setLastCategoryIndex: (index) => set({lastCategoryIndex: index}),

      setDefaultPresetId: (presetId) => set({defaultPresetId: presetId}),

      setQuickToneSlot: (slot, toneId) =>
        set((state) => {
          const slots = [...state.quickToneSlots] as [
            string | null,
            string | null,
            string | null,
          ];
          slots[slot] = toneId;
          return {quickToneSlots: slots};
        }),
    }),
    {
      name: 'app-settings-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
