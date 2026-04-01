/**
 * GM2 Family Section.
 *
 * T038: Section component that renders a GM2 family header + tone cards.
 *
 * Constitution III: System-Adaptive High-Contrast UI.
 */

import React, {memo, useCallback} from 'react';
import {View, Text, StyleSheet, useColorScheme} from 'react-native';
import {darkColors, lightColors} from '../../../theme/colors';
import {typography} from '../../../theme/typography';
import {spacing, grid} from '../../../theme/spacing';
import {ToneCard} from '../../tones/components/ToneCard';
import type {GM2Tone} from '../hooks/useGM2';
import type {Tone} from '../../tones/hooks/useTones';

interface GM2FamilySectionProps {
  family: string;
  tones: GM2Tone[];
  activeToneId: string | null;
  onTonePress: (tone: GM2Tone) => void;
}

function GM2FamilySectionInner({
  family,
  tones,
  activeToneId,
  onTonePress,
}: GM2FamilySectionProps): React.JSX.Element {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const handlePress = useCallback(
    (tone: Tone) => {
      onTonePress(tone as GM2Tone);
    },
    [onTonePress],
  );

  // Build rows of 2 for the grid
  const rows: GM2Tone[][] = [];
  for (let i = 0; i < tones.length; i += grid.columnsPhone) {
    rows.push(tones.slice(i, i + grid.columnsPhone));
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.familyHeader, {color: colors.text}]}>
        {family}
      </Text>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((tone) => (
            <ToneCard
              key={tone.id}
              tone={tone}
              isActive={tone.id === activeToneId}
              onPress={handlePress}
            />
          ))}
          {row.length < grid.columnsPhone && <View style={styles.spacer} />}
        </View>
      ))}
    </View>
  );
}

export const GM2FamilySection = memo(GM2FamilySectionInner);

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  familyHeader: {
    ...typography.h3,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: grid.gap,
    marginBottom: grid.gap,
    paddingHorizontal: spacing.lg,
  },
  spacer: {
    flex: 1,
  },
});
