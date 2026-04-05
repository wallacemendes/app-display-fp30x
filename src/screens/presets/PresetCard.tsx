/**
 * T063: PresetCard — Card component for a single preset.
 *
 * Displays preset name, default badge (star), and resolved tone name.
 * Tap -> apply preset. Long-press -> Alert with Rename / Delete /
 * Set Default / Remove Default options.
 *
 * Constitution III: Landscape Hardware-Synth UI, NativeWind + theme colors.
 * Orbitron font for tone name display.
 */

import React, {useCallback} from 'react';
import {View, Text, Pressable, Alert} from 'react-native';
import type {Preset} from '../../store/presetsStore';
import {useThemeColors} from '../../hooks/useThemeColors';
import {typography} from '../../theme/typography';
import {fp30xToneCatalog} from '../../engine/fp30x/tones';

interface PresetCardProps {
  preset: Preset;
  onApply: (preset: Preset) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onClearDefault: () => void;
}

export function PresetCard({
  preset,
  onApply,
  onRename,
  onDelete,
  onSetDefault,
  onClearDefault,
}: PresetCardProps): React.JSX.Element {
  const colors = useThemeColors();

  // Resolve the tone name from the catalog using DT1 bytes
  const resolvedTone = fp30xToneCatalog.findByDT1(
    preset.tone.category,
    preset.tone.indexHigh,
    preset.tone.indexLow,
  );
  const toneName = resolvedTone?.name ?? 'Unknown Tone';
  const categoryName = resolvedTone?.categoryName ?? '';

  const handlePress = useCallback(() => {
    onApply(preset);
  }, [preset, onApply]);

  const handleLongPress = useCallback(() => {
    const options: {text: string; onPress?: () => void; style?: 'destructive' | 'cancel'}[] = [
      {
        text: 'Rename',
        onPress: () => onRename(preset.id),
      },
      {
        text: preset.isDefault ? 'Remove Default' : 'Set as Default',
        onPress: () => {
          if (preset.isDefault) {
            onClearDefault();
          } else {
            onSetDefault(preset.id);
          }
        },
      },
      {
        text: 'Delete',
        onPress: () => {
          Alert.alert(
            'Delete Preset',
            `Delete "${preset.name}"? This cannot be undone.`,
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Delete', style: 'destructive', onPress: () => onDelete(preset.id)},
            ],
          );
        },
        style: 'destructive',
      },
      {text: 'Cancel', style: 'cancel'},
    ];

    Alert.alert(preset.name, undefined, options);
  }, [preset, onRename, onDelete, onSetDefault, onClearDefault]);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={({pressed}) => ({
        backgroundColor: pressed ? colors.border : colors.surfaceElevated,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: preset.isDefault ? colors.favoriteActive : colors.border,
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      })}>
      <View style={{flex: 1, gap: 4}}>
        {/* Preset name + default badge */}
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <Text
            style={{
              ...typography.headingSm,
              color: colors.text,
            }}
            numberOfLines={1}>
            {preset.name}
          </Text>
          {preset.isDefault && (
            <View
              style={{
                backgroundColor: colors.favoriteActive,
                borderRadius: 4,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}>
              <Text
                style={{
                  ...typography.bodySmall,
                  color: '#000000',
                  fontWeight: '700',
                }}>
                DEFAULT
              </Text>
            </View>
          )}
        </View>

        {/* Tone info: category + tone name in Orbitron */}
        <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 6}}>
          {categoryName ? (
            <Text
              style={{
                ...typography.displayXs,
                color: colors.categoryText,
              }}>
              {categoryName}
            </Text>
          ) : null}
          <Text
            style={{
              ...typography.displaySm,
              color: colors.toneText,
            }}
            numberOfLines={1}>
            {toneName}
          </Text>
        </View>

        {/* Metadata row: volume, tempo */}
        <View style={{flexDirection: 'row', gap: 16, marginTop: 2}}>
          <Text style={{...typography.bodySmall, color: colors.textSecondary}}>
            Vol: {preset.volume}
          </Text>
          <Text style={{...typography.bodySmall, color: colors.textSecondary}}>
            BPM: {preset.tempo}
          </Text>
          {preset.metronomeOn && (
            <Text style={{...typography.bodySmall, color: colors.textSecondary}}>
              Metronome: ON
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}
