/**
 * T041: CategoryPickerModal — Two-column category + tone browser.
 *
 * Left column: all 9 categories (tap to preview tones).
 * Right column: FlatList of tones for the selected category (tap to select + close).
 *
 * Constitution III: Landscape Hardware-Synth UI.
 * Architecture: FlatList for tone lists (virtualized, not ScrollView).
 */

import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  type ListRenderItemInfo,
} from 'react-native';
import {useThemeColors, useIsDark} from '../../hooks/useThemeColors';
import {typography} from '../../theme/typography';
import {palette} from '../../theme/colors';
import type {Tone, ToneCategory} from '../../engine/types';

interface CategoryPickerModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Called to close the modal */
  onClose: () => void;
  /** All tone categories */
  categories: ToneCategory[];
  /** Currently active category (highlighted) */
  currentCategory: ToneCategory;
  /** Currently active tone (highlighted in tone list) */
  activeTone: Tone | null;
  /** Called when a tone is selected */
  onSelectTone: (tone: Tone) => void;
}

export function CategoryPickerModal({
  visible,
  onClose,
  categories,
  currentCategory,
  activeTone,
  onSelectTone,
}: CategoryPickerModalProps): React.JSX.Element {
  const colors = useThemeColors();
  const isDark = useIsDark();

  // Local state: which category's tones are shown in the right column
  const [previewCategoryId, setPreviewCategoryId] = useState(
    currentCategory.id,
  );

  // Reset preview to current category when modal opens
  React.useEffect(() => {
    if (visible) {
      setPreviewCategoryId(currentCategory.id);
    }
  }, [visible, currentCategory.id]);

  const previewCategory = useMemo(
    () => categories.find(c => c.id === previewCategoryId) ?? currentCategory,
    [previewCategoryId, categories, currentCategory],
  );

  const handleSelectTone = useCallback(
    (tone: Tone) => {
      onSelectTone(tone);
      onClose();
    },
    [onSelectTone, onClose],
  );

  const renderCategoryItem = useCallback(
    (cat: ToneCategory) => {
      const isActive = cat.id === previewCategoryId;
      const isCurrent = cat.id === currentCategory.id;
      return (
        <Pressable
          key={cat.id}
          onPress={() => setPreviewCategoryId(cat.id)}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 6,
            backgroundColor: isActive
              ? isDark
                ? palette.gray600
                : palette.steel200
              : 'transparent',
            borderLeftWidth: isCurrent ? 3 : 0,
            borderLeftColor: colors.categoryText,
          }}>
          <Text
            style={{
              ...typography.displaySm,
              color: isActive ? colors.categoryText : colors.textSecondary,
              fontWeight: isCurrent ? '700' : '400',
            }}
            allowFontScaling={false}>
            {cat.name}
          </Text>
          <Text
            style={{
              ...typography.bodySmall,
              color: colors.textMuted,
              marginTop: 2,
            }}>
            {cat.tones.length} tones
          </Text>
        </Pressable>
      );
    },
    [previewCategoryId, currentCategory.id, colors, isDark],
  );

  const renderToneItem = useCallback(
    ({item}: ListRenderItemInfo<Tone>) => {
      const isActive = activeTone?.id === item.id;
      return (
        <Pressable
          onPress={() => handleSelectTone(item)}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 6,
            backgroundColor: isActive
              ? isDark
                ? palette.gray600
                : palette.steel200
              : 'transparent',
          }}>
          <Text
            style={{
              ...typography.displaySm,
              color: isActive ? colors.toneText : colors.text,
            }}
            numberOfLines={1}
            allowFontScaling={false}>
            {item.name}
          </Text>
          <Text
            style={{
              ...typography.bodySmall,
              color: colors.textMuted,
              marginTop: 2,
            }}>
            #{item.position + 1}
            {item.isGM2 ? ' (GM2)' : ' (SN)'}
          </Text>
        </Pressable>
      );
    },
    [activeTone, colors, isDark, handleSelectTone],
  );

  const toneKeyExtractor = useCallback((item: Tone) => item.id, []);

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
            maxWidth: 680,
            height: '75%',
            maxHeight: 420,
            flexDirection: 'row',
            overflow: 'hidden',
          }}
          onPress={() => {
            /* Prevent close on inner press */
          }}>
          {/* Left column: Categories */}
          <View
            style={{
              width: 160,
              borderRightWidth: 1,
              borderRightColor: colors.border,
              paddingVertical: 12,
            }}>
            <Text
              style={{
                ...typography.label,
                color: colors.textSecondary,
                paddingHorizontal: 14,
                marginBottom: 8,
              }}>
              CATEGORIES
            </Text>
            {categories.map(cat => renderCategoryItem(cat))}
          </View>

          {/* Right column: Tones */}
          <View style={{flex: 1, paddingVertical: 12}}>
            <Text
              style={{
                ...typography.label,
                color: colors.categoryText,
                paddingHorizontal: 14,
                marginBottom: 8,
              }}>
              {previewCategory.name.toUpperCase()} ({previewCategory.tones.length})
            </Text>
            <FlatList
              data={previewCategory.tones}
              keyExtractor={toneKeyExtractor}
              renderItem={renderToneItem}
              contentContainerStyle={{paddingHorizontal: 4}}
              showsVerticalScrollIndicator={false}
              initialNumToRender={15}
              maxToRenderPerBatch={20}
              windowSize={5}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
