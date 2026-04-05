/**
 * PianoEngine Interface Contract
 *
 * Defines the contract that every piano engine implementation must fulfill.
 * Each Roland piano model (FP-30X, FP-60X, etc.) provides its own engine
 * that implements this interface.
 *
 * Constitution Principle V: Layered Architecture with Engine Abstraction.
 * The engine encapsulates ALL model-specific protocol knowledge.
 */

// ─── Tone Catalog ─────────────────────────────────────────────

export interface Tone {
  id: string;
  name: string;
  category: number;
  categoryName: string;
  indexHigh: number;
  indexLow: number;
  position: number;
  isGM2: boolean;
}

export interface ToneCategory {
  /** DT1 category byte (0x00–0x08) */
  id: number;
  /** Display name */
  name: string;
  /** Tones in this category, ordered by position */
  tones: Tone[];
}

export interface ToneCatalog {
  /** All categories with their tones */
  categories: ToneCategory[];
  /** Total tone count across all categories */
  totalCount: number;
  /** Find a tone by its DT1 bytes */
  findByDT1(category: number, indexHigh: number, indexLow: number): Tone | undefined;
  /** Find a tone by its string ID */
  findById(id: string): Tone | undefined;
  /** Search tones by name (case-insensitive, across all categories) */
  searchByName(query: string): Tone[];
  /** Get tone at position N from a specific category */
  getToneAtPosition(categoryId: number, position: number): Tone | undefined;
}

// ─── Notification Events ──────────────────────────────────────

export type NotificationEvent =
  | { type: 'tone'; category: number; indexHigh: number; indexLow: number }
  | { type: 'volume'; value: number }
  | { type: 'tempo'; bpm: number }
  | { type: 'metronomeState'; on: boolean }
  | { type: 'metronomeBeat'; value: number }
  | { type: 'metronomePattern'; value: number }
  | { type: 'metronomeVolume'; value: number }
  | { type: 'metronomeTone'; value: number }
  | { type: 'voiceMode'; value: number }
  | { type: 'transpose'; value: number }
  | { type: 'keyTouch'; value: number }
  | { type: 'splitPoint'; value: number }
  | { type: 'balance'; value: number }
  | { type: 'leftTone'; category: number; indexHigh: number; indexLow: number }
  | { type: 'noteOn'; note: number; velocity: number }
  | { type: 'noteOff'; note: number }
  | { type: 'unknown'; address: number[]; data: number[] };

// ─── Device Identity ──────────────────────────────────────────

export interface DeviceIdentity {
  manufacturerId: number;
  deviceId: number;
  familyCode: [number, number];
  modelId: number[];
  firmware?: string;
}

// ─── Piano Engine Interface ───────────────────────────────────

export interface PianoEngine {
  /** Human-readable model name (e.g. "Roland FP-30X") */
  readonly modelName: string;

  /** Access the tone catalog for this piano model */
  readonly tones: ToneCatalog;

  /**
   * Build a DT1 SysEx message to change the active tone.
   * Returns raw SysEx bytes (F0...F7) ready for BLE framing.
   */
  buildToneChange(tone: Tone): number[];

  /**
   * Build a DT1 SysEx message to set volume.
   * @param value 0–127
   */
  buildVolumeChange(value: number): number[];

  /**
   * Build a DT1 SysEx message to set tempo.
   * @param bpm 20–250
   */
  buildTempoChange(bpm: number): number[];

  /**
   * Build a DT1 SysEx message to toggle metronome.
   * Note: FP-30X uses a toggle command (always sends 0x00 to 01 00 05 09),
   * not an explicit on/off value.
   */
  buildMetronomeToggle(): number[];

  /**
   * Build a DT1 SysEx message for a metronome parameter.
   * @param param 'beat' | 'pattern' | 'volume' | 'tone'
   * @param value Parameter-specific value
   */
  buildMetronomeParam(param: 'beat' | 'pattern' | 'volume' | 'tone', value: number): number[];

  /**
   * Build RQ1 SysEx messages to read the piano's initial state.
   * Returns an array of SysEx messages (typically 2: performance block + tempo block).
   * Each message is raw SysEx bytes (F0...F7).
   */
  buildInitialStateRequest(): number[][];

  /**
   * Build an Identity Request SysEx.
   * Used during connection to verify the device is a compatible piano.
   */
  buildIdentityRequest(): number[];

  /**
   * Parse a raw MIDI/SysEx notification from the piano.
   * The input is raw bytes AFTER BLE MIDI framing is stripped
   * (i.e., no BLE header/timestamp bytes — just MIDI content).
   *
   * Returns null if the message is not relevant (e.g., unknown model ID).
   */
  parseNotification(rawMidiBytes: number[]): NotificationEvent | null;

  /**
   * Parse an RQ1 response (DT1 containing requested data).
   * Returns an array of events extracted from the response block.
   * Used to populate initial state on connect.
   */
  parseStateResponse(rawMidiBytes: number[]): NotificationEvent[];

  /**
   * Check if a DeviceIdentity matches this engine's supported model(s).
   */
  supportsDevice(identity: DeviceIdentity): boolean;
}
