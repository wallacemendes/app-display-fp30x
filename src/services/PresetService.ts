/**
 * Preset Service — T061.
 *
 * Converts presets to DT1 commands and applies them via PianoService.
 * Captures current performance state into a Preset object.
 *
 * Constitution IV: DT1 SysEx Protocol Fidelity — all preset fields map to DT1.
 * Constitution V: Services orchestrate engine + transport.
 */

import type {PianoEngine, Tone} from '../engine/types';
import type {PianoService} from './PianoService';
import type {Preset} from '../store/presetsStore';
import {usePerformanceStore} from '../store/performanceStore';
import {useAppSettingsStore} from '../store/appSettingsStore';

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
}
