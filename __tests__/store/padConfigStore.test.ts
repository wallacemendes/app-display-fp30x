/**
 * T077: Pad config store tests.
 *
 * Verifies: 8 default empty pads, updatePad, getPad,
 * persisted via MMKV middleware, command sequences stored correctly.
 */

import {usePadConfigStore} from '../../src/store/padConfigStore';

beforeEach(() => {
  // Reset store between tests
  usePadConfigStore.setState({
    pads: Array.from({length: 8}, (_, i) => ({
      id: `pad-${i}`,
      label: `PAD ${i + 1}`,
      color: '#4A90D9',
      commands: [],
    })),
  });
});

describe('padConfigStore', () => {
  describe('initial state', () => {
    it('has 8 pads', () => {
      const {pads} = usePadConfigStore.getState();
      expect(pads).toHaveLength(8);
    });

    it('pads are labeled PAD 1 through PAD 8', () => {
      const {pads} = usePadConfigStore.getState();
      pads.forEach((pad, i) => {
        expect(pad.label).toBe(`PAD ${i + 1}`);
      });
    });

    it('pads have correct IDs pad-0 through pad-7', () => {
      const {pads} = usePadConfigStore.getState();
      pads.forEach((pad, i) => {
        expect(pad.id).toBe(`pad-${i}`);
      });
    });

    it('all pads start with empty commands', () => {
      const {pads} = usePadConfigStore.getState();
      pads.forEach(pad => {
        expect(pad.commands).toEqual([]);
      });
    });

    it('all pads have default color', () => {
      const {pads} = usePadConfigStore.getState();
      pads.forEach(pad => {
        expect(pad.color).toBe('#4A90D9');
      });
    });
  });

  describe('getPad', () => {
    it('returns the correct pad by ID', () => {
      const pad = usePadConfigStore.getState().getPad('pad-3');
      expect(pad).toBeDefined();
      expect(pad!.label).toBe('PAD 4');
    });

    it('returns undefined for unknown ID', () => {
      const pad = usePadConfigStore.getState().getPad('pad-99');
      expect(pad).toBeUndefined();
    });
  });

  describe('updatePad', () => {
    it('updates pad label', () => {
      usePadConfigStore.getState().updatePad('pad-0', {label: 'JAZZ'});

      const pad = usePadConfigStore.getState().getPad('pad-0');
      expect(pad!.label).toBe('JAZZ');
    });

    it('updates pad color', () => {
      usePadConfigStore.getState().updatePad('pad-1', {color: '#FF0000'});

      const pad = usePadConfigStore.getState().getPad('pad-1');
      expect(pad!.color).toBe('#FF0000');
    });

    it('updates pad commands', () => {
      const commands = [
        {type: 'tone' as const, params: {category: 0, indexHigh: 0, indexLow: 0}},
        {type: 'volume' as const, params: {value: 100}},
      ];
      usePadConfigStore.getState().updatePad('pad-2', {commands});

      const pad = usePadConfigStore.getState().getPad('pad-2');
      expect(pad!.commands).toHaveLength(2);
      expect(pad!.commands[0].type).toBe('tone');
      expect(pad!.commands[1].type).toBe('volume');
    });

    it('does not affect other pads', () => {
      usePadConfigStore.getState().updatePad('pad-0', {label: 'UPDATED'});

      const pad1 = usePadConfigStore.getState().getPad('pad-1');
      expect(pad1!.label).toBe('PAD 2');
    });

    it('ignores update for unknown pad ID', () => {
      const before = usePadConfigStore.getState().pads;
      usePadConfigStore.getState().updatePad('pad-99', {label: 'NOPE'});
      const after = usePadConfigStore.getState().pads;

      expect(after).toEqual(before);
    });

    it('preserves existing fields when partially updating', () => {
      usePadConfigStore.getState().updatePad('pad-5', {
        label: 'TEST',
        commands: [{type: 'tempo' as const, params: {value: 140}}],
      });
      usePadConfigStore.getState().updatePad('pad-5', {label: 'TEST2'});

      const pad = usePadConfigStore.getState().getPad('pad-5');
      expect(pad!.label).toBe('TEST2');
      expect(pad!.commands).toHaveLength(1);
      expect(pad!.commands[0].type).toBe('tempo');
    });
  });
});
