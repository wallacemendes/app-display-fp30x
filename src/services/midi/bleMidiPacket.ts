/**
 * BLE MIDI Packet Wrapping for FP-30X.
 *
 * Wraps raw MIDI messages in the BLE MIDI packet format required by the
 * BLE MIDI specification (Apple Bluetooth MIDI accessory spec).
 *
 * Packet format:
 *   [Header] [Timestamp] [MIDI Status] [Data...]
 *
 * Header byte: Bit 7 = 1, Bit 6 = timestamp high bit, Bits 5–0 = timestamp bits 12–7
 * Timestamp byte: Bit 7 = 1, Bits 6–0 = timestamp bits 6–0
 *
 * For SysEx:
 *   [Header] [Timestamp] [F0] [data...] [Timestamp] [F7]
 *
 * Constitution IV: MIDI Protocol Fidelity.
 */

/**
 * Get the current BLE MIDI timestamp (13-bit, millisecond-based).
 * Uses the lower 13 bits of the current time in ms.
 */
function getTimestamp(): {header: number; timestamp: number} {
  const now = Date.now() & 0x1fff; // 13-bit timestamp
  const header = 0x80 | ((now >> 7) & 0x3f); // bit 7 = 1, bits 5-0 = timestamp high
  const timestamp = 0x80 | (now & 0x7f); // bit 7 = 1, bits 6-0 = timestamp low
  return {header, timestamp};
}

/**
 * Wrap a single MIDI message in a BLE MIDI packet.
 *
 * @param midiData - Raw MIDI bytes (e.g. [0xB0, 0x00, 0x57])
 * @returns BLE MIDI packet as number array
 */
export function wrapInBleMidiPacket(midiData: number[]): number[] {
  const {header, timestamp} = getTimestamp();

  // Check if this is a SysEx message
  if (midiData[0] === 0xf0 && midiData[midiData.length - 1] === 0xf7) {
    // SysEx: Header, Timestamp, F0, data bytes (no F7), EndTimestamp, F7
    const sysexBody = midiData.slice(1, -1); // strip F0 and F7
    const endTimestamp = 0x80 | (Date.now() & 0x7f);
    return [header, timestamp, 0xf0, ...sysexBody, endTimestamp, 0xf7];
  }

  // Regular message: Header, Timestamp, MIDI data
  return [header, timestamp, ...midiData];
}

/**
 * Wrap multiple MIDI messages into a single BLE MIDI packet.
 *
 * Per BLE MIDI spec, multiple messages can share a single header byte,
 * each with their own timestamp byte.
 *
 * @param messages - Array of MIDI messages (each is a number[])
 * @returns Single BLE MIDI packet containing all messages
 */
export function wrapMultipleInBleMidiPacket(
  messages: number[][],
): number[] {
  const {header} = getTimestamp();
  const result: number[] = [header];

  for (const msg of messages) {
    const msgTimestamp = 0x80 | (Date.now() & 0x7f);
    result.push(msgTimestamp, ...msg);
  }

  return result;
}
