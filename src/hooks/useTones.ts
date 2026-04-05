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

  // ─── Tone Selection ────────────────────────────────────────
  // (declared before category/tone cycling so they can reference it)

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

  // ─── Category Cycling ──────────────────────────────────────

  // T022 (A9): Category +/- applies first tone of the new category (FR-012)
  const nextCategory = useCallback(() => {
    const nextIdx = (lastCategoryIndex + 1) % categories.length;
    setLastCategoryIndex(nextIdx);
    const firstTone = categories[nextIdx].tones[0];
    if (firstTone) {
      selectToneInternal(firstTone);
    }
  }, [lastCategoryIndex, categories, setLastCategoryIndex, selectToneInternal]);

  const prevCategory = useCallback(() => {
    const prevIdx =
      (lastCategoryIndex - 1 + categories.length) % categories.length;
    setLastCategoryIndex(prevIdx);
    const firstTone = categories[prevIdx].tones[0];
    if (firstTone) {
      selectToneInternal(firstTone);
    }
  }, [lastCategoryIndex, categories, setLastCategoryIndex, selectToneInternal]);

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
  }, [currentCategory, activeTone, selectToneInternal]);

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
  }, [currentCategory, activeTone, selectToneInternal]);

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

  // T012/T013 (A4): Tone resolution helpers for screens (avoids direct engine import)
  const findToneByDT1 = useCallback(
    (category: number, indexHigh: number, indexLow: number) => {
      return catalog.findByDT1(category, indexHigh, indexLow);
    },
    [catalog],
  );

  const findToneById = useCallback(
    (id: string) => {
      return catalog.findById(id);
    },
    [catalog],
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
    findToneByDT1,
    findToneById,
  };
}
