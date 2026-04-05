/**
 * MIDI Service for FP-30X.
 *
 * T020: High-level API for sending MIDI messages over BLE.
 * Wraps midiEncoder + bleMidiPacket + BleManager.writeMidiPacket.
 *
 * Constitution II: One-Way State Injector — send only, no read-back.
 * Constitution IV: MIDI Protocol Fidelity — correct sequences and timing.
 */

import {
  encodeToneSelection,
  encodeGM2ToneSelection,
  encodeControlChange,
} from '../../../services/midi/midiEncoder';
import {
  wrapInBleMidiPacket,
  wrapMultipleInBleMidiPacket,
} from '../../../services/midi/bleMidiPacket';
import {GM_SYSEX_DELAY_MS, MIDI_CHANNEL} from '../../../services/midi/constants';
import {writeMidiPacket} from './BleManager';

/**
 * Send a tone selection (built-in tones).
 * Sends CC0 (MSB) → CC32 (LSB) → PC as a single BLE packet.
 */
export async function sendToneSelection(
  bankMSB: number,
  bankLSB: number,
  programChange: number,
  channel: number = MIDI_CHANNEL,
): Promise<void> {
  const messages = encodeToneSelection(bankMSB, bankLSB, programChange, channel);
  const packet = wrapMultipleInBleMidiPacket(messages);
  await writeMidiPacket(packet);
}

/**
 * Send a GM2 tone selection.
 * Sends GM2 System On SysEx, waits 50ms, then sends CC0 → CC32 → PC.
 *
 * Per MIDI Implementation doc:
 * "There must be an interval of at least 50 ms between this message and the next."
 */
export async function sendGM2ToneSelection(
  bankMSB: number,
  bankLSB: number,
  programChange: number,
  channel: number = MIDI_CHANNEL,
): Promise<void> {
  const messages = encodeGM2ToneSelection(bankMSB, bankLSB, programChange, channel);

  // Send GM2 System On SysEx first
  const sysexPacket = wrapInBleMidiPacket(messages[0]);
  await writeMidiPacket(sysexPacket);

  // Wait required 50ms delay
  await delay(GM_SYSEX_DELAY_MS);

  // Send tone selection (CC0 + CC32 + PC) as single packet
  const toneMessages = messages.slice(1);
  const tonePacket = wrapMultipleInBleMidiPacket(toneMessages);
  await writeMidiPacket(tonePacket);
}

/**
 * Send a single Control Change message.
 */
export async function sendControlChange(
  ccNumber: number,
  value: number,
  channel: number = MIDI_CHANNEL,
): Promise<void> {
  const message = encodeControlChange(ccNumber, value, channel);
  const packet = wrapInBleMidiPacket(message);
  await writeMidiPacket(packet);
}

/**
 * Send a batch of MIDI messages for preset apply.
 * Handles GM2 SysEx delay if present.
 *
 * @param messages - Array of MIDI messages (each is a number[])
 * @param hasGM2Prefix - If true, first message is GM2 SysEx requiring 50ms delay
 */
export async function sendBatch(
  messages: number[][],
  hasGM2Prefix: boolean = false,
): Promise<void> {
  if (messages.length === 0) {
    return;
  }

  if (hasGM2Prefix && messages.length > 1) {
    // Send SysEx first
    const sysexPacket = wrapInBleMidiPacket(messages[0]);
    await writeMidiPacket(sysexPacket);

    // Wait required delay
    await delay(GM_SYSEX_DELAY_MS);

    // Send remaining messages as single packet
    const remaining = messages.slice(1);
    const packet = wrapMultipleInBleMidiPacket(remaining);
    await writeMidiPacket(packet);
  } else {
    // Send all as single packet
    const packet = wrapMultipleInBleMidiPacket(messages);
    await writeMidiPacket(packet);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
