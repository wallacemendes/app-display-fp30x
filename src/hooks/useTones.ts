/**
 * T038: useTones Hook — Tone catalog navigation and actions.
 *
 * Exposes engine tone catalog, category/tone cycling, search,
 * undo, and tone selection via PianoService.
 *
 * Constitution V: Presentation -> hooks -> services.
 * Direct engine access in hooks is permitted (per CLAUDE.md).
 */

import {useCallback, useMemo} from 'react';
import {usePerformanceStore} from '../store/performanceStore';
import {useAppSettingsStore} from '../store/appSettingsStore';
import {getFP30XEngine} from '../engine/registry';
import {getPianoService} from './usePiano';
import type {Tone, ToneCategory} from '../engine/types';

export function useTones() {
  const engine = getFP30XEngine();
  const catalog = engine.tones;
  const categories = catalog.categories;

  // Selective store subscriptions (Constitution: atomic state)
  const activeTone = usePerformanceStore(s => s.activeTone);
  const toneHistory = usePerformanceStore(s => s.toneHistory);
  const lastCategoryIndex = useAppSettingsStore(s => s.lastCategoryIndex);
  const setLastCategoryIndex = useAppSettingsStore(s => s.setLastCategoryIndex);

  // ─── Current Category ──────────────────────────────────────

  const currentCategory: ToneCategory = useMemo(() => {
    // Clamp to valid range
    const idx = Math.max(0, Math.min(lastCategoryIndex, categories.length - 1));
    return categories[idx];
  }, [lastCategoryIndex, categories]);

  // ─── Category Cycling ──────────────────────────────────────

  const nextCategory = useCallback(() => {
    const nextIdx = (lastCategoryIndex + 1) % categories.length;
    setLastCategoryIndex(nextIdx);
  }, [lastCategoryIndex, categories.length, setLastCategoryIndex]);

  const prevCategory = useCallback(() => {
    const prevIdx =
      (lastCategoryIndex - 1 + categories.length) % categories.length;
    setLastCategoryIndex(prevIdx);
  }, [lastCategoryIndex, categories.length, setLastCategoryIndex]);

  // ─── Tone Cycling (within current category) ────────────────

  const nextTone = useCallback(() => {
    const tones = currentCategory.tones;
    if (tones.length === 0) return;

    let currentIdx = -1;
    if (activeTone && activeTone.category === currentCategory.id) {
      currentIdx = tones.findIndex(t => t.id === activeTone.id);
    }

    const nextIdx = (currentIdx + 1) % tones.length;
    const tone = tones[nextIdx];
    selectToneInternal(tone);
  }, [currentCategory, activeTone]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevTone = useCallback(() => {
    const tones = currentCategory.tones;
    if (tones.length === 0) return;

    let currentIdx = 0;
    if (activeTone && activeTone.category === currentCategory.id) {
      currentIdx = tones.findIndex(t => t.id === activeTone.id);
      if (currentIdx === -1) currentIdx = 0;
    }

    const prevIdx = (currentIdx - 1 + tones.length) % tones.length;
    const tone = tones[prevIdx];
    selectToneInternal(tone);
  }, [currentCategory, activeTone]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Tone Selection ────────────────────────────────────────

  const selectToneInternal = useCallback(
    (tone: Tone) => {
      // Optimistic UI update
      usePerformanceStore.getState().setActiveTone(tone);
      // Send DT1 via PianoService (debounced)
      const service = getPianoService();
      if (service) {
        service.changeTone(tone);
      }
    },
    [],
  );

  const selectTone = useCallback(
    (tone: Tone) => {
      selectToneInternal(tone);
    },
    [selectToneInternal],
  );

  // ─── Undo ──────────────────────────────────────────────────

  const undo = useCallback(() => {
    const previous = usePerformanceStore.getState().undo();
    if (previous) {
      // Send DT1 for the restored tone
      const service = getPianoService();
      if (service) {
        service.changeTone(previous);
      }
    }
  }, []);

  // ─── Search ────────────────────────────────────────────────

  const searchByName = useCallback(
    (query: string): Tone[] => {
      if (!query.trim()) return [];
      return catalog.searchByName(query);
    },
    [catalog],
  );

  const searchByNumber = useCallback(
    (num: number): Tone | undefined => {
      // Search across all categories by position
      for (const cat of categories) {
        if (num >= 0 && num < cat.tones.length) {
          return cat.tones[num];
        }
      }
      // Also try finding by absolute index across all tones
      let offset = 0;
      for (const cat of categories) {
        if (num - offset < cat.tones.length) {
          return cat.tones[num - offset];
        }
        offset += cat.tones.length;
      }
      return undefined;
    },
    [categories],
  );

  return {
    categories,
    currentCategory,
    activeTone,
    toneHistory,
    nextTone,
    prevTone,
    nextCategory,
    prevCategory,
    selectTone,
    undo,
    searchByName,
    searchByNumber,
  };
}
