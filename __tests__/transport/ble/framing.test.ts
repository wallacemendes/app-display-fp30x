/**
 * T019: BLE MIDI framing tests.
 *
 * Verifies SysEx wrapping with F7 timestamp, standard message wrapping,
 * strip framing from notifications, and roundtrip wrap→strip.
 */

import {
  wrapInBleMidiPacket,
  wrapMultipleInBleMidiPacket,
  stripBleFraming,
  base64ToBytes,
  bytesToBase64,
} from '../../../src/transport/ble/framing';

describe('wrapInBleMidiPacket', () => {
  it('wraps a standard 3-byte MIDI message', () => {
    const result = wrapInBleMidiPacket([0x90, 0x3c, 0x64]);
    expect(result.length).toBe(5); // header + timestamp + 3 bytes
    expect(result[0] & 0x80).toBe(0x80); // header bit 7 set
    expect(result[1] & 0x80).toBe(0x80); // timestamp bit 7 set
    expect(result[2]).toBe(0x90); // Note On
    expect(result[3]).toBe(0x3c); // note
    expect(result[4]).toBe(0x64); // velocity
  });

  it('wraps a SysEx message with extra F7 timestamp', () => {
    const sysex = [0xf0, 0x7e, 0x7f, 0x09, 0x03, 0xf7]; // GM2 System On
    const result = wrapInBleMidiPacket(sysex);

    // Expected: [header, ts, F0, 7E 7F 09 03, endTs, F7]
    expect(result[0] & 0x80).toBe(0x80); // header
    expect(result[1] & 0x80).toBe(0x80); // timestamp
    expect(result[2]).toBe(0xf0); // SysEx start
    expect(result[3]).toBe(0x7e); // payload start
    expect(result[result.length - 1]).toBe(0xf7); // SysEx end
    expect(result[result.length - 2] & 0x80).toBe(0x80); // F7 timestamp
  });

  it('wraps a DT1 SysEx correctly', () => {
    // Concert Piano DT1
    const dt1 = [
      0xf0, 0x41, 0x10, 0x00, 0x00, 0x00, 0x28, 0x12,
      0x01, 0x00, 0x02, 0x07, 0x00, 0x00, 0x00, 0x76, 0xf7,
    ];
    const result = wrapInBleMidiPacket(dt1);

    // Structure: header, ts, F0, payload (without F0/F7), endTs, F7
    expect(result[2]).toBe(0xf0);
    expect(result[3]).toBe(0x41); // Roland ID (payload start)
    expect(result[result.length - 1]).toBe(0xf7);
    // Payload bytes should be unchanged
    expect(result[4]).toBe(0x10); // device ID
    expect(result[5]).toBe(0x00); // model ID byte 1
  });
});

describe('wrapMultipleInBleMidiPacket', () => {
  it('wraps multiple messages with shared header', () => {
    const msg1 = [0x90, 0x3c, 0x64]; // Note On C4
    const msg2 = [0x90, 0x40, 0x50]; // Note On E4
    const result = wrapMultipleInBleMidiPacket([msg1, msg2]);

    expect(result[0] & 0x80).toBe(0x80); // single header
    // First message
    expect(result[1] & 0x80).toBe(0x80); // timestamp
    expect(result[2]).toBe(0x90);
    expect(result[3]).toBe(0x3c);
    expect(result[4]).toBe(0x64);
    // Second message
    expect(result[5] & 0x80).toBe(0x80); // timestamp
    expect(result[6]).toBe(0x90);
    expect(result[7]).toBe(0x40);
    expect(result[8]).toBe(0x50);
  });
});

describe('stripBleFraming', () => {
  it('strips framing from a standard Note On', () => {
    // BLE packet: [header, ts, 0x90, 0x3C, 0x64]
    const packet = [0x80, 0x80, 0x90, 0x3c, 0x64];
    const messages = stripBleFraming(packet);
    expect(messages).toEqual([[0x90, 0x3c, 0x64]]);
  });

  it('strips framing from a SysEx notification', () => {
    // BLE packet: [header, ts, F0, payload, ts, F7]
    const packet = [
      0x9f, 0x9c, 0xf0, 0x41, 0x10, 0x00, 0x00, 0x00, 0x28, 0x12,
      0x01, 0x00, 0x02, 0x13, 0x34, 0x36, 0x9c, 0xf7,
    ];
    const messages = stripBleFraming(packet);
    expect(messages.length).toBe(1);
    expect(messages[0][0]).toBe(0xf0);
    expect(messages[0][messages[0].length - 1]).toBe(0xf7);
    // Should contain the DT1 payload without embedded timestamps
    expect(messages[0]).toContain(0x41); // Roland ID
    expect(messages[0]).toContain(0x34); // volume data
  });

  it('strips framing from a DT1 tone notification', () => {
    // Real capture format: header, ts, F0, 41 10 00 00 00 28 12 01 00 02 07 00 00 00 76, ts, F7
    const packet = [
      0xbf, 0xb2, 0xf0, 0x41, 0x10, 0x00, 0x00, 0x00, 0x28, 0x12,
      0x01, 0x00, 0x02, 0x07, 0x00, 0x00, 0x00, 0x76, 0xb2, 0xf7,
    ];
    const messages = stripBleFraming(packet);
    expect(messages.length).toBe(1);
    expect(messages[0]).toEqual([
      0xf0, 0x41, 0x10, 0x00, 0x00, 0x00, 0x28, 0x12,
      0x01, 0x00, 0x02, 0x07, 0x00, 0x00, 0x00, 0x76, 0xf7,
    ]);
  });

  it('strips framing from a 2-byte Program Change', () => {
    const packet = [0x80, 0x80, 0xc0, 0x10];
    const messages = stripBleFraming(packet);
    expect(messages).toEqual([[0xc0, 0x10]]);
  });

  it('returns empty for too-short packet', () => {
    expect(stripBleFraming([0x80])).toEqual([]);
    expect(stripBleFraming([])).toEqual([]);
  });
});

describe('base64 conversion', () => {
  it('roundtrips bytes through base64', () => {
    const original = [0xf0, 0x41, 0x10, 0x00, 0x28, 0xf7];
    const b64 = bytesToBase64(original);
    const decoded = base64ToBytes(b64);
    expect(decoded).toEqual(original);
  });

  it('handles empty input', () => {
    expect(bytesToBase64([])).toBe('');
    expect(base64ToBytes('')).toEqual([]);
  });
});
