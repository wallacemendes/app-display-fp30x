/**
 * T051: Favorites Zustand Store (v2 rewrite).
 *
 * Persists user's favorite tones in MMKV with FavoriteTone data model.
 * Supports mixed SN + GM2 tones in the same list.
 * Actions: addFavorite, removeFavorite, isFavorite, reorder, getFavorites.
 *
 * Constitution I: Offline-First — all data stored locally, no network calls.
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

/** A saved favorite tone reference with metadata. */
export interface FavoriteTone {
  /** Tone.id reference (e.g. "0-0-0" or "8-1-5") */
  toneId: string;
  /** ISO 8601 timestamp when added */
  addedAt: string;
  /** Display order (0-based, contiguous) */
  sortOrder: number;
}

export interface FavoritesState {
  /** Array of favorite tone entries, ordered by sortOrder */
  favorites: FavoriteTone[];
}

export interface FavoritesActions {
  /** Add a tone to favorites. Prevents duplicates. Auto-assigns sortOrder. */
  addFavorite: (toneId: string) => void;
  /** Remove a tone from favorites. Re-indexes sortOrder. */
  removeFavorite: (toneId: string) => void;
  /** Check if a tone is in favorites. */
  isFavorite: (toneId: string) => boolean;
  /** Reorder favorites by providing the new ID sequence. */
  reorder: (orderedIds: string[]) => void;
  /** Get all favorites sorted by sortOrder. */
  getFavorites: () => FavoriteTone[];
}

export const useFavoritesStore = create<
  FavoritesState & FavoritesActions
>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (toneId: string) =>
        set((state) => {
          // Prevent duplicates
          if (state.favorites.some((f) => f.toneId === toneId)) {
            return state;
          }

          const newFavorite: FavoriteTone = {
            toneId,
            addedAt: new Date().toISOString(),
            sortOrder: state.favorites.length,
          };

          return {
            favorites: [...state.favorites, newFavorite],
          };
        }),

      removeFavorite: (toneId: string) =>
        set((state) => {
          const filtered = state.favorites.filter((f) => f.toneId !== toneId);
          // Re-index sortOrder to keep it contiguous
          const reindexed = filtered.map((f, index) => ({
            ...f,
            sortOrder: index,
          }));
          return {favorites: reindexed};
        }),

      isFavorite: (toneId: string) =>
        get().favorites.some((f) => f.toneId === toneId),

      reorder: (orderedIds: string[]) =>
        set((state) => {
          const map = new Map(
            state.favorites.map((f) => [f.toneId, f]),
          );
          const reordered: FavoriteTone[] = [];
          for (let i = 0; i < orderedIds.length; i++) {
            const existing = map.get(orderedIds[i]);
            if (existing) {
              reordered.push({...existing, sortOrder: i});
            }
          }
          return {favorites: reordered};
        }),

      getFavorites: () => {
        const {favorites} = get();
        return [...favorites].sort((a, b) => a.sortOrder - b.sortOrder);
      },
    }),
    {
      name: 'favorites-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
