/**
 * Preset Service — T061 + T082-T084.
 *
 * Converts presets to DT1 commands and applies them via PianoService.
 * Captures current performance state into a Preset object.
 * Exports presets to JSON and imports from JSON with conflict resolution.
 *
 * Constitution I: Offline-First — export uses Share API, no network calls.
 * Constitution IV: DT1 SysEx Protocol Fidelity — all preset fields map to DT1.
 * Constitution V: Services orchestrate engine + transport.
 */

import type {Tone} from '../engine/types';
import type {PianoService} from './PianoService';
import type {Preset} from '../store/presetsStore';
import {usePresetsStore} from '../store/presetsStore';
import {usePerformanceStore} from '../store/performanceStore';
import {useAppSettingsStore} from '../store/appSettingsStore';
import {Share} from 'react-native';

// ─── Export/Import Types (T082) ─────────────────────────────

/**
 * Versioned file format for preset export/import.
 * version: 1 — initial format with full Preset objects.
 */
export interface PresetExportFile {
  version: 1;
  exportedAt: string;
  presets: Preset[];
}

export class PresetService {
  private pianoService: PianoService;

  constructor(pianoService: PianoService) {
    this.pianoService = pianoService;
  }

  /**
   * Apply a preset: build DT1 commands from preset fields, send batch,
   * then restore app-local quick-tone slots.
   */
  async applyPreset(preset: Preset): Promise<void> {
    const engine = this.pianoService.getEngine();
    if (!engine) return;

    const commands: number[][] = [];

    // Build a minimal Tone object for the engine's buildToneChange
    const toneForEngine: Tone = {
      id: `${preset.tone.category}-${preset.tone.indexHigh}-${preset.tone.indexLow}`,
      name: '',
      category: preset.tone.category,
      categoryName: '',
      indexHigh: preset.tone.indexHigh,
      indexLow: preset.tone.indexLow,
      position: 0,
      isGM2: preset.tone.category === 0x08,
    };

    // Tone change
    commands.push(engine.buildToneChange(toneForEngine));

    // Volume
    commands.push(engine.buildVolumeChange(preset.volume));

    // Tempo
    commands.push(engine.buildTempoChange(preset.tempo));

    // Metronome state: if preset wants metronome on but it's currently off
    // (or vice versa), toggle it. FP-30X uses a toggle command.
    const currentMetronome = usePerformanceStore.getState().metronomeOn;
    if (preset.metronomeOn !== currentMetronome) {
      commands.push(engine.buildMetronomeToggle());
    }

    // Metronome beat (if specified)
    if (preset.metronomeBeat !== undefined) {
      commands.push(engine.buildMetronomeParam('beat', preset.metronomeBeat));
    }

    // Metronome pattern (if specified)
    if (preset.metronomePattern !== undefined) {
      commands.push(engine.buildMetronomeParam('pattern', preset.metronomePattern));
    }

    // Send all DT1 commands via PianoService batch apply
    await this.pianoService.applyPreset(commands);

    // Restore app-local quick-tone slots
    const appSettings = useAppSettingsStore.getState();
    preset.quickToneSlots.forEach((slot, i) => {
      appSettings.setQuickToneSlot(i as 0 | 1 | 2, slot);
    });

    // Mark this preset as active in performance store
    usePerformanceStore.getState().setActivePreset(preset.id);
  }

  /**
   * Capture the current piano + app state into a partial Preset object.
   * Caller provides the name; IDs and timestamps are set by presetsStore.createPreset.
   */
  captureCurrentState(name: string): Omit<Preset, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'> {
    const perf = usePerformanceStore.getState();
    const app = useAppSettingsStore.getState();

    return {
      name,
      tone: perf.activeTone
        ? {
            category: perf.activeTone.category,
            indexHigh: perf.activeTone.indexHigh,
            indexLow: perf.activeTone.indexLow,
          }
        : {category: 0, indexHigh: 0, indexLow: 0},
      volume: perf.volume,
      tempo: perf.tempo,
      metronomeOn: perf.metronomeOn,
      metronomeBeat: perf.metronomeBeat,
      metronomePattern: perf.metronomePattern,
      quickToneSlots: [...app.quickToneSlots] as [string | null, string | null, string | null],
      isDefault: false,
    };
  }

  // ─── Export / Import (T083, T084) ──────────────────────────

  /**
   * T083: Export all presets as JSON via the Share API.
   * Returns true if the share dialog was presented, false if no presets exist.
   */
  async exportPresets(): Promise<boolean> {
    const presets = usePresetsStore.getState().presets;
    if (presets.length === 0) return false;

    const exportFile: PresetExportFile = {
      version: 1,
      exportedAt: new Date().toISOString(),
      presets,
    };

    const json = JSON.stringify(exportFile, null, 2);

    await Share.share({
      message: json,
      title: 'FP-30X Presets',
    });

    return true;
  }

  /**
   * T084: Import presets from a JSON string.
   *
   * Validates the version field. On name conflicts, appends " (imported)"
   * to the imported preset's name. Imported presets are never set as default.
   * Returns the count of presets imported.
   */
  importPresets(json: string): number {
    let parsed: PresetExportFile;

    try {
      parsed = JSON.parse(json) as PresetExportFile;
    } catch {
      throw new Error('Invalid JSON format.');
    }

    if (!parsed || parsed.version !== 1) {
      throw new Error('Unsupported preset file version.');
    }

    if (!Array.isArray(parsed.presets) || parsed.presets.length === 0) {
      throw new Error('No presets found in file.');
    }

    const store = usePresetsStore.getState();
    const existingNames = new Set(store.presets.map((p) => p.name));

    let importedCount = 0;

    for (const preset of parsed.presets) {
      // Validate minimum required fields
      if (!preset.name || !preset.tone) continue;

      let name = preset.name;
      if (existingNames.has(name)) {
        name = `${name} (imported)`;
      }

      const {name: _name, id: _id, createdAt: _ca, updatedAt: _ua, sortOrder: _so, ...rest} = preset;
      store.createPreset(name, {
        ...rest,
        isDefault: false, // Never import as default
      });

      existingNames.add(name);
      importedCount++;
    }

    return importedCount;
  }
}
