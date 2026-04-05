/**
 * useGM2 Hook.
 *
 * T037: Provides GM2 tones grouped by GM family with tone selection.
 * GM2 tone selection requires SysEx GM2 System On + 50ms delay.
 *
 * Constitution I: Offline-First — all data bundled in gm2Tones.json.
 * Constitution IV: MIDI Protocol Fidelity — GM2 SysEx + 50ms delay.
 */

import {useMemo, useCallback} from 'react';
import gm2Tones from '../../../data/gm2Tones.json';
import {usePerformanceStore} from '../../../store/performanceStore';
import {useConnectionStore} from '../../../store/connectionStore';
import {sendGM2ToneSelection} from '../../connection/services/MidiService';

export interface GM2Tone {
  id: string;
  name: string;
  category: string;
  gmFamily: string;
  bankMSB: number;
  bankLSB: number;
  programChange: number;
}

export interface GM2FamilyGroup {
  family: string;
  tones: GM2Tone[];
}

const allGM2Tones: GM2Tone[] = gm2Tones as GM2Tone[];

interface UseGM2Return {
  groups: GM2FamilyGroup[];
  activeToneId: string | null;
  selectTone: (tone: GM2Tone) => void;
}

/**
 * Hook providing GM2 tones grouped by family, sorted alphabetically.
 */
export function useGM2(): UseGM2Return {
  const activeToneId = usePerformanceStore((s) => s.activeToneId);

  const groups = useMemo(() => {
    const familyMap = new Map<string, GM2Tone[]>();

    for (const tone of allGM2Tones) {
      const existing = familyMap.get(tone.gmFamily);
      if (existing) {
        existing.push(tone);
      } else {
        familyMap.set(tone.gmFamily, [tone]);
      }
    }

    return Array.from(familyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([family, tones]) => ({family, tones}));
  }, []);

  const selectTone = useCallback(async (tone: GM2Tone) => {
    const isConnected =
      useConnectionStore.getState().status === 'connected';

    if (isConnected) {
      try {
        await sendGM2ToneSelection(
          tone.bankMSB,
          tone.bankLSB,
          tone.programChange,
        );
        usePerformanceStore.getState().setActiveTone(tone.id);
      } catch {
        usePerformanceStore.getState().setPendingTone(tone.id);
      }
    } else {
      usePerformanceStore.getState().setPendingTone(tone.id);
    }
  }, []);

  return {groups, activeToneId, selectTone};
}
