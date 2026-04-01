/**
 * MMKV Storage Instance.
 *
 * T009: Initialize MMKV for Zustand persist middleware.
 * Used as the persistence engine for all stores that need to survive restarts.
 *
 * Constitution I: Offline-First — all data stored locally, no network calls.
 */

import {createMMKV} from 'react-native-mmkv';
import type {MMKV} from 'react-native-mmkv';
import type {StateStorage} from 'zustand/middleware';

/** Shared MMKV instance. Single instance for all stores (keyed internally). */
export const mmkv: MMKV = createMMKV({
  id: 'fp30x-controller-storage',
});

/**
 * Zustand-compatible StateStorage adapter for MMKV.
 * Provides synchronous setItem/removeItem and synchronous getItem
 * (Zustand persist middleware supports both sync and async).
 */
export const mmkvStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    mmkv.set(name, value);
  },
  removeItem: (name: string): void => {
    mmkv.remove(name);
  },
};
