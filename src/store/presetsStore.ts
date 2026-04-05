/**
 * Presets Zustand Store.
 *
 * Manages user-created MIDI state snapshots, persisted in MMKV.
 * Phase 1 stores only toneId. Phase 2 adds volume, expression, pan, etc.
 *
 * Invariant: At most one preset can have `isDefault = true`.
 */

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {mmkvStorage} from './storage';

export interface Preset {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
  sortOrder: number;
  toneId: string;
  // Phase 2+ fields
  volume: number | null;
  expression: number | null;
  pan: number | null;
  reverbSend: number | null;
  chorusSend: number | null;
}

export interface PresetsState {
  presets: Preset[];
}

export interface PresetsActions {
  /** Add a new preset */
  addPreset: (preset: Omit<Preset, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>) => void;
  /** Update an existing preset */
  updatePreset: (id: string, updates: Partial<Omit<Preset, 'id' | 'createdAt'>>) => void;
  /** Delete a preset */
  deletePreset: (id: string) => void;
  /** Set a preset as the default (clears previous default) */
  setDefault: (id: string) => void;
  /** Clear the default preset */
  clearDefault: () => void;
  /** Reorder presets */
  reorderPresets: (orderedIds: string[]) => void;
  /** Get the default preset (if any) */
  getDefaultPreset: () => Preset | undefined;
}

function generateId(): string {
  return crypto.randomUUID();
}

export const usePresetsStore = create<PresetsState & PresetsActions>()(
  persist(
    (set, get) => ({
      presets: [],

      addPreset: (partial) => {
        const now = new Date().toISOString();
        const newPreset: Preset = {
          ...partial,
          id: generateId(),
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

      getDefaultPreset: () =>
        get().presets.find((p) => p.isDefault),
    }),
    {
      name: 'presets-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
