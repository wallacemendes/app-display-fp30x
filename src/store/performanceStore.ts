/**
 * Performance Zustand Store.
 *
 * T027: Mirrors what has been sent to the piano (runtime-only, not persisted).
 *
 * Constitution II: One-Way State Injector — this store tracks what we've
 * SENT, not what the piano's current state is. There is no read-back.
 */

import {create} from 'zustand';
import {DEFAULTS} from '../services/midi/constants';

export interface PerformanceState {
  /** Currently selected tone ID (null if none) */
  activeToneId: string | null;
  /** Currently applied preset ID (null if none) */
  activePresetId: string | null;
  /** Tone queued before connection (cleared after sending) */
  pendingToneId: string | null;
  /** Current volume (CC 7). Phase 2+ control. */
  volume: number;
  /** Current expression (CC 11). Phase 2+ control. */
  expression: number;
  /** Current pan (CC 10). Phase 2+ control. */
  pan: number;
  /** Current reverb send (CC 91). Phase 2+ control. */
  reverbSend: number;
  /** Current chorus send (CC 93). Phase 2+ control. */
  chorusSend: number;
}

export interface PerformanceActions {
  /** Set the active tone after successful MIDI send */
  setActiveTone: (toneId: string) => void;
  /** Set a pending tone for deferred sending on connect */
  setPendingTone: (toneId: string) => void;
  /** Clear the pending tone (after it's been sent) */
  clearPendingTone: () => void;
  /** Set the active preset */
  setActivePreset: (presetId: string) => void;
  /** Reset all performance state to defaults */
  resetPerformance: () => void;
}

const initialState: PerformanceState = {
  activeToneId: null,
  activePresetId: null,
  pendingToneId: null,
  volume: DEFAULTS.VOLUME,
  expression: DEFAULTS.EXPRESSION,
  pan: DEFAULTS.PAN,
  reverbSend: DEFAULTS.REVERB_SEND,
  chorusSend: DEFAULTS.CHORUS_SEND,
};

export const usePerformanceStore = create<
  PerformanceState & PerformanceActions
>()((set) => ({
  ...initialState,

  setActiveTone: (toneId) =>
    set({activeToneId: toneId, pendingToneId: null}),

  setPendingTone: (toneId) =>
    set({pendingToneId: toneId}),

  clearPendingTone: () =>
    set({pendingToneId: null}),

  setActivePreset: (presetId) =>
    set({activePresetId: presetId}),

  resetPerformance: () =>
    set(initialState),
}));
