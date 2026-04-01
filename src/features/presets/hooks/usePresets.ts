/**
 * usePresets Hook.
 *
 * T052: Provides preset CRUD operations and batch apply.
 * Batch apply sends all MIDI messages needed to restore piano state.
 *
 * Constitution II: One-Way State Injector — batch-send to restore state.
 * Constitution IV: MIDI Protocol Fidelity — correct sequences.
 */

import {useCallback} from 'react';
import tones from '../../../data/tones.json';
import gm2Tones from '../../../data/gm2Tones.json';
import {usePresetsStore} from '../../../store/presetsStore';
import {usePerformanceStore} from '../../../store/performanceStore';
import {useConnectionStore} from '../../../store/connectionStore';
import {
  sendToneSelection,
  sendGM2ToneSelection,
} from '../../connection/services/MidiService';
import type {Preset} from '../../../store/presetsStore';

// Build tone lookup once
interface ToneData {
  bankMSB: number;
  bankLSB: number;
  programChange: number;
  isGM2: boolean;
}

const toneMap = new Map<string, ToneData>();
for (const t of tones as {id: string; bankMSB: number; bankLSB: number; programChange: number}[]) {
  toneMap.set(t.id, {bankMSB: t.bankMSB, bankLSB: t.bankLSB, programChange: t.programChange, isGM2: false});
}
for (const t of gm2Tones as {id: string; bankMSB: number; bankLSB: number; programChange: number}[]) {
  toneMap.set(t.id, {bankMSB: t.bankMSB, bankLSB: t.bankLSB, programChange: t.programChange, isGM2: true});
}

interface UsePresetsReturn {
  presets: Preset[];
  activePresetId: string | null;
  addPreset: (name: string, toneId: string, isDefault?: boolean) => void;
  deletePreset: (id: string) => void;
  setDefault: (id: string) => void;
  clearDefault: () => void;
  renamePreset: (id: string, name: string) => void;
  applyPreset: (preset: Preset) => Promise<void>;
}

export function usePresets(): UsePresetsReturn {
  const presets = usePresetsStore((s) => s.presets);
  const activePresetId = usePerformanceStore((s) => s.activePresetId);

  const addPreset = useCallback(
    (name: string, toneId: string, isDefault: boolean = false) => {
      usePresetsStore.getState().addPreset({
        name,
        toneId,
        isDefault,
        volume: null,
        expression: null,
        pan: null,
        reverbSend: null,
        chorusSend: null,
      });
    },
    [],
  );

  const deletePreset = useCallback((id: string) => {
    usePresetsStore.getState().deletePreset(id);
  }, []);

  const setDefault = useCallback((id: string) => {
    usePresetsStore.getState().setDefault(id);
  }, []);

  const clearDefault = useCallback(() => {
    usePresetsStore.getState().clearDefault();
  }, []);

  const renamePreset = useCallback((id: string, name: string) => {
    usePresetsStore.getState().updatePreset(id, {name});
  }, []);

  const applyPreset = useCallback(async (preset: Preset) => {
    const isConnected =
      useConnectionStore.getState().status === 'connected';

    if (!isConnected) {
      usePerformanceStore.getState().setPendingTone(preset.toneId);
      return;
    }

    const tone = toneMap.get(preset.toneId);
    if (!tone) {
      return;
    }

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

      usePerformanceStore.getState().setActiveTone(preset.toneId);
      usePerformanceStore.getState().setActivePreset(preset.id);
    } catch {
      usePerformanceStore.getState().setPendingTone(preset.toneId);
    }
  }, []);

  return {
    presets,
    activePresetId,
    addPreset,
    deletePreset,
    setDefault,
    clearDefault,
    renamePreset,
    applyPreset,
  };
}
