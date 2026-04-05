/**
 * Favorites Screen.
 *
 * T047: Displays saved favorite tones as a card grid.
 * Long-press removes from favorites with haptic feedback.
 *
 * Constitution III: System-Adaptive High-Contrast UI.
 */

import React, {useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useColorScheme,
  type ListRenderItem,
} from 'react-native';
import {darkColors, lightColors} from '../../../theme/colors';
import {typography} from '../../../theme/typography';
import {spacing, grid} from '../../../theme/spacing';
import {ToneCard} from '../../tones/components/ToneCard';
import {useFavorites} from '../hooks/useFavorites';
import type {Tone} from '../../tones/hooks/useTones';

export function FavoritesScreen(): React.JSX.Element {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const {favorites, activeToneId, toggleFavorite, selectTone} = useFavorites();

  const handleLongPress = useCallback(
    (tone: Tone) => {
      toggleFavorite(tone.id);
    },
    [toggleFavorite],
  );

  const renderItem: ListRenderItem<Tone> = useCallback(
    ({item}) => (
      <ToneCard
        tone={item}
        isActive={item.id === activeToneId}
        isFavorite
        onPress={selectTone as (tone: Tone) => void}
        onLongPress={handleLongPress}
      />
    ),
    [activeToneId, selectTone, handleLongPress],
  );

  const keyExtractor = useCallback((item: Tone) => item.id, []);

  if (favorites.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          {backgroundColor: colors.background},
        ]}>
        <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
          No favorites yet
        </Text>
        <Text style={[styles.emptyHint, {color: colors.textTertiary}]}>
          Long-press a tone to add it to favorites
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={grid.columnsPhone}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  row: {
    gap: grid.gap,
    marginBottom: grid.gap,
  },
});
