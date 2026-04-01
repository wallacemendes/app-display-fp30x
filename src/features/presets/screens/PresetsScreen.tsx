/**
 * Presets Screen.
 *
 * T055: Displays user presets as a list with apply, default toggle, and delete.
 *
 * Constitution III: System-Adaptive High-Contrast UI.
 */

import React, {useCallback, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
  useColorScheme,
  type ListRenderItem,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {darkColors, lightColors} from '../../../theme/colors';
import {typography} from '../../../theme/typography';
import {spacing, borderRadius} from '../../../theme/spacing';
import {PresetCard} from '../components/PresetCard';
import {usePresets} from '../hooks/usePresets';
import {usePerformanceStore} from '../../../store/performanceStore';
import tones from '../../../data/tones.json';
import gm2Tones from '../../../data/gm2Tones.json';
import type {Preset} from '../../../store/presetsStore';

// Build tone name lookup
const toneNameMap = new Map<string, string>();
for (const t of tones as {id: string; name: string}[]) {
  toneNameMap.set(t.id, t.name);
}
for (const t of gm2Tones as {id: string; name: string}[]) {
  toneNameMap.set(t.id, t.name);
}

export function PresetsScreen(): React.JSX.Element {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const {
    presets,
    activePresetId,
    addPreset,
    deletePreset,
    setDefault,
    applyPreset,
  } = usePresets();

  const sortedPresets = useMemo(
    () => [...presets].sort((a, b) => a.sortOrder - b.sortOrder),
    [presets],
  );

  const handlePress = useCallback(
    (preset: Preset) => {
      applyPreset(preset);
    },
    [applyPreset],
  );

  const handleLongPress = useCallback(
    (preset: Preset) => {
      ReactNativeHapticFeedback.trigger('impactMedium');
      Alert.alert(preset.name, undefined, [
        {
          text: preset.isDefault ? 'Unset Default' : 'Set as Default',
          onPress: () => setDefault(preset.id),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePreset(preset.id),
        },
        {text: 'Cancel', style: 'cancel'},
      ]);
    },
    [setDefault, deletePreset],
  );

  const handleAddPreset = useCallback(() => {
    const activeToneId = usePerformanceStore.getState().activeToneId;
    if (!activeToneId) {
      Alert.alert('No Tone Selected', 'Select a tone first, then save it as a preset.');
      return;
    }
    const toneName = toneNameMap.get(activeToneId) || 'Untitled';
    addPreset(`Preset - ${toneName}`, activeToneId);
  }, [addPreset]);

  const renderItem: ListRenderItem<Preset> = useCallback(
    ({item}) => (
      <PresetCard
        preset={item}
        isActive={item.id === activePresetId}
        toneName={toneNameMap.get(item.toneId) || null}
        onPress={handlePress}
        onLongPress={handleLongPress}
      />
    ),
    [activePresetId, handlePress, handleLongPress],
  );

  const keyExtractor = useCallback((item: Preset) => item.id, []);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Pressable
        style={[styles.addButton, {backgroundColor: colors.accent}]}
        onPress={handleAddPreset}
        accessibilityRole="button"
        accessibilityLabel="Save current tone as preset">
        <Text style={[styles.addButtonText, {color: colors.accentText}]}>
          + Save Current Tone
        </Text>
      </Pressable>

      {sortedPresets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
            No presets yet
          </Text>
          <Text style={[styles.emptyHint, {color: colors.textTertiary}]}>
            Select a tone, then tap the button above to save it
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedPresets}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButton: {
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  addButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.h3,
  },
  emptyHint: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  separator: {
    height: spacing.sm,
  },
});
