/**
 * Performance Zustand Store.
 *
 * T022: Live mirror of the piano's current state. Updated by both outbound
 * writes (app -> piano) and inbound DT1 notifications (piano -> app).
 * Runtime-only — not persisted.
 *
 * Constitution II: Bidirectional Control Surface — hardware state wins on
 * conflict. This store reflects the authoritative piano state.
 * Constitution IV: DT1 SysEx Protocol Fidelity — all fields map to DT1
 * addresses documented in roland-sysex-discovery.md.
 */

import {create} from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Tone {
  /** Unique ID: "{category}-{indexHigh}-{indexLow}" e.g. "0-0-0" */
  id: string;
  /** Display name e.g. "Concert Piano" */
  name: string;
  /** DT1 category byte (0x00-0x08) */
  category: number;
  /** DT1 category display name e.g. "Piano", "E.Piano", "GM2" */
  categoryName: string;
  /** DT1 tone index high byte (0x00 for most; 0x01 for GM2 128+) */
  indexHigh: number;
  /** DT1 tone index low byte (0-based within category) */
  indexLow: number;
  /** Position within category (0-based, for +/- cycling) */
  position: number;
  /** Whether this is a GM2 tone (category === 0x08) */
  isGM2: boolean;
}

export interface PerformanceState {
  /** Currently active tone (full Tone object or null) */
  activeTone: Tone | null;
  /** Tone history stack for undo. Most recent at end. Max 50 entries. */
  toneHistory: Tone[];
  /** Currently applied preset ID (null if none) */
  activePresetId: string | null;
  /** Tone queued while disconnected (sent on connect) */
  pendingTone: Tone | null;
  /** Current volume (0-127). DT1 address: 01 00 02 13 */
  volume: number;
  /** Current tempo (BPM 20-250). DT1 address: 01 00 03 09 (2 bytes) */
  tempo: number;
  /** Metronome on/off. Read from: 01 00 01 0F */
  metronomeOn: boolean;
  /** Metronome beat (0=0/4, 1=2/4, 2=3/4, 3=4/4, 4=5/4, 5=6/4).
      DT1 address: 01 00 02 1F */
  metronomeBeat: number;
  /** Metronome pattern (0=Off, 1-7=rhythm subdivisions).
      DT1 address: 01 00 02 20 */
  metronomePattern: number;
  /** Metronome volume (0-10). DT1 address: 01 00 02 21 */
  metronomeVolume: number;
  /** Metronome tone (0=Click, 1=Electronic, 2=Japanese, 3=English).
      DT1 address: 01 00 02 22 */
  metronomeTone: number;
  /** Voice mode (0=Single, 1=Split, 2=Dual, 3=Twin).
      DT1 address: 01 00 02 00. Phase 3+. */
  voiceMode?: number;
  /** Keyboard transpose (center=64, range 58-69 = -6 to +5).
      DT1 address: 01 00 03 07. Phase 3+. */
  transpose?: number;
  /** Key touch (0=Fix..5=Super Heavy).
      DT1 address: 01 00 02 1D. Phase 3+. */
  keyTouch?: number;
  /** Split point (MIDI note number). Phase 3+. */
  splitPoint?: number;
  /** Balance (0-127, center=64). Phase 3+. */
  balance?: number;
  /** Left/Tone2 tone. Phase 3+. */
  leftTone?: Tone | null;
}

export interface PerformanceActions {
  /** Set active tone. Pushes current tone to history (max 50). Clears pending. */
  setActiveTone: (tone: Tone) => void;
  /** Pop the last tone from history, set as active. Returns it, or null if empty. */
  undo: () => Tone | null;
  /** Queue a tone for deferred sending on connect */
  setPendingTone: (tone: Tone) => void;
  /** Clear the pending tone */
  clearPendingTone: () => void;
  /** Set the active preset ID */
  setActivePreset: (presetId: string) => void;
  /** Set volume (0-127) */
  setVolume: (value: number) => void;
  /** Set tempo (BPM 20-250) */
  setTempo: (bpm: number) => void;
  /** Set metronome on/off */
  setMetronomeOn: (on: boolean) => void;
  /** Set metronome beat (0-5) */
  setMetronomeBeat: (value: number) => void;
  /** Set metronome pattern (0-7) */
  setMetronomePattern: (value: number) => void;
  /** Set metronome volume (0-10) */
  setMetronomeVolume: (value: number) => void;
  /** Set metronome tone (0-3) */
  setMetronomeTone: (value: number) => void;
  /** Set voice mode (0-3). Phase 3+. */
  setVoiceMode: (value: number) => void;
  /** Set transpose (58-69). Phase 3+. */
  setTranspose: (value: number) => void;
  /** Set key touch (0-5). Phase 3+. */
  setKeyTouch: (value: number) => void;
  /** Set split point (MIDI note). Phase 3+. */
  setSplitPoint: (value: number) => void;
  /** Set balance (0-127). Phase 3+. */
  setBalance: (value: number) => void;
  /** Set left/tone2 tone. Phase 3+. */
  setLeftTone: (tone: Tone | null) => void;
  /** Reset all performance state to defaults */
  resetPerformance: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_TONE_HISTORY = 50;

const initialState: PerformanceState = {
  activeTone: null,
  toneHistory: [],
  activePresetId: null,
  pendingTone: null,
  volume: 100,
  tempo: 120,
  metronomeOn: false,
  metronomeBeat: 3, // 4/4
  metronomePattern: 0,
  metronomeVolume: 5,
  metronomeTone: 0,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePerformanceStore = create<
  PerformanceState & PerformanceActions
>()((set, get) => ({
  ...initialState,

  setActiveTone: (tone) =>
    set((state) => {
      const history = state.activeTone
        ? [...state.toneHistory, state.activeTone].slice(-MAX_TONE_HISTORY)
        : state.toneHistory;
      return {
        activeTone: tone,
        toneHistory: history,
        pendingTone: null,
      };
    }),

  undo: () => {
    const state = get();
    if (state.toneHistory.length === 0) {
      return null;
    }
    const previous = state.toneHistory[state.toneHistory.length - 1];
    set({
      activeTone: previous,
      toneHistory: state.toneHistory.slice(0, -1),
    });
    return previous;
  },

  setPendingTone: (tone) => set({pendingTone: tone}),

  clearPendingTone: () => set({pendingTone: null}),

  setActivePreset: (presetId) => set({activePresetId: presetId}),

  setVolume: (value) => set({volume: value}),

  setTempo: (bpm) => set({tempo: bpm}),

  setMetronomeOn: (on) => set({metronomeOn: on}),

  setMetronomeBeat: (value) => set({metronomeBeat: value}),

  setMetronomePattern: (value) => set({metronomePattern: value}),

  setMetronomeVolume: (value) => set({metronomeVolume: value}),

  setMetronomeTone: (value) => set({metronomeTone: value}),

  setVoiceMode: (value) => set({voiceMode: value}),

  setTranspose: (value) => set({transpose: value}),

  setKeyTouch: (value) => set({keyTouch: value}),

  setSplitPoint: (value) => set({splitPoint: value}),

  setBalance: (value) => set({balance: value}),

  setLeftTone: (tone) => set({leftTone: tone}),

  resetPerformance: () => set(initialState),
}));
