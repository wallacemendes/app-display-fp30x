/**
 * T077: Pad Configuration Zustand Store.
 *
 * Manages 8 assignable performance pads (4x2 grid). Each pad can hold
 * a sequence of DT1 commands (tone, volume, tempo, metronomeToggle, voiceMode)
 * that execute in order when tapped.
 *
 * Persisted via MMKV for offline-first operation.
 *
 * Constitution I: Offline-First — all pad config stored locally.
 * Constitution IV: DT1 SysEx Protocol Fidelity — commands map to DT1 addresses.
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

// ─── Types ──────────────────────────────────────────────────

/**
 * A single DT1 command to execute when a pad is tapped.
 *
 * - tone: builds DT1 write to TONE_CATEGORY with {category, indexHigh, indexLow}
 * - volume: builds DT1 write to VOLUME with {value} (0-127)
 * - tempo: builds DT1 write to TEMPO with {value} (20-250)
 * - metronomeToggle: builds DT1 toggle (no params needed, but params kept for uniformity)
 * - voiceMode: builds DT1 write to VOICE_MODE with {value} (0-3)
 */
export interface DT1Command {
  type: 'tone' | 'volume' | 'tempo' | 'metronomeToggle' | 'voiceMode';
  params: Record<string, number>;
}

/** Configuration for a single performance pad. */
export interface PadConfig {
  /** Unique pad ID: "pad-0" through "pad-7" */
  id: string;
  /** User-assigned label */
  label: string;
  /** Accent color hex */
  color: string;
  /** Sequence of DT1 commands to execute on tap */
  commands: DT1Command[];
}

// ─── Store Interface ────────────────────────────────────────

export interface PadConfigState {
  pads: PadConfig[];
}

export interface PadConfigActions {
  /** Update a pad's configuration (partial). */
  updatePad: (id: string, updates: Partial<Omit<PadConfig, 'id'>>) => void;
  /** Get a pad by its ID. */
  getPad: (id: string) => PadConfig | undefined;
}

// ─── Default Pads ───────────────────────────────────────────

const DEFAULT_PAD_COLOR = '#4A90D9';

function createDefaultPads(): PadConfig[] {
  return Array.from({length: 8}, (_, i) => ({
    id: `pad-${i}`,
    label: `PAD ${i + 1}`,
    color: DEFAULT_PAD_COLOR,
    commands: [],
  }));
}

// ─── Store ──────────────────────────────────────────────────

export const usePadConfigStore = create<PadConfigState & PadConfigActions>()(
  persist(
    (set, get) => ({
      pads: createDefaultPads(),

      updatePad: (id, updates) =>
        set((state) => ({
          pads: state.pads.map((pad) =>
            pad.id === id ? {...pad, ...updates} : pad,
          ),
        })),

      getPad: (id) => get().pads.find((pad) => pad.id === id),
    }),
    {
      name: 'pad-config-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
