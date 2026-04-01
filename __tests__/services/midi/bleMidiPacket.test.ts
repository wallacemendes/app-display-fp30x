/**
 * TDD Tests for bleMidiPacket.
 *
 * T008: Write failing tests BEFORE implementation.
 * These tests outline the expected BLE MIDI packet wrapping behavior:
 * - Header + Timestamp + MIDI data format
 * - SysEx packet handling
 * - Multiple MIDI messages in a single packet
 *
 * Source: BLE MIDI spec (Apple), midi-service.md contract
 */

import {
  wrapInBleMidiPacket,
  wrapMultipleInBleMidiPacket,
} from '../../../src/services/midi/bleMidiPacket';

describe('bleMidiPacket', () => {
  describe('wrapInBleMidiPacket', () => {
    it('should wrap a 3-byte CC message with header and timestamp', () => {
      const midiData = [0xb0, 0x00, 0x57]; // CC 0 = 87
      const packet = wrapInBleMidiPacket(midiData);

      // Packet structure: [Header, Timestamp, ...MIDI data]
      expect(packet.length).toBe(5); // header(1) + timestamp(1) + data(3)

      // Header byte: bit 7 must be 1
      expect(packet[0] & 0x80).toBe(0x80);

      // Timestamp byte: bit 7 must be 1
      expect(packet[1] & 0x80).toBe(0x80);

      // MIDI data follows unchanged
      expect(packet[2]).toBe(0xb0);
      expect(packet[3]).toBe(0x00);
      expect(packet[4]).toBe(0x57);
    });

    it('should wrap a 2-byte PC message with header and timestamp', () => {
      const midiData = [0xc0, 0x00]; // PC = 0
      const packet = wrapInBleMidiPacket(midiData);

      expect(packet.length).toBe(4); // header(1) + timestamp(1) + data(2)
      expect(packet[0] & 0x80).toBe(0x80); // header bit 7
      expect(packet[1] & 0x80).toBe(0x80); // timestamp bit 7
      expect(packet[2]).toBe(0xc0);
      expect(packet[3]).toBe(0x00);
    });

    it('should wrap a SysEx message with header and timestamp', () => {
      const sysex = [0xf0, 0x7e, 0x7f, 0x09, 0x03, 0xf7]; // GM2 System On
      const packet = wrapInBleMidiPacket(sysex);

      // Header + Timestamp + SysEx data + endTimestamp + F7
      // BLE MIDI SysEx: header, timestamp, F0, data..., timestamp, F7
      expect(packet[0] & 0x80).toBe(0x80); // header
      expect(packet[1] & 0x80).toBe(0x80); // timestamp

      // F0 should be present in the data
      expect(packet[2]).toBe(0xf0);

      // Last byte should be F7
      expect(packet[packet.length - 1]).toBe(0xf7);
    });

    it('should produce valid header byte with timestamp bits', () => {
      const midiData = [0xb0, 0x07, 0x64];
      const packet = wrapInBleMidiPacket(midiData);

      const header = packet[0];
      // Bit 7 = 1 (always)
      // Bits 5-0 = timestamp high bits (can be any value)
      expect(header & 0x80).toBe(0x80);
    });

    it('should produce valid timestamp byte', () => {
      const midiData = [0xb0, 0x07, 0x64];
      const packet = wrapInBleMidiPacket(midiData);

      const timestamp = packet[1];
      // Bit 7 = 1 (always)
      expect(timestamp & 0x80).toBe(0x80);
    });
  });

  describe('wrapMultipleInBleMidiPacket', () => {
    it('should wrap multiple MIDI messages into a single BLE packet', () => {
      const messages = [
        [0xb0, 0x00, 0x00], // CC 0 = 0
        [0xb0, 0x20, 0x44], // CC 32 = 68
        [0xc0, 0x00],       // PC = 0
      ];
      const packet = wrapMultipleInBleMidiPacket(messages);

      // Should have header byte first
      expect(packet[0] & 0x80).toBe(0x80);

      // Each message should have its own timestamp byte
      // Total: header(1) + [timestamp(1) + msg1(3)] + [timestamp(1) + msg2(3)] + [timestamp(1) + msg3(2)]
      expect(packet.length).toBe(1 + 4 + 4 + 3); // 12 bytes
    });

    it('should handle a single message', () => {
      const messages = [[0xb0, 0x07, 0x64]];
      const packet = wrapMultipleInBleMidiPacket(messages);

      expect(packet.length).toBe(5); // header(1) + timestamp(1) + data(3)
    });
  });
});
