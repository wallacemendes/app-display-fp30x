/**
 * TDD Tests for midiEncoder.
 *
 * T008: Write failing tests BEFORE implementation.
 * These tests outline the expected byte-level outputs for:
 * - Control Change (CC) messages
 * - Program Change (PC) messages
 * - SysEx messages
 * - Tone selection sequences (Bank MSB → Bank LSB → PC)
 *
 * Source: FP-30X MIDI Implementation doc, Section 1 (Receive Data)
 */

import {
  encodeControlChange,
  encodeProgramChange,
  encodeToneSelection,
  encodeGM2ToneSelection,
} from '../../../src/services/midi/midiEncoder';
import {
  CC,
  MIDI_CHANNEL,
  SYSEX_GM2_SYSTEM_ON,
} from '../../../src/services/midi/constants';

describe('midiEncoder', () => {
  describe('encodeControlChange', () => {
    it('should encode CC 0 (Bank Select MSB) on channel 1 with value 87', () => {
      const bytes = encodeControlChange(CC.BANK_SELECT_MSB, 87, MIDI_CHANNEL);
      // Status = 0xB0 (CC on channel 1), Data1 = 0x00 (CC#0), Data2 = 0x57 (87)
      expect(bytes).toEqual([0xb0, 0x00, 0x57]);
    });

    it('should encode CC 32 (Bank Select LSB) on channel 1 with value 66', () => {
      const bytes = encodeControlChange(CC.BANK_SELECT_LSB, 66, MIDI_CHANNEL);
      // Status = 0xB0, Data1 = 0x20 (CC#32), Data2 = 0x42 (66)
      expect(bytes).toEqual([0xb0, 0x20, 0x42]);
    });

    it('should encode CC 7 (Volume) on channel 1 with value 100', () => {
      const bytes = encodeControlChange(CC.VOLUME, 100, MIDI_CHANNEL);
      expect(bytes).toEqual([0xb0, 0x07, 0x64]);
    });

    it('should encode CC 91 (Reverb Send) on channel 1 with value 40', () => {
      const bytes = encodeControlChange(CC.REVERB_SEND, 40, MIDI_CHANNEL);
      expect(bytes).toEqual([0xb0, 0x5b, 0x28]);
    });

    it('should clamp value to 0–127 range', () => {
      const bytesHigh = encodeControlChange(CC.VOLUME, 200, MIDI_CHANNEL);
      expect(bytesHigh[2]).toBe(0x7f); // clamped to 127

      const bytesLow = encodeControlChange(CC.VOLUME, -5, MIDI_CHANNEL);
      expect(bytesLow[2]).toBe(0x00); // clamped to 0
    });

    it('should support different MIDI channels (0-indexed)', () => {
      const bytes = encodeControlChange(CC.VOLUME, 100, 9); // Channel 10
      expect(bytes[0]).toBe(0xb9); // 0xB0 | 9
    });
  });

  describe('encodeProgramChange', () => {
    it('should encode Program Change 0 on channel 1', () => {
      const bytes = encodeProgramChange(0, MIDI_CHANNEL);
      // Status = 0xC0 (PC on channel 1), Data1 = 0x00 (program 0)
      expect(bytes).toEqual([0xc0, 0x00]);
    });

    it('should encode Program Change 6 on channel 1', () => {
      const bytes = encodeProgramChange(6, MIDI_CHANNEL);
      expect(bytes).toEqual([0xc0, 0x06]);
    });

    it('should clamp program number to 0–127', () => {
      const bytes = encodeProgramChange(200, MIDI_CHANNEL);
      expect(bytes[1]).toBe(0x7f);
    });
  });

  describe('encodeToneSelection', () => {
    it('should produce the correct 3-message sequence for Concert Piano', () => {
      // Concert Piano: MSB=0, LSB=68, PC=0
      const messages = encodeToneSelection(0, 68, 0, MIDI_CHANNEL);
      expect(messages).toEqual([
        [0xb0, 0x00, 0x00], // CC 0 = 0 (Bank MSB)
        [0xb0, 0x20, 0x44], // CC 32 = 68 (Bank LSB)
        [0xc0, 0x00],       // PC = 0
      ]);
    });

    it('should produce the correct sequence for Standard Drum Set', () => {
      // Standard Set: MSB=120, LSB=0, PC=0
      const messages = encodeToneSelection(120, 0, 0, MIDI_CHANNEL);
      expect(messages).toEqual([
        [0xb0, 0x00, 0x78], // CC 0 = 120
        [0xb0, 0x20, 0x00], // CC 32 = 0
        [0xc0, 0x00],       // PC = 0
      ]);
    });

    it('should produce the correct sequence for a GM2 tone (Piano 1)', () => {
      // GM2 Piano 1: MSB=121, LSB=0, PC=0
      const messages = encodeToneSelection(121, 0, 0, MIDI_CHANNEL);
      expect(messages).toEqual([
        [0xb0, 0x00, 0x79], // CC 0 = 121
        [0xb0, 0x20, 0x00], // CC 32 = 0
        [0xc0, 0x00],       // PC = 0
      ]);
    });
  });

  describe('encodeGM2ToneSelection', () => {
    it('should prepend GM2 System On SysEx before tone selection', () => {
      const messages = encodeGM2ToneSelection(121, 0, 0, MIDI_CHANNEL);
      // First message: GM2 System On SysEx
      expect(messages[0]).toEqual([...SYSEX_GM2_SYSTEM_ON]);
      // Followed by tone selection sequence
      expect(messages[1]).toEqual([0xb0, 0x00, 0x79]);
      expect(messages[2]).toEqual([0xb0, 0x20, 0x00]);
      expect(messages[3]).toEqual([0xc0, 0x00]);
      expect(messages).toHaveLength(4);
    });
  });
});
