/**
 * FP-30X Piano Engine Implementation.
 *
 * Implements the PianoEngine interface for the Roland FP-30X.
 * Encapsulates all FP-30X-specific protocol knowledge: DT1/RQ1 builders,
 * notification parser, and tone catalog.
 *
 * Constitution V: Layered Architecture with Engine Abstraction.
 */

import type {
  PianoEngine,
  Tone,
  ToneCatalog,
  NotificationEvent,
  DeviceIdentity,
} from '../types';
import {buildDT1, buildRQ1, buildIdentityRequest, encodeTempo} from './sysex';
import {parseNotification, parseStateResponse} from './parser';
import {fp30xToneCatalog} from './tones';
import {ADDR, PERFORMANCE_BLOCK_ADDR, PERFORMANCE_BLOCK_SIZE, TEMPO_BLOCK_ADDR, TEMPO_BLOCK_SIZE, TRANSPOSE_BLOCK_ADDR, TRANSPOSE_BLOCK_SIZE} from './addresses';
import {FP30X_MODEL_ID, FP30X_MODEL_NAME, ROLAND_MANUFACTURER_ID} from './constants';

export class FP30XEngine implements PianoEngine {
  readonly modelName = FP30X_MODEL_NAME;
  readonly tones: ToneCatalog = fp30xToneCatalog;

  buildToneChange(tone: Tone): number[] {
    return buildDT1(ADDR.TONE_CATEGORY, [tone.category, tone.indexHigh, tone.indexLow]);
  }

  buildVolumeChange(value: number): number[] {
    const clamped = Math.max(0, Math.min(127, Math.round(value)));
    return buildDT1(ADDR.VOLUME, [clamped]);
  }

  buildTempoChange(bpm: number): number[] {
    const [byte1, byte2] = encodeTempo(bpm);
    return buildDT1(ADDR.TEMPO, [byte1, byte2]);
  }

  buildMetronomeToggle(): number[] {
    // FP-30X uses a toggle command: always sends 0x00 to 01 00 05 09
    return buildDT1(ADDR.METRONOME_TOGGLE, [0x00]);
  }

  buildMetronomeParam(
    param: 'beat' | 'pattern' | 'volume' | 'tone',
    value: number,
  ): number[] {
    switch (param) {
      case 'beat':
        return buildDT1(ADDR.METRONOME_BEAT, [value]);
      case 'pattern':
        return buildDT1(ADDR.METRONOME_PATTERN, [value]);
      case 'volume':
        return buildDT1(ADDR.METRONOME_VOLUME, [Math.max(0, Math.min(10, value))]);
      case 'tone':
        return buildDT1(ADDR.METRONOME_TONE, [Math.max(0, Math.min(3, value))]);
    }
  }

  // ─── Phase 3: Split/Dual/Transpose/KeyTouch (T071, T074) ───

  /** Build DT1 to set voice mode (0=Single, 1=Split, 2=Dual, 3=Twin). */
  buildVoiceModeChange(mode: number): number[] {
    return buildDT1(ADDR.VOICE_MODE, [Math.max(0, Math.min(3, mode))]);
  }

  /** Build DT1 to set left/Tone2 tone (for Split/Dual modes). */
  buildLeftToneChange(tone: Tone): number[] {
    return buildDT1(ADDR.LEFT_TONE_CATEGORY, [tone.category, tone.indexHigh, tone.indexLow]);
  }

  /** Build DT1 to set split point (MIDI note number). */
  buildSplitPointChange(note: number): number[] {
    return buildDT1(ADDR.SPLIT_POINT, [Math.max(0, Math.min(127, note))]);
  }

  /** Build DT1 to set balance (0-127, center=64). */
  buildBalanceChange(value: number): number[] {
    return buildDT1(ADDR.BALANCE, [Math.max(0, Math.min(127, value))]);
  }

  /** Build DT1 to set keyboard transpose (center=64, range 58-69 = -6 to +5). */
  buildTransposeChange(value: number): number[] {
    return buildDT1(ADDR.TRANSPOSE, [Math.max(58, Math.min(69, value))]);
  }

  /** Build DT1 to set key touch (0=Fix, 1=SuperLight, 2=Light, 3=Medium, 4=Heavy, 5=SuperHeavy). */
  buildKeyTouchChange(level: number): number[] {
    return buildDT1(ADDR.KEY_TOUCH, [Math.max(0, Math.min(5, level))]);
  }

  buildInitialStateRequest(): number[][] {
    return [
      // Performance block: voice mode, tones, volume, key touch, metronome params
      buildRQ1(PERFORMANCE_BLOCK_ADDR, PERFORMANCE_BLOCK_SIZE),
      // Tempo block: 2-byte tempo
      buildRQ1(TEMPO_BLOCK_ADDR, TEMPO_BLOCK_SIZE),
      // Transpose: 1 byte
      buildRQ1(TRANSPOSE_BLOCK_ADDR, TRANSPOSE_BLOCK_SIZE),
    ];
  }

  buildIdentityRequest(): number[] {
    return buildIdentityRequest();
  }

  parseNotification(rawMidiBytes: number[]): NotificationEvent | null {
    return parseNotification(rawMidiBytes);
  }

  parseStateResponse(rawMidiBytes: number[]): NotificationEvent[] {
    return parseStateResponse(rawMidiBytes);
  }

  supportsDevice(identity: DeviceIdentity): boolean {
    return (
      identity.manufacturerId === ROLAND_MANUFACTURER_ID &&
      identity.modelId.length === FP30X_MODEL_ID.length &&
      identity.modelId.every((b, i) => b === FP30X_MODEL_ID[i])
    );
  }
}
