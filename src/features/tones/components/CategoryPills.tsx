/**
 * Category Pills.
 *
 * T029: Horizontal scrollable category filter for tone browser.
 *
 * Constitution III: System-Adaptive High-Contrast UI — WCAG AA contrast.
 */

import React, {useCallback} from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import {darkColors, lightColors} from '../../../theme/colors';
import {typography} from '../../../theme/typography';
import {spacing, borderRadius} from '../../../theme/spacing';
import type {ToneCategory} from '../../../store/appSettingsStore';

interface CategoryPillsProps {
  selected: ToneCategory;
  onSelect: (category: ToneCategory) => void;
}

const CATEGORIES: {key: ToneCategory; label: string}[] = [
  {key: 'piano', label: 'Piano'},
  {key: 'epiano_keys_organ', label: 'E.Piano/Keys/Organ'},
  {key: 'other', label: 'Other'},
  {key: 'drums', label: 'Drums'},
];

export function CategoryPills({
  selected,
  onSelect,
}: CategoryPillsProps): React.JSX.Element {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const renderPill = useCallback(
    (item: {key: ToneCategory; label: string}) => {
      const isActive = item.key === selected;
      return (
        <Pressable
          key={item.key}
          style={[
            styles.pill,
            {
              backgroundColor: isActive
                ? colors.pillBackgroundActive
                : colors.pillBackground,
            },
          ]}
          onPress={() => onSelect(item.key)}
          accessibilityRole="button"
          accessibilityState={{selected: isActive}}
          accessibilityLabel={`${item.label} category`}>
          <Text
            style={[
              styles.pillText,
              {
                color: isActive
                  ? colors.pillTextActive
                  : colors.pillText,
              },
            ]}>
            {item.label}
          </Text>
        </Pressable>
      );
    },
    [selected, onSelect, colors],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {CATEGORIES.map(renderPill)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  pillText: {
    ...typography.caption,
  },
});
