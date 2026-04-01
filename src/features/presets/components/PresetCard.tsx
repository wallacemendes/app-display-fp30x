/**
 * Preset Card.
 *
 * T053: Card component for displaying a preset.
 * Shows name, default badge, and active state.
 *
 * Constitution III: System-Adaptive High-Contrast UI.
 */

import React, {memo, useCallback} from 'react';
import {View, Text, Pressable, StyleSheet, useColorScheme} from 'react-native';
import {darkColors, lightColors} from '../../../theme/colors';
import {typography} from '../../../theme/typography';
import {spacing, borderRadius} from '../../../theme/spacing';
import type {Preset} from '../../../store/presetsStore';

interface PresetCardProps {
  preset: Preset;
  isActive: boolean;
  toneName: string | null;
  onPress: (preset: Preset) => void;
  onLongPress?: (preset: Preset) => void;
}

function PresetCardInner({
  preset,
  isActive,
  toneName,
  onPress,
  onLongPress,
}: PresetCardProps): React.JSX.Element {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const handlePress = useCallback(() => {
    onPress(preset);
  }, [preset, onPress]);

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      onLongPress(preset);
    }
  }, [preset, onLongPress]);

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: isActive
            ? colors.cardBackgroundActive
            : colors.cardBackground,
        },
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={400}
      accessibilityRole="button"
      accessibilityState={{selected: isActive}}
      accessibilityLabel={`Preset ${preset.name}${isActive ? ', active' : ''}${preset.isDefault ? ', default' : ''}`}>
      <View style={styles.header}>
        <Text
          style={[
            styles.name,
            {color: isActive ? colors.accentText : colors.text},
          ]}
          numberOfLines={1}>
          {preset.name}
        </Text>
        {preset.isDefault && (
          <View
            style={[
              styles.defaultBadge,
              {backgroundColor: isActive ? colors.accentText : colors.accent},
            ]}>
            <Text
              style={[
                styles.defaultText,
                {color: isActive ? colors.accent : colors.accentText},
              ]}>
              DEFAULT
            </Text>
          </View>
        )}
      </View>
      {toneName && (
        <Text
          style={[
            styles.toneName,
            {
              color: isActive
                ? colors.accentText
                : colors.textTertiary,
            },
          ]}
          numberOfLines={1}>
          {toneName}
        </Text>
      )}
    </Pressable>
  );
}

export const PresetCard = memo(PresetCardInner);

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    minHeight: 72,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...typography.h3,
    flex: 1,
  },
  defaultBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  defaultText: {
    ...typography.micro,
    fontWeight: '700',
  },
  toneName: {
    ...typography.bodySmall,
    marginTop: spacing.xxs,
  },
});
