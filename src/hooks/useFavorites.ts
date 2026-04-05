/**
 * T053: useFavorites Hook — Resolved favorite tones.
 *
 * Exposes favorites resolved to full Tone objects via engine catalog.
 * Provides toggle and isFavorite helpers for UI components.
 * Stale IDs (tones removed from catalog) are silently filtered out.
 *
 * Constitution V: Presentation -> hooks -> services.
 */

import {useCallback, useMemo} from 'react';
import {useFavoritesStore} from '../store/favoritesStore';
import {getFP30XEngine} from '../engine/registry';
import type {Tone} from '../engine/types';

export function useFavorites() {
  const favorites = useFavoritesStore((s) => s.favorites);
  const addFavorite = useFavoritesStore((s) => s.addFavorite);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const isFavoriteInStore = useFavoritesStore((s) => s.isFavorite);

  // Resolve FavoriteTone.toneId to full Tone objects via engine catalog.
  // Filters out stale IDs that no longer exist in the catalog.
  const resolvedFavorites: Tone[] = useMemo(() => {
    const engine = getFP30XEngine();
    const catalog = engine.tones;
    const resolved: Tone[] = [];

    // Sort by sortOrder then resolve
    const sorted = [...favorites].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const fav of sorted) {
      const tone = catalog.findById(fav.toneId);
      if (tone) {
        resolved.push(tone);
      }
    }

    return resolved;
  }, [favorites]);

  const toggleFavorite = useCallback(
    (toneId: string) => {
      if (isFavoriteInStore(toneId)) {
        removeFavorite(toneId);
      } else {
        addFavorite(toneId);
      }
    },
    [isFavoriteInStore, addFavorite, removeFavorite],
  );

  const isFavorite = useCallback(
    (toneId: string): boolean => {
      return isFavoriteInStore(toneId);
    },
    [isFavoriteInStore],
  );

  return {favorites: resolvedFavorites, toggleFavorite, isFavorite};
}
