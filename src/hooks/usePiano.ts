/**
 * T044 + T045: usePiano Hook — PianoService singleton access + performance state.
 *
 * Provides PianoService instance to hooks and screens, plus selective
 * subscriptions to performanceStore state and action wrappers.
 *
 * Constitution V: Presentation -> hooks -> services.
 * Constitution IV: DT1 SysEx Protocol Fidelity — all actions route through PianoService.
 */

import {useCallback} from 'react';
import type {PianoService} from '../services/PianoService';
import {usePerformanceStore} from '../store/performanceStore';

/** Singleton PianoService instance, set from App initialization. */
let pianoServiceInstance: PianoService | null = null;

export function setPianoService(service: PianoService): void {
  pianoServiceInstance = service;
}

export function getPianoService(): PianoService | null {
  return pianoServiceInstance;
}

/**
 * T045: React hook exposing performanceStore state + PianoService actions.
 *
 * Uses selective Zustand subscriptions (one per field) to avoid re-renders
 * when unrelated fields change.
 */
export function usePiano() {
  // ─── Selective State Subscriptions ───────────────────────────
  const volume = usePerformanceStore(s => s.volume);
  const tempo = usePerformanceStore(s => s.tempo);
  const metronomeOn = usePerformanceStore(s => s.metronomeOn);
  const metronomeBeat = usePerformanceStore(s => s.metronomeBeat);
  const metronomePattern = usePerformanceStore(s => s.metronomePattern);
  const metronomeVolume = usePerformanceStore(s => s.metronomeVolume);
  const metronomeTone = usePerformanceStore(s => s.metronomeTone);
  const activeTone = usePerformanceStore(s => s.activeTone);

  // ─── Action Wrappers ────────────────────────────────────────

  const changeVolume = useCallback(async (value: number) => {
    const service = getPianoService();
    if (!service) return;
    await service.changeVolume(value);
  }, []);

  const changeTempo = useCallback(async (bpm: number) => {
    const service = getPianoService();
    if (!service) return;
    await service.changeTempo(bpm);
  }, []);

  const toggleMetronome = useCallback(async () => {
    const service = getPianoService();
    if (!service) return;
    await service.toggleMetronome();
  }, []);

  const changeMetronomeParam = useCallback(
    async (param: 'beat' | 'pattern' | 'volume' | 'tone', value: number) => {
      const service = getPianoService();
      if (!service) return;
      await service.changeMetronomeParam(param, value);
    },
    [],
  );

  return {
    // State
    volume,
    tempo,
    metronomeOn,
    metronomeBeat,
    metronomePattern,
    metronomeVolume,
    metronomeTone,
    activeTone,
    // Actions
    changeVolume,
    changeTempo,
    toggleMetronome,
    changeMetronomeParam,
  };
}
