/**
 * useTones Hook.
 *
 * T028: Provides filtered tone list by category with tone selection.
 * Uses useDeferredValue for heavy filtering to maintain 60 FPS.
 *
 * Constitution I: Offline-First — all data bundled in tones.json.
 * Constitution II: One-Way State Injector — selection sends MIDI, no read-back.
 */

import {useMemo, useDeferredValue, useCallback} from 'react';
import tones from '../../../data/tones.json';
import {useAppSettingsStore} from '../../../store/appSettingsStore';
import {usePerformanceStore} from '../../../store/performanceStore';
import {useConnectionStore} from '../../../store/connectionStore';
import {sendToneSelection} from '../../connection/services/MidiService';
import type {ToneCategory} from '../../../store/appSettingsStore';

export interface Tone {
  id: string;
  name: string;
  category: ToneCategory;
  bankMSB: number;
  bankLSB: number;
  programChange: number;
}

const allTones: Tone[] = tones as Tone[];

interface UseTonesReturn {
  tones: Tone[];
  selectedCategory: ToneCategory;
  activeToneId: string | null;
  setCategory: (category: ToneCategory) => void;
  selectTone: (tone: Tone) => void;
}

/**
 * Hook providing category-filtered tone list and selection.
 *
 * - Filters tones by selectedCategory (deferred for performance)
 * - Sends MIDI on selection if connected, queues if disconnected
 * - Persists last-used category across sessions
 */
export function useTones(): UseTonesReturn {
  const selectedCategory = useAppSettingsStore((s) => s.lastUsedCategory);
  const setLastUsedCategory = useAppSettingsStore((s) => s.setLastUsedCategory);
  const activeToneId = usePerformanceStore((s) => s.activeToneId);

  // Defer category for smooth filtering on rapid category switches
  const deferredCategory = useDeferredValue(selectedCategory);

  const filteredTones = useMemo(
    () => allTones.filter((t) => t.category === deferredCategory),
    [deferredCategory],
  );

  const setCategory = useCallback(
    (category: ToneCategory) => {
      setLastUsedCategory(category);
    },
    [setLastUsedCategory],
  );

  const selectTone = useCallback(async (tone: Tone) => {
    const isConnected =
      useConnectionStore.getState().status === 'connected';

    if (isConnected) {
      try {
        await sendToneSelection(
          tone.bankMSB,
          tone.bankLSB,
          tone.programChange,
        );
        usePerformanceStore.getState().setActiveTone(tone.id);
      } catch {
        // If send fails, queue as pending
        usePerformanceStore.getState().setPendingTone(tone.id);
      }
    } else {
      // Queue tone for sending when connected (FR-012c)
      usePerformanceStore.getState().setPendingTone(tone.id);
    }
  }, []);

  return {
    tones: filteredTones,
    selectedCategory,
    activeToneId,
    setCategory,
    selectTone,
  };
}
