/**
 * useFavorites Hook.
 *
 * T046: Provides favorite tones resolved from tone data.
 * Looks up tone details by ID from both built-in and GM2 catalogs.
 *
 * Constitution I: Offline-First — all data bundled.
 */

import {useMemo, useCallback} from 'react';
import tones from '../../../data/tones.json';
import gm2Tones from '../../../data/gm2Tones.json';
import {useFavoritesStore} from '../../../store/favoritesStore';
import {usePerformanceStore} from '../../../store/performanceStore';
import {useConnectionStore} from '../../../store/connectionStore';
import {
  sendToneSelection,
  sendGM2ToneSelection,
} from '../../connection/services/MidiService';
import type {Tone} from '../../tones/hooks/useTones';

interface FavoriteTone extends Tone {
  isGM2: boolean;
}

// Build lookup map once at module load
const toneMap = new Map<string, FavoriteTone>();
for (const t of tones as Tone[]) {
  toneMap.set(t.id, {...t, isGM2: false});
}
for (const t of gm2Tones as (Tone & {gmFamily: string})[]) {
  toneMap.set(t.id, {...t, isGM2: true});
}

interface UseFavoritesReturn {
  favorites: FavoriteTone[];
  activeToneId: string | null;
  toggleFavorite: (toneId: string) => void;
  isFavorite: (toneId: string) => boolean;
  selectTone: (tone: FavoriteTone) => void;
}

export function useFavorites(): UseFavoritesReturn {
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const activeToneId = usePerformanceStore((s) => s.activeToneId);

  const favorites = useMemo(
    () =>
      favoriteIds
        .map((id) => toneMap.get(id))
        .filter((t): t is FavoriteTone => t !== undefined),
    [favoriteIds],
  );

  const selectTone = useCallback(async (tone: FavoriteTone) => {
    const isConnected =
      useConnectionStore.getState().status === 'connected';

    if (isConnected) {
      try {
        if (tone.isGM2) {
          await sendGM2ToneSelection(
            tone.bankMSB,
            tone.bankLSB,
            tone.programChange,
          );
        } else {
          await sendToneSelection(
            tone.bankMSB,
            tone.bankLSB,
            tone.programChange,
          );
        }
        usePerformanceStore.getState().setActiveTone(tone.id);
      } catch {
        usePerformanceStore.getState().setPendingTone(tone.id);
      }
    } else {
      usePerformanceStore.getState().setPendingTone(tone.id);
    }
  }, []);

  return {favorites, activeToneId, toggleFavorite, isFavorite, selectTone};
}
