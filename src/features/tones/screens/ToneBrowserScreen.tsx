/**
 * Tone Browser Screen.
 *
 * T032: Landing screen showing built-in tones in a category-filtered grid.
 * Uses FlatList for virtualized rendering per react-native-best-practices.
 *
 * Constitution III: System-Adaptive High-Contrast UI.
 * Constitution VI: Feature-Module Architecture.
 */

import React, {useCallback} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  useColorScheme,
  type ListRenderItem,
} from 'react-native';
import {darkColors, lightColors} from '../../../theme/colors';
import {spacing, grid} from '../../../theme/spacing';
import {CategoryPills} from '../components/CategoryPills';
import {ToneCard} from '../components/ToneCard';
import {useTones} from '../hooks/useTones';
import {useFavoritesStore} from '../../../store/favoritesStore';
import type {Tone} from '../hooks/useTones';

export function ToneBrowserScreen(): React.JSX.Element {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const {tones, selectedCategory, activeToneId, setCategory, selectTone} =
    useTones();
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);

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
        isFavorite={favoriteIds.includes(item.id)}
        onPress={selectTone}
        onLongPress={handleLongPress}
      />
    ),
    [activeToneId, selectTone, favoriteIds, handleLongPress],
  );

  const keyExtractor = useCallback((item: Tone) => item.id, []);

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <CategoryPills selected={selectedCategory} onSelect={setCategory} />
      <FlatList
        data={tones}
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
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  row: {
    gap: grid.gap,
    marginBottom: grid.gap,
  },
});
