/**
 * MIDI Protocol Constants for Roland FP-30X.
 *
 * Source: FP-30X MIDI Implementation document v1.00
 * Constitution IV: MIDI Protocol Fidelity
 */

// ─── BLE MIDI Service ──────────────────────────────────────────
export const BLE_MIDI_SERVICE_UUID =
  '03B80E5A-EDE8-4B33-A751-6CE34EC4C700';
export const BLE_MIDI_CHARACTERISTIC_UUID =
  '7772E5DB-3868-4112-A1A9-F2669D10959A';

// ─── Roland Manufacturer ID ────────────────────────────────────
export const ROLAND_MANUFACTURER_ID = 0x41;
export const FP30X_DEVICE_FAMILY = [0x19, 0x03];

// ─── MIDI Status Bytes (Channel 1 = 0x00 lower nibble) ────────
export const MIDI_STATUS = {
  CONTROL_CHANGE: 0xb0,
  PROGRAM_CHANGE: 0xc0,
} as const;

// ─── Control Change Numbers ────────────────────────────────────
export const CC = {
  BANK_SELECT_MSB: 0,
  MODULATION: 1,
  PORTAMENTO_TIME: 5,
  VOLUME: 7,
  PAN: 10,
  EXPRESSION: 11,
  BANK_SELECT_LSB: 32,
  HOLD_1: 64,
  PORTAMENTO: 65,
  SOSTENUTO: 66,
  SOFT: 67,
  RESONANCE: 71,
  RELEASE_TIME: 72,
  ATTACK_TIME: 73,
  CUTOFF: 74,
  DECAY_TIME: 75,
  VIBRATO_RATE: 76,
  VIBRATO_DEPTH: 77,
  VIBRATO_DELAY: 78,
  REVERB_SEND: 91,
  CHORUS_SEND: 93,
  ALL_SOUNDS_OFF: 120,
  RESET_ALL_CONTROLLERS: 121,
  ALL_NOTES_OFF: 123,
} as const;

// ─── SysEx Templates ──────────────────────────────────────────
/** GM1 System On — resets to General MIDI 1 mode */
export const SYSEX_GM1_SYSTEM_ON: readonly number[] = [
  0xf0, 0x7e, 0x7f, 0x09, 0x01, 0xf7,
];

/** GM2 System On — resets to General MIDI 2 mode (256 voices) */
export const SYSEX_GM2_SYSTEM_ON: readonly number[] = [
  0xf0, 0x7e, 0x7f, 0x09, 0x03, 0xf7,
];

/** Identity Request — used to discover connected MIDI devices */
export const SYSEX_IDENTITY_REQUEST: readonly number[] = [
  0xf0, 0x7e, 0x10, 0x06, 0x01, 0xf7,
];

// ─── Timing ───────────────────────────────────────────────────
/** Minimum delay (ms) after GM1/GM2 System On SysEx */
export const GM_SYSEX_DELAY_MS = 50;

// ─── Default Values ───────────────────────────────────────────
export const DEFAULTS = {
  VOLUME: 100,
  EXPRESSION: 127,
  PAN: 64,
  REVERB_SEND: 40,
  CHORUS_SEND: 0,
} as const;

// ─── MIDI Channel ─────────────────────────────────────────────
/** FP-30X default MIDI channel (0-indexed, channel 1) */
export const MIDI_CHANNEL = 0;
