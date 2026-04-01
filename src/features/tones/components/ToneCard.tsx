/**
 * Tone Card.
 *
 * T030: Card component for displaying a tone in the grid.
 * T031: Tap triggers MIDI tone selection.
 * T045: Long-press toggles favorite with haptic feedback.
 *
 * Constitution III: System-Adaptive High-Contrast UI.
 */

import React, {memo, useCallback} from 'react';
import {View, Text, Pressable, StyleSheet, useColorScheme} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {darkColors, lightColors} from '../../../theme/colors';
import {typography} from '../../../theme/typography';
import {spacing, borderRadius} from '../../../theme/spacing';
import type {Tone} from '../hooks/useTones';

interface ToneCardProps {
  tone: Tone;
  isActive: boolean;
  isFavorite?: boolean;
  onPress: (tone: Tone) => void;
  onLongPress?: (tone: Tone) => void;
}

function ToneCardInner({
  tone,
  isActive,
  isFavorite = false,
  onPress,
  onLongPress,
}: ToneCardProps): React.JSX.Element {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const handlePress = useCallback(() => {
    onPress(tone);
  }, [tone, onPress]);

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      ReactNativeHapticFeedback.trigger('impactMedium');
      onLongPress(tone);
    }
  }, [tone, onLongPress]);

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
      accessibilityLabel={`${tone.name}${isActive ? ', selected' : ''}${isFavorite ? ', favorite' : ''}`}>
      <View style={styles.header}>
        <Text
          style={[
            styles.name,
            {color: isActive ? colors.accentText : colors.text},
          ]}
          numberOfLines={1}>
          {tone.name}
        </Text>
        {isFavorite && (
          <Text style={[styles.star, {color: colors.favoriteIcon}]}>
            *
          </Text>
        )}
      </View>
      <Text
        style={[
          styles.detail,
          {
            color: isActive
              ? colors.accentText
              : colors.textTertiary,
          },
        ]}
        numberOfLines={1}>
        {tone.bankMSB}-{tone.bankLSB}-{tone.programChange}
      </Text>
    </Pressable>
  );
}

export const ToneCard = memo(ToneCardInner);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    minHeight: 64,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...typography.bodySmall,
    fontWeight: '600',
    flex: 1,
  },
  star: {
    fontSize: 14,
    marginLeft: spacing.xxs,
  },
  detail: {
    ...typography.micro,
    marginTop: spacing.xxs,
  },
});
