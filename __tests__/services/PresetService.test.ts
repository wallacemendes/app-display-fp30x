/**
 * T082-T084: PresetService export/import tests.
 *
 * Verifies: PresetExportFile format, exportPresets calls Share,
 * importPresets validates version, conflict resolution appends " (imported)",
 * imported presets never set as default.
 */

import {Share} from 'react-native';
import {PresetService} from '../../src/services/PresetService';
import type {PresetExportFile} from '../../src/services/PresetService';
import {usePresetsStore} from '../../src/store/presetsStore';
import type {PianoService} from '../../src/services/PianoService';

// Mock Share API
jest.mock('react-native', () => ({
  Share: {
    share: jest.fn().mockResolvedValue({action: 'sharedAction'}),
  },
}));

// Minimal PianoService mock
const mockPianoService = {
  getEngine: jest.fn().mockReturnValue(null),
  applyPreset: jest.fn(),
} as unknown as PianoService;

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

let service: PresetService;

beforeEach(() => {
  usePresetsStore.setState({presets: []});
  service = new PresetService(mockPianoService);
  (Share.share as jest.Mock).mockClear();
});

describe('PresetService export/import', () => {
  describe('exportPresets (T083)', () => {
    it('returns false when no presets exist', async () => {
      const result = await service.exportPresets();
      expect(result).toBe(false);
      expect(Share.share).not.toHaveBeenCalled();
    });

    it('calls Share.share with valid JSON when presets exist', async () => {
      usePresetsStore.getState().createPreset('Test Preset', samplePresetInput);

      const result = await service.exportPresets();
      expect(result).toBe(true);
      expect(Share.share).toHaveBeenCalledTimes(1);

      const shareCall = (Share.share as jest.Mock).mock.calls[0][0];
      const parsed = JSON.parse(shareCall.message) as PresetExportFile;
      expect(parsed.version).toBe(1);
      expect(parsed.exportedAt).toBeTruthy();
      expect(parsed.presets).toHaveLength(1);
      expect(parsed.presets[0].name).toBe('Test Preset');
    });

    it('exports all presets', async () => {
      usePresetsStore.getState().createPreset('First', samplePresetInput);
      usePresetsStore.getState().createPreset('Second', altPresetInput);

      await service.exportPresets();

      const shareCall = (Share.share as jest.Mock).mock.calls[0][0];
      const parsed = JSON.parse(shareCall.message) as PresetExportFile;
      expect(parsed.presets).toHaveLength(2);
    });
  });

  describe('importPresets (T084)', () => {
    it('throws on invalid JSON', () => {
      expect(() => service.importPresets('not json')).toThrow('Invalid JSON format.');
    });

    it('throws on unsupported version', () => {
      const file = {version: 99, exportedAt: '', presets: []};
      expect(() => service.importPresets(JSON.stringify(file))).toThrow(
        'Unsupported preset file version.',
      );
    });

    it('throws when no presets in file', () => {
      const file: PresetExportFile = {version: 1, exportedAt: '', presets: []};
      expect(() => service.importPresets(JSON.stringify(file))).toThrow(
        'No presets found in file.',
      );
    });

    it('imports presets into the store', () => {
      const file: PresetExportFile = {
        version: 1,
        exportedAt: new Date().toISOString(),
        presets: [
          {
            ...samplePresetInput,
            id: 'import-1',
            name: 'Imported Piano',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
            sortOrder: 0,
          },
        ],
      };

      const count = service.importPresets(JSON.stringify(file));
      expect(count).toBe(1);

      const presets = usePresetsStore.getState().presets;
      expect(presets).toHaveLength(1);
      expect(presets[0].name).toBe('Imported Piano');
    });

    it('appends " (imported)" on name conflict', () => {
      // Create existing preset with same name
      usePresetsStore.getState().createPreset('My Piano', samplePresetInput);

      const file: PresetExportFile = {
        version: 1,
        exportedAt: new Date().toISOString(),
        presets: [
          {
            ...altPresetInput,
            id: 'import-2',
            name: 'My Piano',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
            sortOrder: 0,
          },
        ],
      };

      const count = service.importPresets(JSON.stringify(file));
      expect(count).toBe(1);

      const presets = usePresetsStore.getState().presets;
      expect(presets).toHaveLength(2);
      expect(presets[0].name).toBe('My Piano');
      expect(presets[1].name).toBe('My Piano (imported)');
    });

    it('never imports a preset as default', () => {
      const file: PresetExportFile = {
        version: 1,
        exportedAt: new Date().toISOString(),
        presets: [
          {
            ...samplePresetInput,
            id: 'import-3',
            name: 'Default Preset',
            isDefault: true,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
            sortOrder: 0,
          },
        ],
      };

      service.importPresets(JSON.stringify(file));

      const presets = usePresetsStore.getState().presets;
      expect(presets[0].isDefault).toBe(false);
    });

    it('imports multiple presets', () => {
      const file: PresetExportFile = {
        version: 1,
        exportedAt: new Date().toISOString(),
        presets: [
          {
            ...samplePresetInput,
            id: 'import-a',
            name: 'First Import',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
            sortOrder: 0,
          },
          {
            ...altPresetInput,
            id: 'import-b',
            name: 'Second Import',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
            sortOrder: 1,
          },
        ],
      };

      const count = service.importPresets(JSON.stringify(file));
      expect(count).toBe(2);
      expect(usePresetsStore.getState().presets).toHaveLength(2);
    });

    it('skips presets with missing required fields', () => {
      const file = {
        version: 1,
        exportedAt: new Date().toISOString(),
        presets: [
          {name: 'Valid', tone: {category: 0, indexHigh: 0, indexLow: 0}, volume: 100, tempo: 120, metronomeOn: false, quickToneSlots: [null, null, null], isDefault: false, id: 'x', createdAt: '', updatedAt: '', sortOrder: 0},
          {name: '', tone: null, volume: 0, tempo: 0},
        ],
      };

      const count = service.importPresets(JSON.stringify(file));
      expect(count).toBe(1);
    });
  });
});
