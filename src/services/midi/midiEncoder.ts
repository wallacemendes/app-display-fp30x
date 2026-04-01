/**
 * MIDI Message Encoder for FP-30X.
 *
 * Constructs raw MIDI byte arrays for CC, PC, and SysEx messages.
 * Constitution IV: MIDI Protocol Fidelity — exact byte sequences per MIDI Implementation doc.
 *
 * All values are clamped to valid MIDI range (0–127).
 * Channel is 0-indexed (0 = MIDI channel 1).
 */

import {
  CC,
  MIDI_STATUS,
  SYSEX_GM2_SYSTEM_ON,
} from './constants';

/** Clamp a number to the valid MIDI data range [0, 127]. */
function clampMidi(value: number): number {
  return Math.max(0, Math.min(127, Math.round(value)));
}

/**
 * Encode a Control Change message.
 *
 * @param ccNumber - Control Change number (0–127)
 * @param value - CC value (0–127, clamped)
 * @param channel - MIDI channel, 0-indexed (default: 0 = channel 1)
 * @returns 3-byte array: [status, ccNumber, value]
 */
export function encodeControlChange(
  ccNumber: number,
  value: number,
  channel: number = 0,
): number[] {
  const status = MIDI_STATUS.CONTROL_CHANGE | (channel & 0x0f);
  return [status, clampMidi(ccNumber), clampMidi(value)];
}

/**
 * Encode a Program Change message.
 *
 * @param program - Program number (0–127, clamped)
 * @param channel - MIDI channel, 0-indexed (default: 0 = channel 1)
 * @returns 2-byte array: [status, program]
 */
export function encodeProgramChange(
  program: number,
  channel: number = 0,
): number[] {
  const status = MIDI_STATUS.PROGRAM_CHANGE | (channel & 0x0f);
  return [status, clampMidi(program)];
}

/**
 * Encode a full tone selection sequence: CC 0 (MSB) → CC 32 (LSB) → PC.
 *
 * This is the standard MIDI tone selection per the FP-30X Implementation doc:
 * "Bank Select processing will be suspended until a Program Change message is received."
 *
 * @param bankMSB - Bank Select MSB (CC 0 value)
 * @param bankLSB - Bank Select LSB (CC 32 value)
 * @param programChange - Program Change number
 * @param channel - MIDI channel, 0-indexed
 * @returns Array of 3 MIDI messages (each is a number[])
 */
export function encodeToneSelection(
  bankMSB: number,
  bankLSB: number,
  programChange: number,
  channel: number = 0,
): number[][] {
  return [
    encodeControlChange(CC.BANK_SELECT_MSB, bankMSB, channel),
    encodeControlChange(CC.BANK_SELECT_LSB, bankLSB, channel),
    encodeProgramChange(programChange, channel),
  ];
}

/**
 * Encode a GM2 tone selection with the required GM2 System On SysEx prefix.
 *
 * Per MIDI Implementation doc:
 * "There must be an interval of at least 50 ms between this message and the next."
 * The caller is responsible for enforcing the 50ms delay between the SysEx and the
 * subsequent tone selection messages.
 *
 * @param bankMSB - Bank Select MSB
 * @param bankLSB - Bank Select LSB
 * @param programChange - Program Change number
 * @param channel - MIDI channel, 0-indexed
 * @returns Array of 4 messages: [GM2 SysEx, CC 0, CC 32, PC]
 */
export function encodeGM2ToneSelection(
  bankMSB: number,
  bankLSB: number,
  programChange: number,
  channel: number = 0,
): number[][] {
  return [
    [...SYSEX_GM2_SYSTEM_ON],
    ...encodeToneSelection(bankMSB, bankLSB, programChange, channel),
  ];
}
