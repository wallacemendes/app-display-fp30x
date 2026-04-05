/**
 * Favorites Zustand Store.
 *
 * Persists user's favorite tone IDs in MMKV.
 * Simple toggle-based collection: add/remove tone IDs.
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

export interface FavoritesState {
  /** Array of favorite tone IDs */
  ids: string[];
}

export interface FavoritesActions {
  /** Toggle a tone ID in/out of favorites */
  toggleFavorite: (toneId: string) => void;
  /** Check if a tone ID is in favorites */
  isFavorite: (toneId: string) => boolean;
}

export const useFavoritesStore = create<
  FavoritesState & FavoritesActions
>()(
  persist(
    (set, get) => ({
      ids: [],

      toggleFavorite: (toneId) =>
        set((state) => {
          const exists = state.ids.includes(toneId);
          return {
            ids: exists
              ? state.ids.filter((id) => id !== toneId)
              : [...state.ids, toneId],
          };
        }),

      isFavorite: (toneId) => get().ids.includes(toneId),
    }),
    {
      name: 'favorites-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
