/**
 * T062: usePresets Hook — Preset operations for the PRESETS screen.
 *
 * Exposes sorted preset list and actions (create, apply, delete, rename,
 * set default) backed by presetsStore + PresetService.
 *
 * Constitution V: Presentation -> hooks -> services.
 */

import {useCallback, useMemo} from 'react';
import {usePresetsStore} from '../store/presetsStore';
import type {Preset} from '../store/presetsStore';
import {PresetService} from '../services/PresetService';
import {getPianoService} from './usePiano';

// ─── PresetService singleton ────────────────────────────────

let presetServiceInstance: PresetService | null = null;

function getPresetService(): PresetService | null {
  if (presetServiceInstance) return presetServiceInstance;
  const pianoService = getPianoService();
  if (!pianoService) return null;
  presetServiceInstance = new PresetService(pianoService);
  return presetServiceInstance;
}

/** Reset the singleton (used when PianoService changes). */
export function resetPresetService(): void {
  presetServiceInstance = null;
}

// ─── Hook ───────────────────────────────────────────────────

export function usePresets() {
  const allPresets = usePresetsStore((s) => s.presets);

  // Sorted by sortOrder
  const presets = useMemo(
    () => [...allPresets].sort((a, b) => a.sortOrder - b.sortOrder),
    [allPresets],
  );

  /**
   * Create a new preset by capturing the current piano + app state.
   * Returns the new preset ID.
   */
  const createPreset = useCallback((name: string): string | null => {
    const service = getPresetService();
    if (!service) return null;

    const captured = service.captureCurrentState(name);
    return usePresetsStore.getState().createPreset(name, captured);
  }, []);

  /**
   * Apply a preset to the piano via DT1 commands.
   */
  const applyPreset = useCallback(async (preset: Preset): Promise<void> => {
    const service = getPresetService();
    if (!service) return;
    await service.applyPreset(preset);
  }, []);

  /**
   * Delete a preset by ID.
   */
  const deletePreset = useCallback((id: string): void => {
    usePresetsStore.getState().deletePreset(id);
  }, []);

  /**
   * Rename a preset.
   */
  const renamePreset = useCallback((id: string, newName: string): void => {
    usePresetsStore.getState().updatePreset(id, {name: newName});
  }, []);

  /**
   * Set a preset as the default (auto-applied on first connect).
   */
  const setDefault = useCallback((id: string): void => {
    usePresetsStore.getState().setDefault(id);
  }, []);

  /**
   * Clear the default preset.
   */
  const clearDefault = useCallback((): void => {
    usePresetsStore.getState().clearDefault();
  }, []);

  return {
    presets,
    createPreset,
    applyPreset,
    deletePreset,
    renamePreset,
    setDefault,
    clearDefault,
  };
}
