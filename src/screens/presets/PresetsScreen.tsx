/**
 * T064 + T085: PresetsScreen — PRESETS tab.
 *
 * FlatList of PresetCards sorted by sortOrder, "New Preset" button at top,
 * export/import buttons in header, empty state message when no presets exist.
 *
 * Constitution I: Offline-First — export via Share API, no network calls.
 * Constitution III: Landscape Hardware-Synth UI.
 * Constitution V: Presentation -> hooks -> services.
 */

import React, {useCallback} from 'react';
import {View, Text, FlatList, Pressable, Alert} from 'react-native';
import {usePresets} from '../../hooks/usePresets';
import {PresetCard} from './PresetCard';
import {useThemeColors} from '../../hooks/useThemeColors';
import {typography} from '../../theme/typography';
import type {Preset} from '../../store/presetsStore';
import {PresetService} from '../../services/PresetService';
import {getPianoService} from '../../hooks/usePiano';

export function PresetsScreen(): React.JSX.Element {
  const {
    presets,
    createPreset,
    applyPreset,
    deletePreset,
    renamePreset,
    setDefault,
    clearDefault,
  } = usePresets();
  const colors = useThemeColors();

  const handleExport = useCallback(async () => {
    const pianoService = getPianoService();
    if (!pianoService) {
      Alert.alert('Export', 'Piano service not available.');
      return;
    }
    const service = new PresetService(pianoService);
    const exported = await service.exportPresets();
    if (!exported) {
      Alert.alert('Export', 'No presets to export.');
    }
  }, []);

  const handleImport = useCallback(() => {
    Alert.alert(
      'Import Presets',
      'Preset import from files will be available in a future update. ' +
        'The export/import engine is ready — file picking requires an additional native module.',
    );
  }, []);

  const handleNewPreset = useCallback(() => {
    Alert.prompt(
      'New Preset',
      'Enter a name for the preset:',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Create',
          onPress: (name?: string) => {
            const trimmed = name?.trim();
            if (trimmed) {
              createPreset(trimmed);
            }
          },
        },
      ],
      'plain-text',
      '',
      'default',
    );
  }, [createPreset]);

  const handleApply = useCallback(
    (preset: Preset) => {
      applyPreset(preset);
    },
    [applyPreset],
  );

  const handleRename = useCallback(
    (id: string) => {
      Alert.prompt(
        'Rename Preset',
        'Enter a new name:',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Save',
            onPress: (name?: string) => {
              const trimmed = name?.trim();
              if (trimmed) {
                renamePreset(id, trimmed);
              }
            },
          },
        ],
        'plain-text',
        '',
        'default',
      );
    },
    [renamePreset],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deletePreset(id);
    },
    [deletePreset],
  );

  const handleSetDefault = useCallback(
    (id: string) => {
      setDefault(id);
    },
    [setDefault],
  );

  const handleClearDefault = useCallback(() => {
    clearDefault();
  }, [clearDefault]);

  const renderItem = useCallback(
    ({item}: {item: Preset}) => (
      <PresetCard
        preset={item}
        onApply={handleApply}
        onRename={handleRename}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
        onClearDefault={handleClearDefault}
      />
    ),
    [handleApply, handleRename, handleDelete, handleSetDefault, handleClearDefault],
  );

  const keyExtractor = useCallback((item: Preset) => item.id, []);

  return (
    <View style={{flex: 1, backgroundColor: colors.background}}>
      {/* Header with New Preset + Export/Import buttons */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
        <Text
          style={{
            ...typography.headingLg,
            color: colors.text,
          }}>
          Presets
        </Text>
        <View style={{flexDirection: 'row', gap: 8}}>
          <Pressable
            onPress={handleImport}
            style={({pressed}) => ({
              backgroundColor: pressed ? colors.border : colors.buttonBackground,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 8,
            })}>
            <Text
              style={{
                ...typography.label,
                color: colors.buttonText,
              }}>
              IMPORT
            </Text>
          </Pressable>
          <Pressable
            onPress={handleExport}
            style={({pressed}) => ({
              backgroundColor: pressed ? colors.border : colors.buttonBackground,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 12,
              paddingVertical: 8,
            })}>
            <Text
              style={{
                ...typography.label,
                color: colors.buttonText,
              }}>
              EXPORT
            </Text>
          </Pressable>
          <Pressable
            onPress={handleNewPreset}
            style={({pressed}) => ({
              backgroundColor: pressed ? colors.border : colors.buttonBackground,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 16,
              paddingVertical: 8,
            })}>
            <Text
              style={{
                ...typography.label,
                color: colors.buttonText,
              }}>
              + NEW PRESET
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Preset list or empty state */}
      {presets.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}>
          <Text
            style={{
              ...typography.displayMd,
              color: colors.textMuted,
              textAlign: 'center',
              marginBottom: 8,
            }}>
            No Presets
          </Text>
          <Text
            style={{
              ...typography.body,
              color: colors.textSecondary,
              textAlign: 'center',
            }}>
            Tap "+ NEW PRESET" to save the current piano state as a preset.
          </Text>
        </View>
      ) : (
        <FlatList
          data={presets}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 24,
          }}
        />
      )}
    </View>
  );
}
