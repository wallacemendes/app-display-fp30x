/**
 * GM2 Browser Screen.
 *
 * T040: Displays 256 GM2 tones grouped by family in a scrollable list.
 * Uses FlatList with family sections for virtualized rendering.
 *
 * Constitution III: System-Adaptive High-Contrast UI.
 */

import React, {useCallback} from 'react';
import {
  FlatList,
  StyleSheet,
  useColorScheme,
  type ListRenderItem,
} from 'react-native';
import {darkColors, lightColors} from '../../../theme/colors';
import {spacing} from '../../../theme/spacing';
import {GM2FamilySection} from '../components/GM2FamilySection';
import {useGM2} from '../hooks/useGM2';
import type {GM2FamilyGroup, GM2Tone} from '../hooks/useGM2';

export function GM2BrowserScreen(): React.JSX.Element {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const {groups, activeToneId, selectTone} = useGM2();

  const renderItem: ListRenderItem<GM2FamilyGroup> = useCallback(
    ({item}) => (
      <GM2FamilySection
        family={item.family}
        tones={item.tones}
        activeToneId={activeToneId}
        onTonePress={selectTone as (tone: GM2Tone) => void}
      />
    ),
    [activeToneId, selectTone],
  );

  const keyExtractor = useCallback(
    (item: GM2FamilyGroup) => item.family,
    [],
  );

  return (
    <FlatList
      data={groups}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={[
        styles.container,
        {backgroundColor: colors.background},
      ]}
      style={{backgroundColor: colors.background}}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
