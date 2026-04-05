/**
 * T060: Presets store tests.
 *
 * Verifies: create preset with DT1 tone + volume + tempo,
 * update preset name, delete + sortOrder re-indexing,
 * single-default enforcement, quickToneSlots captured,
 * getDefaultPreset returns correct preset.
 */

import {usePresetsStore} from '../../src/store/presetsStore';

const samplePresetInput = {
  tone: {category: 0x00, indexHigh: 0, indexLow: 0},
  volume: 100,
  tempo: 120,
  metronomeOn: false,
  metronomeBeat: 3,
  metronomePattern: 0,
  quickToneSlots: [null, null, null] as [string | null, string | null, string | null],
  isDefault: false,
};

const altPresetInput = {
  tone: {category: 0x01, indexHigh: 0, indexLow: 2},
  volume: 80,
  tempo: 140,
  metronomeOn: true,
  metronomeBeat: 2,
  metronomePattern: 1,
  quickToneSlots: ['0-0-0', '1-0-0', null] as [string | null, string | null, string | null],
  isDefault: false,
};

beforeEach(() => {
  // Reset store between tests
  usePresetsStore.setState({presets: []});
});

describe('presetsStore', () => {
  describe('createPreset', () => {
    it('creates a preset with DT1 tone + volume + tempo', () => {
      const id = usePresetsStore.getState().createPreset('My Piano', samplePresetInput);

      const presets = usePresetsStore.getState().presets;
      expect(presets).toHaveLength(1);

      const preset = presets[0];
      expect(preset.id).toBe(id);
      expect(preset.name).toBe('My Piano');
      expect(preset.tone).toEqual({category: 0x00, indexHigh: 0, indexLow: 0});
      expect(preset.volume).toBe(100);
      expect(preset.tempo).toBe(120);
      expect(preset.metronomeOn).toBe(false);
      expect(preset.isDefault).toBe(false);
      expect(preset.sortOrder).toBe(0);
      expect(preset.createdAt).toBeTruthy();
      expect(preset.updatedAt).toBeTruthy();
    });

    it('auto-assigns incremental sortOrder', () => {
      usePresetsStore.getState().createPreset('First', samplePresetInput);
      usePresetsStore.getState().createPreset('Second', altPresetInput);

      const presets = usePresetsStore.getState().presets;
      expect(presets[0].sortOrder).toBe(0);
      expect(presets[1].sortOrder).toBe(1);
    });

    it('returns the generated id', () => {
      const id = usePresetsStore.getState().createPreset('Test', samplePresetInput);
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('captures quickToneSlots in preset', () => {
      usePresetsStore.getState().createPreset('With Slots', altPresetInput);

      const preset = usePresetsStore.getState().presets[0];
      expect(preset.quickToneSlots).toEqual(['0-0-0', '1-0-0', null]);
    });
  });

  describe('updatePreset', () => {
    it('updates preset name', () => {
      const id = usePresetsStore.getState().createPreset('Old Name', samplePresetInput);
      const createdAt = usePresetsStore.getState().presets[0].createdAt;

      usePresetsStore.getState().updatePreset(id, {name: 'New Name'});

      const preset = usePresetsStore.getState().presets[0];
      expect(preset.name).toBe('New Name');
      expect(preset.createdAt).toBe(createdAt);
      // updatedAt should be set (may equal createdAt if same millisecond)
      expect(typeof preset.updatedAt).toBe('string');
    });

    it('updates volume without affecting other fields', () => {
      const id = usePresetsStore.getState().createPreset('Test', samplePresetInput);

      usePresetsStore.getState().updatePreset(id, {volume: 50});

      const preset = usePresetsStore.getState().presets[0];
      expect(preset.volume).toBe(50);
      expect(preset.tempo).toBe(120);
      expect(preset.tone).toEqual({category: 0x00, indexHigh: 0, indexLow: 0});
    });
  });

  describe('deletePreset', () => {
    it('removes the preset', () => {
      const id = usePresetsStore.getState().createPreset('To Delete', samplePresetInput);

      usePresetsStore.getState().deletePreset(id);

      expect(usePresetsStore.getState().presets).toHaveLength(0);
    });

    it('re-indexes sortOrder after deletion', () => {
      usePresetsStore.getState().createPreset('First', samplePresetInput);
      const secondId = usePresetsStore.getState().createPreset('Second', altPresetInput);
      usePresetsStore.getState().createPreset('Third', samplePresetInput);

      // Delete the middle preset
      usePresetsStore.getState().deletePreset(secondId);

      const presets = usePresetsStore.getState().presets;
      expect(presets).toHaveLength(2);
      expect(presets[0].name).toBe('First');
      expect(presets[0].sortOrder).toBe(0);
      expect(presets[1].name).toBe('Third');
      expect(presets[1].sortOrder).toBe(1);
    });
  });

  describe('default preset enforcement', () => {
    it('sets a preset as default', () => {
      const id = usePresetsStore.getState().createPreset('My Default', samplePresetInput);

      usePresetsStore.getState().setDefault(id);

      const preset = usePresetsStore.getState().presets[0];
      expect(preset.isDefault).toBe(true);
    });

    it('clears previous default when setting a new one', () => {
      const id1 = usePresetsStore.getState().createPreset('First', samplePresetInput);
      const id2 = usePresetsStore.getState().createPreset('Second', altPresetInput);

      usePresetsStore.getState().setDefault(id1);
      expect(usePresetsStore.getState().presets.find(p => p.id === id1)!.isDefault).toBe(true);

      usePresetsStore.getState().setDefault(id2);
      const presets = usePresetsStore.getState().presets;
      expect(presets.find(p => p.id === id1)!.isDefault).toBe(false);
      expect(presets.find(p => p.id === id2)!.isDefault).toBe(true);
    });

    it('clearDefault removes default from all presets', () => {
      const id = usePresetsStore.getState().createPreset('Default', samplePresetInput);
      usePresetsStore.getState().setDefault(id);

      usePresetsStore.getState().clearDefault();

      expect(usePresetsStore.getState().presets.every(p => !p.isDefault)).toBe(true);
    });

    it('creating a default preset clears previous default', () => {
      const id1 = usePresetsStore.getState().createPreset('First', samplePresetInput);
      usePresetsStore.getState().setDefault(id1);

      usePresetsStore.getState().createPreset('Second Default', {
        ...altPresetInput,
        isDefault: true,
      });

      const presets = usePresetsStore.getState().presets;
      expect(presets.find(p => p.id === id1)!.isDefault).toBe(false);
      expect(presets.find(p => p.name === 'Second Default')!.isDefault).toBe(true);
    });
  });

  describe('getDefaultPreset', () => {
    it('returns undefined when no default is set', () => {
      usePresetsStore.getState().createPreset('Not Default', samplePresetInput);

      expect(usePresetsStore.getState().getDefaultPreset()).toBeUndefined();
    });

    it('returns the correct default preset', () => {
      usePresetsStore.getState().createPreset('First', samplePresetInput);
      const id2 = usePresetsStore.getState().createPreset('Second', altPresetInput);
      usePresetsStore.getState().setDefault(id2);

      const defaultPreset = usePresetsStore.getState().getDefaultPreset();
      expect(defaultPreset).toBeDefined();
      expect(defaultPreset!.id).toBe(id2);
      expect(defaultPreset!.name).toBe('Second');
    });
  });

  describe('reorderPresets', () => {
    it('reorders presets and re-assigns sortOrder', () => {
      const id1 = usePresetsStore.getState().createPreset('A', samplePresetInput);
      const id2 = usePresetsStore.getState().createPreset('B', altPresetInput);
      const id3 = usePresetsStore.getState().createPreset('C', samplePresetInput);

      // Reverse order
      usePresetsStore.getState().reorderPresets([id3, id2, id1]);

      const presets = usePresetsStore.getState().presets;
      expect(presets[0].id).toBe(id3);
      expect(presets[0].sortOrder).toBe(0);
      expect(presets[1].id).toBe(id2);
      expect(presets[1].sortOrder).toBe(1);
      expect(presets[2].id).toBe(id1);
      expect(presets[2].sortOrder).toBe(2);
    });
  });
});
