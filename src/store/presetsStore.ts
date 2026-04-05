/**
 * Presets Zustand Store — T059 (v2 rewrite).
 *
 * Manages user-created DT1-based performance state snapshots, persisted in MMKV.
 * Stores full DT1 tone references (category, indexHigh, indexLow), volume,
 * tempo, metronome settings, and app-local quick-tone slot assignments.
 *
 * Invariant: At most one preset can have `isDefault = true`.
 *
 * Constitution I: Offline-First — all data stored locally, no network calls.
 * Constitution IV: DT1 SysEx Protocol Fidelity — tone stored as DT1 bytes.
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

// ─── Types ──────────────────────────────────────────────────

/** DT1 tone reference (3 bytes written to 01 00 02 07). */
export interface DT1ToneRef {
  category: number;
  indexHigh: number;
  indexLow: number;
}

export interface Preset {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  sortOrder: number;
  /** DT1 tone reference */
  tone: DT1ToneRef;
  /** Volume (0-127). DT1 address: 01 00 02 13 */
  volume: number;
  /** Tempo BPM (20-250). DT1 address: 01 00 03 09 */
  tempo: number;
  /** Metronome on/off */
  metronomeOn: boolean;
  /** Metronome beat (0-5). Optional. */
  metronomeBeat?: number;
  /** Metronome pattern (0-7). Optional. */
  metronomePattern?: number;
  /** App-local quick-tone slot assignments (3 slots, tone IDs or null). */
  quickToneSlots: [string | null, string | null, string | null];
  // Phase 3+ (nullable)
  voiceMode?: number;
  leftTone?: DT1ToneRef;
  splitPoint?: number;
  balance?: number;
  transpose?: number;
  keyTouch?: number;
}

// ─── Store Interface ────────────────────────────────────────

export interface PresetsState {
  presets: Preset[];
}

export interface PresetsActions {
  /** Create a new preset. Auto-generates id, timestamps, sortOrder. */
  createPreset: (
    name: string,
    preset: Omit<Preset, 'id' | 'name' | 'createdAt' | 'updatedAt' | 'sortOrder'>,
  ) => string;
  /** Update an existing preset (partial). Sets new updatedAt. */
  updatePreset: (
    id: string,
    updates: Partial<Omit<Preset, 'id' | 'createdAt'>>,
  ) => void;
  /** Delete a preset. Re-indexes sortOrder for remaining presets. */
  deletePreset: (id: string) => void;
  /** Set a preset as the default (clears previous default). */
  setDefault: (id: string) => void;
  /** Clear the default preset. */
  clearDefault: () => void;
  /** Reorder presets by providing an ordered list of IDs. */
  reorderPresets: (orderedIds: string[]) => void;
  /** Get the default preset (if any). */
  getDefaultPreset: () => Preset | undefined;
}

// ─── UUID Generator ─────────────────────────────────────────

let counter = 0;

function generateId(): string {
  // Hermes may have crypto.randomUUID; guard with typeof checks
  // eslint-disable-next-line no-undef
  const g = typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : {};
  const c = g.crypto as {randomUUID?: () => string} | undefined;
  if (c?.randomUUID) {
    return c.randomUUID();
  }
  // Fallback: timestamp + counter
  counter += 1;
  return `${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Store ──────────────────────────────────────────────────

export const usePresetsStore = create<PresetsState & PresetsActions>()(
  persist(
    (set, get) => ({
      presets: [],

      createPreset: (name, partial) => {
        const now = new Date().toISOString();
        const id = generateId();
        const newPreset: Preset = {
          ...partial,
          name,
          id,
          createdAt: now,
          updatedAt: now,
          sortOrder: get().presets.length,
        };
        set((state) => {
          // If new preset is default, unset previous default
          const presets = newPreset.isDefault
            ? state.presets.map((p) => ({...p, isDefault: false}))
            : state.presets;
          return {presets: [...presets, newPreset]};
        });
        return id;
      },

      updatePreset: (id, updates) =>
        set((state) => ({
          presets: state.presets.map((p) =>
            p.id === id
              ? {...p, ...updates, updatedAt: new Date().toISOString()}
              : p,
          ),
        })),

      deletePreset: (id) =>
        set((state) => ({
          presets: state.presets
            .filter((p) => p.id !== id)
            .map((p, i) => ({...p, sortOrder: i})),
        })),

      setDefault: (id) =>
        set((state) => ({
          presets: state.presets.map((p) => ({
            ...p,
            isDefault: p.id === id,
            updatedAt:
              p.id === id || p.isDefault
                ? new Date().toISOString()
                : p.updatedAt,
          })),
        })),

      clearDefault: () =>
        set((state) => ({
          presets: state.presets.map((p) =>
            p.isDefault
              ? {...p, isDefault: false, updatedAt: new Date().toISOString()}
              : p,
          ),
        })),

      reorderPresets: (orderedIds) =>
        set((state) => {
          const byId = new Map(state.presets.map((p) => [p.id, p]));
          return {
            presets: orderedIds
              .map((id) => byId.get(id))
              .filter((p): p is Preset => p !== undefined)
              .map((p, i) => ({...p, sortOrder: i})),
          };
        }),

      getDefaultPreset: () => get().presets.find((p) => p.isDefault),
    }),
    {
      name: 'presets-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
