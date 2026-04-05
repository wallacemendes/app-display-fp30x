/**
 * PianoEngine Interface & Shared Engine Types
 *
 * Defines the contract that every piano engine implementation must fulfill.
 * Each Roland piano model (FP-30X, FP-60X, etc.) provides its own engine
 * that implements this interface.
 *
 * Constitution Principle V: Layered Architecture with Engine Abstraction.
 * The engine encapsulates ALL model-specific protocol knowledge.
 *
 * Source of truth: specs/002-fp30x-controller-v2/contracts/piano-engine.ts
 */

// ─── Tone Catalog ─────────────────────────────────────────────

/** A single playable tone (sound) on the piano. */
export interface Tone {
  /** Unique string identifier (e.g. "sn-piano-concert-1") */
  id: string;
  /** Display name (e.g. "Concert Piano 1") */
  name: string;
  /** DT1 category byte (0x00-0x08) */
  category: number;
  /** Human-readable category name (e.g. "Piano") */
  categoryName: string;
  /** DT1 index high byte */
  indexHigh: number;
  /** DT1 index low byte */
  indexLow: number;
  /** Ordinal position within its category (0-based) */
  position: number;
  /** True if this is a GM2 tone, false if SuperNATURAL */
  isGM2: boolean;
}

/** A group of tones belonging to the same instrument category. */
export interface ToneCategory {
  /** DT1 category byte (0x00-0x08) */
  id: number;
  /** Display name (e.g. "Piano", "E.Piano", "Strings") */
  name: string;
  /** Tones in this category, ordered by position */
  tones: Tone[];
}

/** Provides lookup and search operations over the full tone catalog. */
export interface ToneCatalog {
  /** All categories with their tones */
  categories: ToneCategory[];
  /** Total tone count across all categories */
  totalCount: number;

  /**
   * Find a tone by its DT1 bytes.
   * @param category - DT1 category byte
   * @param indexHigh - DT1 index high byte
   * @param indexLow - DT1 index low byte
   * @returns The matching tone, or undefined if not found
   */
  findByDT1(
    category: number,
    indexHigh: number,
    indexLow: number,
  ): Tone | undefined;

  /**
   * Find a tone by its string ID.
   * @param id - Unique tone identifier
   * @returns The matching tone, or undefined if not found
   */
  findById(id: string): Tone | undefined;

  /**
   * Search tones by name (case-insensitive, across all categories).
   * @param query - Search string to match against tone names
   * @returns Array of matching tones
   */
  searchByName(query: string): Tone[];

  /**
   * Get tone at position N from a specific category.
   * @param categoryId - DT1 category byte
   * @param position - Ordinal position within the category (0-based)
   * @returns The tone at that position, or undefined if out of range
   */
  getToneAtPosition(categoryId: number, position: number): Tone | undefined;
}

// ─── Notification Events ──────────────────────────────────────

/**
 * Discriminated union of all events the engine can produce
 * when parsing incoming MIDI/SysEx notifications from the piano.
 *
 * Each variant is distinguished by its `type` field.
 */
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

/** Identity information returned by a MIDI Identity Reply (F0 7E ... F7). */
export interface DeviceIdentity {
  /** Manufacturer ID (Roland = 0x41) */
  manufacturerId: number;
  /** Device ID (default 0x10) */
  deviceId: number;
  /** Device family code (2 bytes, LSB first) */
  familyCode: [number, number];
  /** Model number bytes */
  modelId: number[];
  /** Firmware version string, if available */
  firmware?: string;
}

// ─── Piano Capabilities ──────────────────────────────────────

/**
 * Declares optional hardware capabilities for a piano model.
 * Used by the presentation layer to conditionally show/hide controls.
 */
export interface PianoCapabilities {
  /** Whether the piano supports keyboard split mode */
  hasSplit: boolean;
  /** Whether the piano supports dual (layer) mode */
  hasDual: boolean;
  /** Whether the piano supports twin piano mode */
  hasTwin: boolean;
  /** Whether the piano supports transpose */
  hasTranspose: boolean;
  /** Whether the piano supports key touch sensitivity adjustment */
  hasKeyTouch: boolean;
  /** Maximum volume value (typically 127) */
  maxVolume: number;
  /** Valid tempo range as [min, max] in BPM */
  tempoRange: [number, number];
}

// ─── Piano Engine Interface ───────────────────────────────────

/**
 * The contract every piano engine must implement.
 *
 * An engine encapsulates all model-specific protocol knowledge:
 * SysEx message construction, notification parsing, and tone catalog.
 * Adding support for a new piano model means creating a new engine
 * directory under `src/engine/<model>/` that implements this interface.
 *
 * Constitution Principle V: Engine and Transport MUST NOT depend on each other.
 */
export interface PianoEngine {
  /** Human-readable model name (e.g. "Roland FP-30X") */
  readonly modelName: string;

  /** Access the tone catalog for this piano model */
  readonly tones: ToneCatalog;

  /**
   * Build a DT1 SysEx message to change the active tone.
   * Returns raw SysEx bytes (F0...F7) ready for BLE framing.
   * @param tone - The tone to select
   */
  buildToneChange(tone: Tone): number[];

  /**
   * Build a DT1 SysEx message to set volume.
   * @param value - Volume level (0-127)
   */
  buildVolumeChange(value: number): number[];

  /**
   * Build a DT1 SysEx message to set tempo.
   * @param bpm - Tempo in beats per minute (20-250)
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
   * @param param - Which metronome parameter to set
   * @param value - Parameter-specific value
   */
  buildMetronomeParam(
    param: 'beat' | 'pattern' | 'volume' | 'tone',
    value: number,
  ): number[];

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
   * (i.e., no BLE header/timestamp bytes -- just MIDI content).
   *
   * @param rawMidiBytes - Raw MIDI bytes with BLE framing removed
   * @returns Parsed event, or null if the message is not relevant
   */
  parseNotification(rawMidiBytes: number[]): NotificationEvent | null;

  /**
   * Parse an RQ1 response (DT1 containing requested data).
   * Returns an array of events extracted from the response block.
   * Used to populate initial state on connect.
   *
   * @param rawMidiBytes - Raw MIDI bytes of the RQ1 response
   * @returns Array of events extracted from the response
   */
  parseStateResponse(rawMidiBytes: number[]): NotificationEvent[];

  /**
   * Check if a DeviceIdentity matches this engine's supported model(s).
   * @param identity - The device identity to check
   * @returns True if this engine can handle the identified device
   */
  supportsDevice(identity: DeviceIdentity): boolean;
}
