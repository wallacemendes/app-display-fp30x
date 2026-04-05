/**
 * TDD Tests for performanceStore.
 *
 * T026 (partial): Test tone state assignment and pending-tone queue.
 */

import {usePerformanceStore} from '../../src/store/performanceStore';
import {DEFAULTS} from '../../src/services/midi/constants';

beforeEach(() => {
  usePerformanceStore.getState().resetPerformance();
});

describe('performanceStore', () => {
  describe('initial state', () => {
    it('should have no active tone or preset', () => {
      const state = usePerformanceStore.getState();
      expect(state.activeToneId).toBeNull();
      expect(state.activePresetId).toBeNull();
      expect(state.pendingToneId).toBeNull();
    });

    it('should have default MIDI values', () => {
      const state = usePerformanceStore.getState();
      expect(state.volume).toBe(DEFAULTS.VOLUME);
      expect(state.expression).toBe(DEFAULTS.EXPRESSION);
      expect(state.pan).toBe(DEFAULTS.PAN);
      expect(state.reverbSend).toBe(DEFAULTS.REVERB_SEND);
      expect(state.chorusSend).toBe(DEFAULTS.CHORUS_SEND);
    });
  });

  describe('tone selection', () => {
    it('should set active tone and clear pending', () => {
      usePerformanceStore.getState().setPendingTone('0-68-0');
      expect(usePerformanceStore.getState().pendingToneId).toBe('0-68-0');

      usePerformanceStore.getState().setActiveTone('0-68-0');
      const state = usePerformanceStore.getState();
      expect(state.activeToneId).toBe('0-68-0');
      expect(state.pendingToneId).toBeNull(); // cleared
    });

    it('should allow setting a pending tone independently', () => {
      usePerformanceStore.getState().setPendingTone('121-0-0');
      expect(usePerformanceStore.getState().pendingToneId).toBe('121-0-0');
      expect(usePerformanceStore.getState().activeToneId).toBeNull();
    });

    it('should clear pending tone without affecting active', () => {
      usePerformanceStore.getState().setActiveTone('0-68-0');
      usePerformanceStore.getState().setPendingTone('121-0-0');
      usePerformanceStore.getState().clearPendingTone();

      const state = usePerformanceStore.getState();
      expect(state.activeToneId).toBe('0-68-0');
      expect(state.pendingToneId).toBeNull();
    });
  });

  describe('preset tracking', () => {
    it('should set active preset', () => {
      usePerformanceStore.getState().setActivePreset('preset-uuid-123');
      expect(usePerformanceStore.getState().activePresetId).toBe('preset-uuid-123');
    });
  });

  describe('reset', () => {
    it('should reset everything to defaults', () => {
      usePerformanceStore.getState().setActiveTone('0-68-0');
      usePerformanceStore.getState().setActivePreset('preset-1');
      usePerformanceStore.getState().resetPerformance();

      const state = usePerformanceStore.getState();
      expect(state.activeToneId).toBeNull();
      expect(state.activePresetId).toBeNull();
      expect(state.volume).toBe(DEFAULTS.VOLUME);
    });
  });
});
