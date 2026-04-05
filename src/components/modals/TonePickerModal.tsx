/**
 * T042 + T054: TonePickerModal — Search + tabs tone browser.
 *
 * Top: search bar (by name or number).
 * Two tabs: "Category" (current category tones) / "Favorites" (resolved via useFavorites).
 * FlatList for virtualized tone rendering.
 * useDeferredValue for search filtering (60 FPS).
 *
 * Constitution III: Landscape Hardware-Synth UI.
 */

import React, {useState, useCallback, useDeferredValue, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  FlatList,
  type ListRenderItemInfo,
} from 'react-native';
import {useThemeColors, useIsDark} from '../../hooks/useThemeColors';
import {typography} from '../../theme/typography';
import {palette} from '../../theme/colors';
import {useFavorites} from '../../hooks/useFavorites';
import type {Tone, ToneCategory} from '../../engine/types';

type TabId = 'category' | 'favorites';

interface TonePickerModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Called to close the modal */
  onClose: () => void;
  /** Current category whose tones are shown in the "Category" tab */
  currentCategory: ToneCategory;
  /** All categories for cross-category search results */
  allCategories: ToneCategory[];
  /** Currently active tone (highlighted) */
  activeTone: Tone | null;
  /** Called when a tone is selected */
  onSelectTone: (tone: Tone) => void;
  /** Search function (from useTones) */
  searchByName: (query: string) => Tone[];
}

export function TonePickerModal({
  visible,
  onClose,
  currentCategory,
  allCategories: _allCategories,
  activeTone,
  onSelectTone,
  searchByName,
}: TonePickerModalProps): React.JSX.Element {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const {favorites: resolvedFavorites} = useFavorites();

  const [activeTab, setActiveTab] = useState<TabId>('category');
  const [searchText, setSearchText] = useState('');
  const deferredSearch = useDeferredValue(searchText);

  // Reset state when modal opens
  React.useEffect(() => {
    if (visible) {
      setSearchText('');
      setActiveTab('category');
    }
  }, [visible]);

  // ─── Search Results ────────────────────────────────────────

  const searchResults = useMemo(() => {
    if (!deferredSearch.trim()) return null;

    // Check if query is a number (search by position)
    const asNumber = parseInt(deferredSearch, 10);
    if (!isNaN(asNumber) && deferredSearch.trim() === String(asNumber)) {
      // Search by 1-based number within current category
      const tone = currentCategory.tones[asNumber - 1];
      if (tone) return [tone];
      // Fallback to name search
    }

    return searchByName(deferredSearch);
  }, [deferredSearch, searchByName, currentCategory.tones]);

  // ─── Tab Data ──────────────────────────────────────────────

  const categoryTones = currentCategory.tones;

  const displayData = searchResults ?? (activeTab === 'category' ? categoryTones : resolvedFavorites);
  const isSearching = searchResults !== null;

  // ─── Handlers ──────────────────────────────────────────────

  const handleSelectTone = useCallback(
    (tone: Tone) => {
      onSelectTone(tone);
      onClose();
    },
    [onSelectTone, onClose],
  );

  // ─── Render ────────────────────────────────────────────────

  const renderToneItem = useCallback(
    ({item}: ListRenderItemInfo<Tone>) => {
      const isActive = activeTone?.id === item.id;
      return (
        <Pressable
          onPress={() => handleSelectTone(item)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 6,
            backgroundColor: isActive
              ? isDark
                ? palette.gray600
                : palette.steel200
              : 'transparent',
          }}>
          <View style={{flex: 1}}>
            <Text
              style={{
                ...typography.displaySm,
                color: isActive ? colors.toneText : colors.text,
              }}
              numberOfLines={1}
              allowFontScaling={false}>
              {item.name}
            </Text>
          </View>
          <Text
            style={{
              ...typography.bodySmall,
              color: colors.textMuted,
              marginLeft: 8,
            }}>
            {item.categoryName} #{item.position + 1}
          </Text>
        </Pressable>
      );
    },
    [activeTone, colors, isDark, handleSelectTone],
  );

  const toneKeyExtractor = useCallback((item: Tone) => item.id, []);

  const renderEmptyState = useCallback(() => {
    if (isSearching) {
      return (
        <View style={{padding: 20, alignItems: 'center'}}>
          <Text style={{...typography.body, color: colors.textMuted}}>
            No tones found
          </Text>
        </View>
      );
    }
    if (activeTab === 'favorites') {
      return (
        <View style={{padding: 20, alignItems: 'center'}}>
          <Text style={{...typography.body, color: colors.textMuted}}>
            No favorites yet
          </Text>
          <Text
            style={{
              ...typography.bodySmall,
              color: colors.textMuted,
              marginTop: 4,
            }}>
            Long-press a tone name to add to favorites
          </Text>
        </View>
      );
    }
    return null;
  }, [isSearching, activeTab, colors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)',
        }}
        onPress={onClose}>
        <Pressable
          style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: 12,
            width: '85%',
            maxWidth: 560,
            height: '80%',
            maxHeight: 460,
            overflow: 'hidden',
          }}
          onPress={() => {
            /* Prevent close on inner press */
          }}>
          {/* Search Bar */}
          <View
            style={{
              paddingHorizontal: 14,
              paddingTop: 14,
              paddingBottom: 8,
            }}>
            <TextInput
              style={{
                backgroundColor: isDark ? palette.gray700 : palette.steel100,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 15,
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              placeholder="Search by name or number..."
              placeholderTextColor={colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>

          {/* Tab Bar */}
          {!isSearching && (
            <View
              style={{
                flexDirection: 'row',
                paddingHorizontal: 14,
                gap: 8,
                marginBottom: 4,
              }}>
              <TabButton
                label={`Category (${currentCategory.name})`}
                isActive={activeTab === 'category'}
                onPress={() => setActiveTab('category')}
                colors={colors}
                isDark={isDark}
              />
              <TabButton
                label={`Favorites (${resolvedFavorites.length})`}
                isActive={activeTab === 'favorites'}
                onPress={() => setActiveTab('favorites')}
                colors={colors}
                isDark={isDark}
              />
            </View>
          )}

          {/* Search results header */}
          {isSearching && (
            <Text
              style={{
                ...typography.label,
                color: colors.textSecondary,
                paddingHorizontal: 14,
                marginBottom: 4,
              }}>
              SEARCH RESULTS ({displayData.length})
            </Text>
          )}

          {/* Tone List */}
          <FlatList
            data={displayData}
            keyExtractor={toneKeyExtractor}
            renderItem={renderToneItem}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={{paddingHorizontal: 4, paddingBottom: 8}}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            maxToRenderPerBatch={20}
            windowSize={5}
            keyboardShouldPersistTaps="handled"
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Tab Button Sub-component ────────────────────────────────

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
  isDark: boolean;
}

function TabButton({label, isActive, onPress, colors, isDark}: TabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 8,
        borderRadius: 6,
        alignItems: 'center',
        backgroundColor: isActive
          ? isDark
            ? palette.gray600
            : palette.steel200
          : 'transparent',
        borderWidth: isActive ? 1 : 0,
        borderColor: colors.border,
      }}>
      <Text
        style={{
          ...typography.bodySmall,
          fontWeight: isActive ? '600' : '400',
          color: isActive ? colors.text : colors.textSecondary,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}
